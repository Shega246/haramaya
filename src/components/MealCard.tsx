import React from 'react';
import { ThumbsUp, ThumbsDown, MessageCircle, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Meal } from '@/hooks/useMeals';

// Import meal images
import doroWot from '@/assets/meals/doro-wot.jpg';
import firfir from '@/assets/meals/firfir.jpg';
import shiro from '@/assets/meals/shiro.jpg';
import tibs from '@/assets/meals/tibs.jpg';
import beyainatu from '@/assets/meals/beyainatu.jpg';
import genfo from '@/assets/meals/genfo.jpg';

interface MealCardProps {
  meal: Meal;
  isToday?: boolean;
  isUpcoming?: boolean;
}

const getMealImage = (foodName: string): string => {
  const name = foodName.toLowerCase();
  if (name.includes('doro') || name.includes('chicken')) return doroWot;
  if (name.includes('firfir')) return firfir;
  if (name.includes('shiro')) return shiro;
  if (name.includes('tibs') || name.includes('beef')) return tibs;
  if (name.includes('beyainatu') || name.includes('platter')) return beyainatu;
  if (name.includes('genfo') || name.includes('kinche')) return genfo;
  // Default to a random image
  const images = [doroWot, firfir, shiro, tibs, beyainatu, genfo];
  return images[Math.floor(Math.random() * images.length)];
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'breakfast':
      return 'bg-breakfast text-white';
    case 'lunch':
      return 'bg-lunch text-white';
    case 'dinner':
      return 'bg-dinner text-white';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });
};

export const MealCard: React.FC<MealCardProps> = ({ meal, isToday, isUpcoming }) => {
  const imageUrl = meal.food_image || getMealImage(meal.food_name);

  return (
    <Card className={`overflow-hidden transition-all duration-300 hover:shadow-medium hover:-translate-y-1 ${
      isToday ? 'ring-2 ring-primary shadow-glow' : ''
    }`}>
      <div className="relative">
        <img 
          src={imageUrl} 
          alt={meal.food_name}
          className="w-full h-40 object-cover"
        />
        <div className="absolute top-2 left-2 flex gap-2">
          <Badge className={getCategoryColor(meal.category)}>
            {meal.category.charAt(0).toUpperCase() + meal.category.slice(1)}
          </Badge>
          {isToday && (
            <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
              Today
            </Badge>
          )}
        </div>
        {isUpcoming && (
          <div className="absolute top-2 right-2">
            <Badge variant="outline" className="bg-card/80 backdrop-blur-sm">
              <Clock className="h-3 w-3 mr-1" />
              {formatDate(meal.date)}
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <h3 className="font-semibold text-lg text-foreground mb-2 line-clamp-1">
          {meal.food_name}
        </h3>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {meal.food_description || 'Delicious Ethiopian cuisine prepared fresh daily.'}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2 text-muted-foreground hover:text-success hover:bg-success/10"
            >
              <ThumbsUp className="h-4 w-4 mr-1" />
              <span className="text-xs">{meal.likes_count}</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <ThumbsDown className="h-4 w-4 mr-1" />
              <span className="text-xs">{meal.dislikes_count}</span>
            </Button>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 px-2 text-muted-foreground hover:text-primary hover:bg-primary/10"
          >
            <MessageCircle className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
