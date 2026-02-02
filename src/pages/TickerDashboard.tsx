import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Camera, Keyboard, Check, X, Loader2, LogOut, User, 
  AlertTriangle, Clock, QrCode, RefreshCw 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { QRScanner } from '@/components/QRScanner';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getEATDate, isWithinMealTime, getCurrentMealCategory, getMealTimeWindows } from '@/lib/timezone';
import haramayaLogo from '@/assets/haramaya-logo.png';
import defaultAvatar from '@/assets/default-avatar.png';
import { useLiveClock } from '@/hooks/useLiveClock';
import type { Database } from '@/integrations/supabase/types';

type MealCategory = Database['public']['Enums']['meal_category'];

interface Student {
  id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  department: string;
  year: number;
  semester: number;
  semester_expiry_date: string;
  status: 'active' | 'expired' | 'blocked';
  blocked_reason?: string;
}

interface VerificationResult {
  success: boolean;
  student: Student | null;
  reason: string;
  message: string;
}

const TickerDashboard: React.FC = () => {
  const { user, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { formattedTime, formattedDate } = useLiveClock();
  
  const [mode, setMode] = useState<'qr' | 'manual'>('manual');
  const [studentIdInput, setStudentIdInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isTicker, setIsTicker] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);

  // Check if user is ticker
  useEffect(() => {
    const checkTickerRole = async () => {
      if (!user) {
        setCheckingRole(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'ticker')
          .maybeSingle();
        
        if (error) {
          console.error('Role check error:', error);
        }
        
        setIsTicker(!!data);
        
        if (!data) {
          toast({
            title: 'Access Denied',
            description: 'You do not have ticker privileges. Please contact administrator.',
            variant: 'destructive'
          });
          navigate('/');
        }
      } catch (err) {
        console.error('Role check failed:', err);
      } finally {
        setCheckingRole(false);
      }
    };

    if (!isLoading) {
      if (!user) {
        navigate('/');
      } else {
        checkTickerRole();
      }
    }
  }, [user, isLoading, navigate, toast]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const verifyStudent = async (studentId: string, method: 'qr' | 'manual'): Promise<VerificationResult> => {
    // Normalize student ID
    const normalizedId = studentId.trim().toUpperCase();

    // Check meal time first
    if (!isWithinMealTime()) {
      const mealWindows = getMealTimeWindows();
      return {
        success: false,
        student: null,
        reason: 'time_invalid',
        message: `Not meal time. Schedule: Breakfast ${mealWindows.breakfast.start}-${mealWindows.breakfast.end}, Lunch ${mealWindows.lunch.start}-${mealWindows.lunch.end}, Dinner ${mealWindows.dinner.start}-${mealWindows.dinner.end}`
      };
    }

    // Find student
    const { data: student, error } = await supabase
      .from('students')
      .select('*')
      .eq('student_id', normalizedId)
      .maybeSingle();

    if (error || !student) {
      return {
        success: false,
        student: null,
        reason: 'not_found',
        message: 'Student not found in the system.'
      };
    }

    // Check if blocked
    if (student.status === 'blocked') {
      return {
        success: false,
        student: student as Student,
        reason: 'blocked',
        message: student.blocked_reason || 'Student is blocked from cafeteria.'
      };
    }

    // Check if expired
    if (student.status === 'expired') {
      return {
        success: false,
        student: student as Student,
        reason: 'expired',
        message: 'Student semester has expired. Please contact admin.'
      };
    }

    // Check semester expiry date
    const expiryDate = new Date(student.semester_expiry_date);
    const today = getEATDate();
    if (expiryDate < today) {
      return {
        success: false,
        student: student as Student,
        reason: 'expired',
        message: 'Student semester has expired. Please contact admin.'
      };
    }

    // Get current meal category
    const mealCategory = getCurrentMealCategory();
    if (!mealCategory) {
      return {
        success: false,
        student: student as Student,
        reason: 'time_invalid',
        message: 'Unable to determine current meal category.'
      };
    }

    // Check for duplicate meal today
    const todayStr = today.toISOString().split('T')[0];
    const { data: existingLog } = await supabase
      .from('verification_logs')
      .select('id')
      .eq('student_id', student.id)
      .eq('meal_category', mealCategory)
      .eq('verification_date', todayStr)
      .eq('verification_result', true)
      .maybeSingle();

    if (existingLog) {
      // This is a duplicate - log it
      await logVerification(student, mealCategory, false, 'duplicate', method);
      
      return {
        success: false,
        student: student as Student,
        reason: 'duplicate',
        message: `Already received ${mealCategory} today. CHEATING ATTEMPT LOGGED!`
      };
    }

    // Success - log the verification
    await logVerification(student, mealCategory, true, 'valid', method);

    return {
      success: true,
      student: student as Student,
      reason: 'valid',
      message: `Verified for ${mealCategory}. Proceed to serving.`
    };
  };

  const logVerification = async (
    student: Student,
    mealCategory: MealCategory,
    result: boolean,
    reason: string,
    method: 'qr' | 'manual'
  ) => {
    // Get today's meal
    const today = getEATDate();
    const todayStr = today.toISOString().split('T')[0];

    const { data: meal } = await supabase
      .from('meals')
      .select('id')
      .eq('date', todayStr)
      .eq('category', mealCategory)
      .maybeSingle();

    await supabase.from('verification_logs').insert({
      student_id: student.id,
      student_id_text: student.student_id,
      student_name: `${student.first_name} ${student.last_name}`,
      meal_category: mealCategory,
      meal_id: meal?.id || null,
      verification_result: result,
      result_reason: reason,
      ticker_id: user?.id || '',
      verification_method: method
    });
  };

  const handleManualVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentIdInput.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a student ID',
        variant: 'destructive'
      });
      return;
    }

    setIsVerifying(true);
    const result = await verifyStudent(studentIdInput.trim(), 'manual');
    setVerificationResult(result);
    setIsVerifying(false);

    if (!result.success) {
      toast({
        title: 'Verification Failed',
        description: result.message,
        variant: 'destructive'
      });
    }
  };

  const handleQRScan = async (data: string) => {
    if (isVerifying) return;

    try {
      // Parse QR data - expecting JSON with studentId
      const qrData = JSON.parse(data);
      const studentId = qrData.studentId || qrData.student_id;

      if (!studentId) {
        setVerificationResult({
          success: false,
          student: null,
          reason: 'invalid_qr',
          message: 'Invalid QR code format.'
        });
        return;
      }

      setIsVerifying(true);
      setMode('manual'); // Stop scanning
      const result = await verifyStudent(studentId, 'qr');
      setVerificationResult(result);
      setIsVerifying(false);
    } catch (e) {
      // Try treating the raw data as student ID
      setIsVerifying(true);
      setMode('manual'); // Stop scanning
      const result = await verifyStudent(data.trim(), 'qr');
      setVerificationResult(result);
      setIsVerifying(false);
    }
  };

  const resetVerification = () => {
    setVerificationResult(null);
    setStudentIdInput('');
  };

  if (isLoading || checkingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isTicker) {
    return null;
  }

  const currentMealCategory = getCurrentMealCategory();
  const isMealTime = isWithinMealTime();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <img src={haramayaLogo} alt="HU" className="h-10 w-10" />
            <div>
              <h1 className="font-bold text-foreground">Cafeteria Gate</h1>
              <p className="text-xs text-muted-foreground">Ticker Verification</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{formattedTime}</p>
              <p className="text-xs text-muted-foreground">{formattedDate}</p>
            </div>
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5 text-destructive" />
            </Button>
          </div>
        </div>
      </header>

      {/* Current Meal Status */}
      <div className={`py-3 text-center ${isMealTime ? 'bg-primary text-primary-foreground' : 'bg-destructive text-destructive-foreground'}`}>
        {isMealTime ? (
          <p className="font-semibold flex items-center justify-center gap-2">
            <Check className="h-5 w-5" />
            Serving: {currentMealCategory?.toUpperCase()}
          </p>
        ) : (
          <p className="font-semibold flex items-center justify-center gap-2">
            <X className="h-5 w-5" />
            CAFETERIA CLOSED
          </p>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 max-w-4xl mx-auto w-full">
        {/* Verification Result */}
        {verificationResult ? (
          <div className="space-y-4 animate-scale-in">
            <Card className={`border-4 ${verificationResult.success ? 'border-primary bg-primary/5' : 'border-destructive bg-destructive/5'}`}>
              <CardContent className="p-8 text-center">
                <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-6 ${
                  verificationResult.success ? 'bg-primary text-primary-foreground' : 'bg-destructive text-destructive-foreground'
                }`}>
                  {verificationResult.success ? (
                    <Check className="h-16 w-16" />
                  ) : (
                    <X className="h-16 w-16" />
                  )}
                </div>

                <h2 className={`text-4xl font-bold mb-4 ${
                  verificationResult.success ? 'text-primary' : 'text-destructive'
                }`}>
                  {verificationResult.success ? 'YES' : 'NO'}
                </h2>

                {verificationResult.student && (
                  <div className="flex items-center justify-center gap-4 mb-4 p-4 bg-card rounded-lg">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={verificationResult.student.photo_url || defaultAvatar} />
                      <AvatarFallback>
                        {verificationResult.student.first_name[0]}
                        {verificationResult.student.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <p className="font-bold text-xl">
                        {verificationResult.student.first_name} {verificationResult.student.last_name}
                      </p>
                      <p className="text-muted-foreground">{verificationResult.student.student_id}</p>
                      <p className="text-sm text-muted-foreground">{verificationResult.student.department}</p>
                    </div>
                  </div>
                )}

                <p className={`text-lg ${verificationResult.success ? 'text-foreground' : 'text-destructive'}`}>
                  {verificationResult.message}
                </p>

                {verificationResult.reason === 'duplicate' && (
                  <Badge variant="destructive" className="mt-4 text-lg py-2 px-4">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    CHEATING ATTEMPT
                  </Badge>
                )}
              </CardContent>
            </Card>

            <Button 
              onClick={resetVerification} 
              className="w-full h-16 text-xl"
              variant={verificationResult.success ? 'default' : 'outline'}
            >
              <RefreshCw className="h-6 w-6 mr-2" />
              Next Student
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Mode Toggle */}
            <div className="flex gap-4">
              <Button
                variant={mode === 'qr' ? 'default' : 'outline'}
                className="flex-1 h-16 text-lg"
                onClick={() => setMode('qr')}
              >
                <Camera className="h-6 w-6 mr-2" />
                Scan QR
              </Button>
              <Button
                variant={mode === 'manual' ? 'default' : 'outline'}
                className="flex-1 h-16 text-lg"
                onClick={() => setMode('manual')}
              >
                <Keyboard className="h-6 w-6 mr-2" />
                Manual Entry
              </Button>
            </div>

            {/* QR Scanner */}
            {mode === 'qr' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="h-5 w-5" />
                    Scan Student QR Code
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <QRScanner 
                    onScan={handleQRScan}
                    isActive={mode === 'qr' && !verificationResult}
                    onError={(err) => {
                      toast({
                        title: 'Scanner Error',
                        description: err,
                        variant: 'destructive'
                      });
                    }}
                  />
                  <p className="text-sm text-muted-foreground text-center mt-4">
                    Position the QR code within the scanner frame
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Manual Entry */}
            {mode === 'manual' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Enter Student ID
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleManualVerify} className="space-y-4">
                    <Input
                      placeholder="e.g., UGR/25001/14"
                      value={studentIdInput}
                      onChange={(e) => setStudentIdInput(e.target.value.toUpperCase())}
                      className="text-xl h-16 text-center uppercase"
                      autoComplete="off"
                      autoFocus
                    />
                    <Button 
                      type="submit" 
                      className="w-full h-16 text-xl"
                      disabled={isVerifying || !studentIdInput.trim()}
                    >
                      {isVerifying ? (
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      ) : (
                        <Check className="h-6 w-6 mr-2" />
                      )}
                      Verify Student
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Loading State */}
            {isVerifying && (
              <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="text-center">
                  <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-lg font-semibold">Verifying...</p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border p-4 text-center">
        <p className="text-sm text-muted-foreground">
          {formattedTime} EAT • {formattedDate}
        </p>
      </footer>
    </div>
  );
};

export default TickerDashboard;
