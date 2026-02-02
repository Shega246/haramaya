import React, { useEffect, useState } from 'react';
import { X, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import QRCode from 'react-qr-code';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useLiveClock } from '@/hooks/useLiveClock';
import { getCurrentMealCategory, getNextMealTime, getMealTimeWindowsArray, type MealCategory } from '@/lib/timezone';
import haramayaLogo from '@/assets/haramaya-logo.png';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface QRData {
  studentId: string;
  studentName: string;
  department: string;
  mealCategory: MealCategory;
  timestamp: string;
  signature: string;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose }) => {
  const { student } = useAuth();
  const { formattedTime, formattedDate } = useLiveClock();
  const [currentCategory, setCurrentCategory] = useState<MealCategory>(null);
  const [nextMeal, setNextMeal] = useState<{ category: MealCategory; startsIn: string } | null>(null);

  useEffect(() => {
    const updateMealStatus = () => {
      setCurrentCategory(getCurrentMealCategory());
      setNextMeal(getNextMealTime());
    };

    updateMealStatus();
    const interval = setInterval(updateMealStatus, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const generateQRData = (): string => {
    if (!student || !currentCategory) return '';

    const data: QRData = {
      studentId: student.student_id,
      studentName: `${student.first_name} ${student.last_name}`,
      department: student.department,
      mealCategory: currentCategory,
      timestamp: new Date().toISOString(),
      signature: btoa(`${student.student_id}-${currentCategory}-${Date.now()}`)
    };

    return JSON.stringify(data);
  };

  const getCategoryColor = (category: MealCategory) => {
    switch (category) {
      case 'breakfast':
        return 'bg-breakfast';
      case 'lunch':
        return 'bg-lunch';
      case 'dinner':
        return 'bg-dinner';
      default:
        return 'bg-muted';
    }
  };

  const mealWindows = getMealTimeWindowsArray();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <img src={haramayaLogo} alt="HU" className="h-8 w-8" />
            Cafeteria Entry QR Code
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center py-4">
          {currentCategory ? (
            <>
              {/* Active Meal Time */}
              <Badge className={`${getCategoryColor(currentCategory)} text-white mb-4 text-sm`}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1)} Time Active
              </Badge>

              {/* QR Code */}
              <div className="qr-container bg-white p-6 rounded-2xl shadow-strong">
                <QRCode
                  value={generateQRData()}
                  size={200}
                  level="H"
                  className="mx-auto"
                />
              </div>

              {/* Student Info */}
              <div className="mt-4 text-center">
                <p className="font-semibold text-lg text-foreground">
                  {student?.first_name} {student?.last_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  ID: {student?.student_id}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {student?.department}
                </p>
              </div>

              {/* Time Info */}
              <div className="mt-4 text-center">
                <p className="text-2xl font-bold text-primary">{formattedTime}</p>
                <p className="text-sm text-muted-foreground">{formattedDate}</p>
              </div>

              <p className="mt-4 text-xs text-muted-foreground text-center">
                Present this QR code at the cafeteria entrance
              </p>
            </>
          ) : (
            <>
              {/* Outside Meal Time */}
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
                  <AlertCircle className="h-10 w-10 text-muted-foreground" />
                </div>
                
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Sorry, it's not the time of meal
                </h3>
                
                <p className="text-muted-foreground mb-6">
                  QR codes can only be generated during designated meal times.
                </p>

                {nextMeal && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Next: {nextMeal.category?.charAt(0).toUpperCase()}{nextMeal.category?.slice(1)} in {nextMeal.startsIn}
                    </span>
                  </div>
                )}
              </div>

              {/* Meal Schedule */}
              <div className="w-full mt-4 space-y-2">
                <p className="text-sm font-medium text-muted-foreground text-center mb-3">
                  Meal Schedule
                </p>
                {mealWindows.map(({ category, start, end, isActive }) => (
                  <div 
                    key={category}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      isActive ? 'bg-primary/10 border border-primary/20' : 'bg-muted/50'
                    }`}
                  >
                    <span className="font-medium text-foreground capitalize">{category}</span>
                    <span className="text-sm text-muted-foreground">{start} - {end}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <Button variant="outline" onClick={onClose} className="w-full">
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
};
