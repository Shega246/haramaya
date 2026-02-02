import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, IdCard, Eye, EyeOff, Lock, ArrowRight, Loader2, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/ThemeToggle';
import { supabase } from '@/integrations/supabase/client';
import haramayaLogo from '@/assets/haramaya-logo.png';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { studentLogin, signIn } = useAuth();
  const { toast } = useToast();

  // Student login state
  const [firstName, setFirstName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [studentLoading, setStudentLoading] = useState(false);

  // Admin/Ticker login state
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);

  // Ticker login state
  const [tickerEmail, setTickerEmail] = useState('');
  const [tickerPassword, setTickerPassword] = useState('');
  const [showTickerPassword, setShowTickerPassword] = useState(false);
  const [tickerLoading, setTickerLoading] = useState(false);

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName.trim() || !studentId.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please enter both your first name and student ID.',
        variant: 'destructive'
      });
      return;
    }

    setStudentLoading(true);
    try {
      const { error } = await studentLogin(firstName.trim(), studentId.trim().toUpperCase());

      if (error) {
        toast({
          title: 'Login Failed',
          description: error.message,
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Welcome!',
          description: 'You have successfully logged in.',
        });
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Student login error:', err);
      toast({
        title: 'Login Failed',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setStudentLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!adminEmail.trim() || !adminPassword.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please enter both email and password.',
        variant: 'destructive'
      });
      return;
    }

    setAdminLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: adminEmail.trim(),
        password: adminPassword
      });
      
      if (error) {
        setAdminLoading(false);
        toast({
          title: 'Login Failed',
          description: error.message,
          variant: 'destructive'
        });
        return;
      }

      // Use RPC function to check role (bypasses potential RLS issues)
      const { data: hasAdmin, error: roleError } = await supabase
        .rpc('has_role', { 
          _user_id: data.user.id, 
          _role: 'admin' 
        });

      setAdminLoading(false);

      if (roleError) {
        console.error('Role check error:', roleError);
        await supabase.auth.signOut();
        toast({
          title: 'Login Failed',
          description: 'Could not verify your permissions.',
          variant: 'destructive'
        });
        return;
      }

      if (!hasAdmin) {
        await supabase.auth.signOut();
        toast({
          title: 'Access Denied',
          description: 'You do not have admin privileges.',
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: 'Welcome, Admin!',
        description: 'You have successfully logged in.',
      });
      navigate('/admin');
    } catch (err) {
      setAdminLoading(false);
      console.error('Admin login error:', err);
      toast({
        title: 'Login Failed',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleTickerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tickerEmail.trim() || !tickerPassword.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please enter both email and password.',
        variant: 'destructive'
      });
      return;
    }

    setTickerLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: tickerEmail.trim(),
        password: tickerPassword
      });

      if (error) {
        setTickerLoading(false);
        toast({
          title: 'Login Failed',
          description: error.message,
          variant: 'destructive'
        });
        return;
      }

      // Use RPC function to check role (bypasses potential RLS issues)
      const { data: hasTicker, error: roleError } = await supabase
        .rpc('has_role', { 
          _user_id: data.user.id, 
          _role: 'ticker' 
        });

      setTickerLoading(false);

      if (roleError) {
        console.error('Role check error:', roleError);
        await supabase.auth.signOut();
        toast({
          title: 'Login Failed',
          description: 'Could not verify your permissions.',
          variant: 'destructive'
        });
        return;
      }

      if (!hasTicker) {
        await supabase.auth.signOut();
        toast({
          title: 'Access Denied',
          description: 'You do not have ticker privileges.',
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: 'Welcome, Ticker!',
        description: 'You have successfully logged in.',
      });
      navigate('/ticker');
    } catch (err) {
      setTickerLoading(false);
      console.error('Ticker login error:', err);
      toast({
        title: 'Login Failed',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      {/* Header */}
      <header className="p-4 flex justify-end">
        <ThemeToggle />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-scale-in">
          {/* Logo Section */}
          <div className="text-center mb-8">
            <div className="inline-block p-4 rounded-full bg-card/20 backdrop-blur-sm mb-4">
              <img 
                src={haramayaLogo} 
                alt="Haramaya University" 
                className="h-20 w-20 object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold text-primary-foreground">Haramaya University</h1>
            <p className="text-primary-foreground/80 text-sm mt-1">
              Students Cafeteria Management System
            </p>
          </div>

          {/* Login Card */}
          <Card className="shadow-strong">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl">Welcome Back</CardTitle>
              <CardDescription>Sign in to access the cafeteria system</CardDescription>
            </CardHeader>
            
            <CardContent>
              <Tabs defaultValue="student" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="student" className="gap-1 text-xs sm:text-sm">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">Student</span>
                  </TabsTrigger>
                  <TabsTrigger value="ticker" className="gap-1 text-xs sm:text-sm">
                    <Radio className="h-4 w-4" />
                    <span className="hidden sm:inline">Ticker</span>
                  </TabsTrigger>
                  <TabsTrigger value="admin" className="gap-1 text-xs sm:text-sm">
                    <Lock className="h-4 w-4" />
                    <span className="hidden sm:inline">Admin</span>
                  </TabsTrigger>
                </TabsList>

                {/* Student Login */}
                <TabsContent value="student">
                  <form onSubmit={handleStudentLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="firstName"
                          type="text"
                          placeholder="Enter your first name"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="pl-10"
                          autoComplete="given-name"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="studentId">Student ID</Label>
                      <div className="relative">
                        <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="studentId"
                          type="text"
                          placeholder="e.g., UGR/25001/14"
                          value={studentId}
                          onChange={(e) => setStudentId(e.target.value.toUpperCase())}
                          className="pl-10 uppercase"
                          autoComplete="off"
                        />
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
                      disabled={studentLoading}
                    >
                      {studentLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <ArrowRight className="h-4 w-4 mr-2" />
                      )}
                      Sign In as Student
                    </Button>
                  </form>

                  <p className="text-xs text-muted-foreground text-center mt-4">
                    Use your registered first name and student ID to login.
                    Contact admin if you have issues.
                  </p>
                </TabsContent>

                {/* Ticker Login */}
                <TabsContent value="ticker">
                  <form onSubmit={handleTickerLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="tickerEmail">Email</Label>
                      <div className="relative">
                        <Radio className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="tickerEmail"
                          type="email"
                          placeholder="ticker@haramaya.edu.et"
                          value={tickerEmail}
                          onChange={(e) => setTickerEmail(e.target.value)}
                          className="pl-10"
                          autoComplete="email"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tickerPassword">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="tickerPassword"
                          type={showTickerPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          value={tickerPassword}
                          onChange={(e) => setTickerPassword(e.target.value)}
                          className="pl-10 pr-10"
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowTickerPassword(!showTickerPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showTickerPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={tickerLoading}
                    >
                      {tickerLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Radio className="h-4 w-4 mr-2" />
                      )}
                      Sign In as Ticker
                    </Button>
                  </form>

                  <p className="text-xs text-muted-foreground text-center mt-4">
                    Ticker access is for cafeteria gate operators only.
                  </p>
                </TabsContent>

                {/* Admin Login */}
                <TabsContent value="admin">
                  <form onSubmit={handleAdminLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="adminEmail">Email</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="adminEmail"
                          type="email"
                          placeholder="admin@haramaya.edu.et"
                          value={adminEmail}
                          onChange={(e) => setAdminEmail(e.target.value)}
                          className="pl-10"
                          autoComplete="email"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="adminPassword">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="adminPassword"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          className="pl-10 pr-10"
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={adminLoading}
                    >
                      {adminLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Lock className="h-4 w-4 mr-2" />
                      )}
                      Sign In as Admin
                    </Button>
                  </form>

                  <p className="text-xs text-muted-foreground text-center mt-4">
                    Admin access is restricted to authorized personnel only.
                  </p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Footer */}
          <p className="text-center text-xs text-primary-foreground/60 mt-6">
            © 2024 Haramaya University. All rights reserved.
          </p>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
