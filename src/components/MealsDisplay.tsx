import React from 'react';
import { Coffee, Sun, Moon, UtensilsCrossed } from 'lucide-react';
import { MealCard } from '@/components/MealCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useTodayMeals, useWeeklyMeals, type Meal } from '@/hooks/useMeals';
import { getEATTime, formatDateForDB } from '@/lib/timezone';

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'breakfast':
      return <Coffee className="h-5 w-5" />;
    case 'lunch':
      return <Sun className="h-5 w-5" />;
    case 'dinner':
      return <Moon className="h-5 w-5" />;
    default:
      return <UtensilsCrossed className="h-5 w-5" />;
  }
};

const MealSkeleton = () => (
  <div className="rounded-lg overflow-hidden bg-card">
    <Skeleton className="h-40 w-full" />
    <div className="p-4 space-y-3">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  </div>
);

export const MealsDisplay: React.FC = () => {
  const { data: todayMeals, isLoading: loadingToday } = useTodayMeals();
  const { data: weeklyMeals, isLoading: loadingWeekly } = useWeeklyMeals();

  const today = formatDateForDB(getEATTime());
  const upcomingMeals = weeklyMeals?.filter(m => m.date !== today) || [];

  // Group upcoming meals by date
  const groupedUpcoming = upcomingMeals.reduce((acc, meal) => {
    if (!acc[meal.date]) {
      acc[meal.date] = [];
    }
    acc[meal.date].push(meal);
    return acc;
  }, {} as Record<string, Meal[]>);

  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    const tomorrow = new Date(getEATTime());
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (formatDateForDB(tomorrow) === dateStr) {
      return 'Tomorrow';
    }
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="space-y-8">
      {/* Today's Meals */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-full bg-primary/10">
            <UtensilsCrossed className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Today's Meals</h2>
        </div>

        {loadingToday ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <MealSkeleton key={i} />)}
          </div>
        ) : todayMeals && todayMeals.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {todayMeals.map(meal => (
              <MealCard key={meal.id} meal={meal} isToday />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-card rounded-lg">
            <UtensilsCrossed className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No meals scheduled for today.</p>
          </div>
        )}
      </section>

      {/* Upcoming Meals */}
      {Object.keys(groupedUpcoming).length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">Upcoming Meals</h2>
          
          <div className="space-y-6">
            {Object.entries(groupedUpcoming).map(([date, meals]) => (
              <div key={date}>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
                  {formatDateHeader(date)}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {meals.map(meal => (
                    <MealCard key={meal.id} meal={meal} isUpcoming />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
