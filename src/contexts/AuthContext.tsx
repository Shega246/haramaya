import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js';

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
  blocked_reason?: string | null;
}

interface AuthContextType {
  user: User | null;
  student: Student | null;
  isAdmin: boolean;
  isTicker: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  studentLogin: (firstName: string, studentId: string) => Promise<{ error: Error | null }>;
  refreshStudent: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isTicker, setIsTicker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isInitialized = useRef(false);
  const authChangeInProgress = useRef(false);

  // Fetch user roles and student data
  const fetchUserData = async (userId: string): Promise<{
    isAdmin: boolean;
    isTicker: boolean;
    student: Student | null;
  }> => {
    try {
      // Check admin role using RPC
      const { data: hasAdmin } = await supabase.rpc('has_role', {
        _user_id: userId,
        _role: 'admin'
      });

      // Check ticker role using RPC
      const { data: hasTicker } = await supabase.rpc('has_role', {
        _user_id: userId,
        _role: 'ticker'
      });

      // Get student data if exists
      const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      return {
        isAdmin: !!hasAdmin,
        isTicker: !!hasTicker,
        student: studentData as Student | null
      };
    } catch (error) {
      console.error('Error fetching user data:', error);
      return { isAdmin: false, isTicker: false, student: null };
    }
  };

  // Handle auth state changes
  const handleAuthChange = async (event: AuthChangeEvent, session: Session | null) => {
    // Prevent concurrent auth changes
    if (authChangeInProgress.current) return;
    authChangeInProgress.current = true;

    try {
      if (session?.user) {
        setUser(session.user);
        
        // Fetch user data with timeout protection
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 10000)
        );
        
        try {
          const userData = await Promise.race([
            fetchUserData(session.user.id),
            timeoutPromise
          ]);
          
          setIsAdmin(userData.isAdmin);
          setIsTicker(userData.isTicker);
          if (userData.student) {
            setStudent(userData.student);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Set defaults on error
          setIsAdmin(false);
          setIsTicker(false);
        }
      } else {
        // Clear all state on sign out
        setUser(null);
        setStudent(null);
        setIsAdmin(false);
        setIsTicker(false);
      }
    } finally {
      authChangeInProgress.current = false;
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Prevent double initialization
    if (isInitialized.current) return;
    isInitialized.current = true;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange);

    // Then get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        handleAuthChange('INITIAL_SESSION' as AuthChangeEvent, session);
      } else {
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: window.location.origin
      }
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    // Clear all local state FIRST to prevent UI hangs
    setStudent(null);
    setIsAdmin(false);
    setIsTicker(false);
    setUser(null);
    
    try {
      // Sign out from Supabase (with error handling)
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const studentLogin = async (firstName: string, studentId: string) => {
    // Normalize inputs
    const normalizedFirstName = firstName.trim();
    const normalizedStudentId = studentId.trim().toUpperCase();

    if (!normalizedFirstName || !normalizedStudentId) {
      return { error: new Error('Please enter both first name and student ID.') };
    }

    try {
      // Find student by first name (case-insensitive) and student ID
      const { data: studentData, error: fetchError } = await supabase
        .from('students')
        .select('*')
        .ilike('first_name', normalizedFirstName)
        .eq('student_id', normalizedStudentId)
        .maybeSingle();

      if (fetchError) {
        console.error('Student lookup error:', fetchError);
        return { error: new Error('Failed to verify student. Please try again.') };
      }

      if (!studentData) {
        // Try a more flexible search
        const { data: altSearch } = await supabase
          .from('students')
          .select('*')
          .ilike('first_name', normalizedFirstName);
        
        if (altSearch && altSearch.length > 0) {
          return { error: new Error('Student found but ID does not match. Please check your Student ID.') };
        }
        
        return { error: new Error('Student not found. Please check your first name and student ID.') };
      }

      // Check if student is blocked
      if (studentData.status === 'blocked') {
        const reason = studentData.blocked_reason || 'Your account has been blocked.';
        return { error: new Error(`Access denied: ${reason}`) };
      }

      // Check if student status is expired
      if (studentData.status === 'expired') {
        return { error: new Error('Your semester has expired. Please contact the administration office.') };
      }

      // Check semester expiry date
      const expiryDate = new Date(studentData.semester_expiry_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (expiryDate < today) {
        return { error: new Error('Your semester has expired. Please contact the administration office to renew.') };
      }

      // Create email and password from student_id
      const email = `${normalizedStudentId.toLowerCase().replace(/\//g, '-')}@student.haramaya.edu.et`;
      const password = `HU_${normalizedStudentId}_2024`;

      // Try to sign in first
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (!signInError && signInData.user) {
        // Sign in successful - update student state
        setStudent(studentData as Student);
        
        // Link student to user if not already linked
        if (!studentData.user_id) {
          await supabase
            .from('students')
            .update({ user_id: signInData.user.id })
            .eq('id', studentData.id);
        }
        
        return { error: null };
      }

      // If sign in fails, try to create account
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            student_id: studentData.id,
            first_name: studentData.first_name,
            last_name: studentData.last_name
          }
        }
      });

      if (signUpError) {
        console.error('Student auth error:', signUpError);
        return { error: new Error('Authentication failed. Please try again or contact support.') };
      }

      // Link student to user
      if (signUpData.user) {
        await supabase
          .from('students')
          .update({ user_id: signUpData.user.id })
          .eq('id', studentData.id);
          
        setStudent(studentData as Student);
      }

      return { error: null };
    } catch (error) {
      console.error('Student login error:', error);
      return { error: new Error('An unexpected error occurred. Please try again.') };
    }
  };

  const refreshStudent = async () => {
    if (!user) return;
    
    const { data: studentData } = await supabase
      .from('students')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
      
    if (studentData) {
      setStudent(studentData as Student);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      student,
      isAdmin,
      isTicker,
      isLoading,
      signIn,
      signUp,
      signOut,
      studentLogin,
      refreshStudent
    }}>
      {children}
    </AuthContext.Provider>
  );
};
