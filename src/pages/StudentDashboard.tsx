import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardFooter } from '@/components/DashboardFooter';
import { MealsDisplay } from '@/components/MealsDisplay';
import { QRCodeModal } from '@/components/QRCodeModal';
import { StudentMealHistory } from '@/components/StudentMealHistory';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UtensilsCrossed, History } from 'lucide-react';

const StudentDashboard: React.FC = () => {
  const { student, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/');
    }
  }, [isLoading, user, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DashboardHeader onQRClick={() => setIsQRModalOpen(true)} />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <Tabs defaultValue="meals" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="meals" className="gap-2">
              <UtensilsCrossed className="h-4 w-4" />
              Today's Meals
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              My History
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="meals">
            <MealsDisplay />
          </TabsContent>
          
          <TabsContent value="history">
            <StudentMealHistory />
          </TabsContent>
        </Tabs>
      </main>

      <DashboardFooter />

      <QRCodeModal 
        isOpen={isQRModalOpen} 
        onClose={() => setIsQRModalOpen(false)} 
      />
    </div>
  );
};

export default StudentDashboard;
