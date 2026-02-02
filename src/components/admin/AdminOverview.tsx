import React from 'react';
import { 
  Users, UserCheck, UserX, Ban, UtensilsCrossed, 
  AlertTriangle, Radio, TrendingUp 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getEATDate } from '@/lib/timezone';
import { Loader2 } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, description, variant = 'default' }) => {
  const variantStyles = {
    default: 'border-border',
    success: 'border-primary/50 bg-primary/5',
    warning: 'border-yellow-500/50 bg-yellow-500/5',
    danger: 'border-destructive/50 bg-destructive/5',
  };

  return (
    <Card className={`${variantStyles[variant]}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};

export const AdminOverview: React.FC = () => {
  const todayStr = getEATDate().toISOString().split('T')[0];

  // Fetch student stats
  const { data: studentStats, isLoading: loadingStudents } = useQuery({
    queryKey: ['adminStudentStats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('status');
      
      if (error) throw error;

      const total = data.length;
      const active = data.filter(s => s.status === 'active').length;
      const expired = data.filter(s => s.status === 'expired').length;
      const blocked = data.filter(s => s.status === 'blocked').length;

      return { total, active, expired, blocked };
    }
  });

  // Fetch today's meal stats
  const { data: mealStats, isLoading: loadingMeals } = useQuery({
    queryKey: ['adminMealStats', todayStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('verification_logs')
        .select('verification_result, result_reason')
        .eq('verification_date', todayStr);
      
      if (error) throw error;

      const mealsServed = data.filter(l => l.verification_result === true).length;
      const cheatingAttempts = data.filter(l => l.result_reason === 'duplicate').length;

      return { mealsServed, cheatingAttempts };
    }
  });

  // Fetch active tickers
  const { data: tickerStats, isLoading: loadingTickers } = useQuery({
    queryKey: ['adminTickerStats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'ticker');
      
      if (error) throw error;

      return { activeTickers: data.length };
    }
  });

  // Fetch recent logs
  const { data: recentLogs, isLoading: loadingLogs } = useQuery({
    queryKey: ['adminRecentLogs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('verification_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    }
  });

  if (loadingStudents || loadingMeals || loadingTickers) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard Overview</h1>
        <p className="text-muted-foreground">Real-time cafeteria monitoring</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={studentStats?.total || 0}
          icon={<Users className="h-5 w-5" />}
          description="Registered students"
        />
        <StatCard
          title="Active Students"
          value={studentStats?.active || 0}
          icon={<UserCheck className="h-5 w-5" />}
          description="Eligible for meals"
          variant="success"
        />
        <StatCard
          title="Expired Students"
          value={studentStats?.expired || 0}
          icon={<UserX className="h-5 w-5" />}
          description="Semester ended"
          variant="warning"
        />
        <StatCard
          title="Blocked Students"
          value={studentStats?.blocked || 0}
          icon={<Ban className="h-5 w-5" />}
          description="Access denied"
          variant="danger"
        />
      </div>

      {/* Today's Activity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Meals Served Today"
          value={mealStats?.mealsServed || 0}
          icon={<UtensilsCrossed className="h-5 w-5" />}
          description={todayStr}
          variant="success"
        />
        <StatCard
          title="Cheating Attempts Today"
          value={mealStats?.cheatingAttempts || 0}
          icon={<AlertTriangle className="h-5 w-5" />}
          description="Duplicate meal attempts"
          variant={mealStats?.cheatingAttempts ? 'danger' : 'default'}
        />
        <StatCard
          title="Active Tickers"
          value={tickerStats?.activeTickers || 0}
          icon={<Radio className="h-5 w-5" />}
          description="Gate operators"
        />
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recent Verifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingLogs ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : recentLogs && recentLogs.length > 0 ? (
            <div className="space-y-3">
              {recentLogs.map((log) => (
                <div 
                  key={log.id} 
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{log.student_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {log.student_id_text} • {log.meal_category}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={log.verification_result ? 'default' : 'destructive'}
                    >
                      {log.verification_result ? 'YES' : 'NO'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No recent verifications
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
