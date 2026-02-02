import React from 'react';
import { Search, Loader2, History, Calendar, User, UtensilsCrossed } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface MealLog {
  id: string;
  student_id: string;
  meal_id: string;
  category: 'breakfast' | 'lunch' | 'dinner';
  served_at: string;
  qr_validation_timestamp: string;
  students: {
    first_name: string;
    last_name: string;
    student_id: string;
  };
  meals: {
    food_name: string;
    date: string;
  };
}

export const MealLogs: React.FC = () => {
  const [searchQuery, setSearchQuery] = React.useState('');

  const { data: logs, isLoading } = useQuery({
    queryKey: ['mealLogs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meal_logs')
        .select(`
          *,
          students (first_name, last_name, student_id),
          meals (food_name, date)
        `)
        .order('served_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as MealLog[];
    }
  });

  const filteredLogs = logs?.filter(log => 
    log.students?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.students?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.students?.student_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.meals?.food_name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'breakfast': return 'bg-breakfast';
      case 'lunch': return 'bg-lunch';
      case 'dinner': return 'bg-dinner';
      default: return 'bg-muted';
    }
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Meal Logs</h1>
        <p className="text-muted-foreground">View cafeteria serving history</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by student or meal..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Logs List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredLogs.length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center">
            <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No meal logs found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map(log => (
            <Card key={log.id} className="hover:shadow-soft transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-full bg-primary/10">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        {log.students?.first_name} {log.students?.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {log.students?.student_id}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-1">
                        <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{log.meals?.food_name}</span>
                      </div>
                      <Badge className={`${getCategoryColor(log.category)} text-white`}>
                        {log.category}
                      </Badge>
                    </div>
                    
                    <div className="text-right text-sm text-muted-foreground hidden sm:block">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDateTime(log.served_at)}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="sm:hidden mt-3 text-xs text-muted-foreground">
                  Served: {formatDateTime(log.served_at)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
