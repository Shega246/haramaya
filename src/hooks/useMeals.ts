import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getEATTime, getDayOfWeek, formatDateForDB } from '@/lib/timezone';

export interface Meal {
  id: string;
  date: string;
  day_of_week: string;
  category: 'breakfast' | 'lunch' | 'dinner';
  food_name: string;
  food_image: string | null;
  food_description: string | null;
  likes_count: number;
  dislikes_count: number;
}

export const useMeals = () => {
  return useQuery({
    queryKey: ['meals'],
    queryFn: async () => {
      const today = getEATTime();
      const todayStr = formatDateForDB(today);
      
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .gte('date', todayStr)
        .order('date', { ascending: true })
        .order('category', { ascending: true });

      if (error) throw error;
      return data as Meal[];
    }
  });
};

export const useTodayMeals = () => {
  return useQuery({
    queryKey: ['todayMeals'],
    queryFn: async () => {
      const today = getEATTime();
      const todayStr = formatDateForDB(today);
      
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .eq('date', todayStr)
        .order('category', { ascending: true });

      if (error) throw error;
      return data as Meal[];
    }
  });
};

export const useWeeklyMeals = () => {
  return useQuery({
    queryKey: ['weeklyMeals'],
    queryFn: async () => {
      const today = getEATTime();
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + 7);
      
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .gte('date', formatDateForDB(today))
        .lte('date', formatDateForDB(endDate))
        .order('date', { ascending: true })
        .order('category', { ascending: true });

      if (error) throw error;
      return data as Meal[];
    }
  });
};
