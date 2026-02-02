import React, { useState } from 'react';
import { Calendar, Clock, Check, X, Filter, Loader2, UtensilsCrossed } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import type { Database } from '@/integrations/supabase/types';

type MealCategory = Database['public']['Enums']['meal_category'];

interface MealHistoryItem {
  id: string;
  verification_date: string;
  verification_time: string;
  meal_category: MealCategory;
  verification_result: boolean;
  result_reason: string;
  meal?: {
    food_name: string;
    food_image: string | null;
    food_description: string | null;
  } | null;
}

export const StudentMealHistory: React.FC = () => {
  const { student } = useAuth();
  const [dateFilter, setDateFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<MealCategory | 'all'>('all');

  const { data: history, isLoading } = useQuery({
    queryKey: ['mealHistory', student?.id],
    queryFn: async () => {
      if (!student?.id) return [];
      
      const { data, error } = await supabase
        .from('verification_logs')
        .select(`
          id,
          verification_date,
          verification_time,
          meal_category,
          verification_result,
          result_reason,
          meal:meals (
            food_name,
            food_image,
            food_description
          )
        `)
        .eq('student_id', student.id)
        .order('verification_date', { ascending: false })
        .order('verification_time', { ascending: false });
      
      if (error) throw error;
      return (data || []) as MealHistoryItem[];
    },
    enabled: !!student?.id
  });

  const filteredHistory = history?.filter(item => {
    const matchesDate = !dateFilter || item.verification_date === dateFilter;
    const matchesCategory = categoryFilter === 'all' || item.meal_category === categoryFilter;
    return matchesDate && matchesCategory;
  }) || [];

  const getCategoryColor = (category: MealCategory) => {
    switch (category) {
      case 'breakfast': return 'bg-breakfast';
      case 'lunch': return 'bg-lunch';
      case 'dinner': return 'bg-dinner';
      default: return 'bg-muted';
    }
  };

  const getCategoryTime = (category: MealCategory) => {
    switch (category) {
      case 'breakfast': return '6:00 AM - 8:00 AM';
      case 'lunch': return '11:00 AM - 1:00 PM';
      case 'dinner': return '6:00 PM - 7:00 PM';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeStr: string) => {
    // Parse time string (could be in various formats)
    try {
      const parts = timeStr.split(':');
      const hours = parseInt(parts[0]);
      const minutes = parts[1] || '00';
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${minutes} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  if (!student) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UtensilsCrossed className="h-5 w-5" />
          My Meal History
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full"
            />
          </div>
          <Select 
            value={categoryFilter} 
            onValueChange={(v) => setCategoryFilter(v as MealCategory | 'all')}
          >
            <SelectTrigger className="w-full sm:w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Meals</SelectItem>
              <SelectItem value="breakfast">Breakfast</SelectItem>
              <SelectItem value="lunch">Lunch</SelectItem>
              <SelectItem value="dinner">Dinner</SelectItem>
            </SelectContent>
          </Select>
          {(dateFilter || categoryFilter !== 'all') && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setDateFilter('');
                setCategoryFilter('all');
              }}
            >
              Clear
            </Button>
          )}
        </div>

        {/* History List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="text-center py-12">
            <UtensilsCrossed className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {history?.length === 0 ? 'No meal history yet' : 'No meals match your filters'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredHistory.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-4 p-4 rounded-lg border ${
                  item.verification_result 
                    ? 'bg-primary/5 border-primary/20' 
                    : 'bg-destructive/5 border-destructive/20'
                }`}
              >
                {/* Result Icon */}
                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                  item.verification_result ? 'bg-primary text-primary-foreground' : 'bg-destructive text-destructive-foreground'
                }`}>
                  {item.verification_result ? (
                    <Check className="h-6 w-6" />
                  ) : (
                    <X className="h-6 w-6" />
                  )}
                </div>

                {/* Meal Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`${getCategoryColor(item.meal_category)} text-white`}>
                      {item.meal_category}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {getCategoryTime(item.meal_category)}
                    </span>
                  </div>
                  
                  <p className="font-medium text-foreground mt-1">
                    {item.meal?.food_name || `${item.meal_category.charAt(0).toUpperCase() + item.meal_category.slice(1)} Meal`}
                  </p>
                  
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(item.verification_date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTime(item.verification_time)}
                    </span>
                  </div>

                  {!item.verification_result && (
                    <p className="text-sm text-destructive mt-1 capitalize">
                      Reason: {item.result_reason.replace('_', ' ')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats Summary */}
        {history && history.length > 0 && (
          <div className="pt-4 border-t border-border">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">
                  {history.filter(h => h.verification_result).length}
                </p>
                <p className="text-xs text-muted-foreground">Meals Served</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-destructive">
                  {history.filter(h => !h.verification_result).length}
                </p>
                <p className="text-xs text-muted-foreground">Denied</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {history.length}
                </p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
