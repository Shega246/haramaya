import React, { useState } from 'react';
import { Plus, Search, Trash2, Edit, Loader2, UtensilsCrossed, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ImageUpload } from '@/components/ImageUpload';

// Import meal images
import doroWot from '@/assets/meals/doro-wot.jpg';
import firfir from '@/assets/meals/firfir.jpg';
import shiro from '@/assets/meals/shiro.jpg';
import tibs from '@/assets/meals/tibs.jpg';
import beyainatu from '@/assets/meals/beyainatu.jpg';
import genfo from '@/assets/meals/genfo.jpg';

interface Meal {
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

type MealCategory = 'breakfast' | 'lunch' | 'dinner';
type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

const getMealImage = (foodName: string): string => {
  const name = foodName.toLowerCase();
  if (name.includes('doro') || name.includes('chicken')) return doroWot;
  if (name.includes('firfir')) return firfir;
  if (name.includes('shiro')) return shiro;
  if (name.includes('tibs') || name.includes('beef')) return tibs;
  if (name.includes('beyainatu') || name.includes('platter')) return beyainatu;
  if (name.includes('genfo') || name.includes('kinche')) return genfo;
  return doroWot;
};

export const MealManagement: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [filterCategory, setFilterCategory] = useState<MealCategory | 'all'>('all');
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    date: '',
    day_of_week: '' as DayOfWeek,
    category: 'breakfast' as MealCategory,
    food_name: '',
    food_description: '',
  });

  const { data: meals, isLoading } = useQuery({
    queryKey: ['adminMeals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .order('date', { ascending: true })
        .order('category', { ascending: true });
      
      if (error) throw error;
      return data as Meal[];
    }
  });

  const addMealMutation = useMutation({
    mutationFn: async (data: typeof formData & { food_image?: string | null }) => {
      const { error } = await supabase.from('meals').insert([{
        ...data,
        food_image: data.food_image || null
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminMeals'] });
      toast({ title: 'Success', description: 'Meal added successfully' });
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const updateMealMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData & { food_image?: string | null } }) => {
      const { error } = await supabase.from('meals').update({
        ...data,
        food_image: data.food_image || null
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminMeals'] });
      toast({ title: 'Success', description: 'Meal updated successfully' });
      setEditingMeal(null);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const deleteMealMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('meals').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminMeals'] });
      toast({ title: 'Success', description: 'Meal deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const resetForm = () => {
    setFormData({
      date: '',
      day_of_week: '' as DayOfWeek,
      category: 'breakfast',
      food_name: '',
      food_description: '',
    });
    setImageUrl(null);
  };

  const handleDateChange = (date: string) => {
    const d = new Date(date);
    const dayIndex = d.getDay();
    const days: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    setFormData({
      ...formData,
      date,
      day_of_week: days[dayIndex]
    });
  };

  const handleEdit = (meal: Meal) => {
    setEditingMeal(meal);
    setImageUrl(meal.food_image);
    setFormData({
      date: meal.date,
      day_of_week: meal.day_of_week as DayOfWeek,
      category: meal.category,
      food_name: meal.food_name,
      food_description: meal.food_description || '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataWithImage = { ...formData, food_image: imageUrl };
    if (editingMeal) {
      updateMealMutation.mutate({ id: editingMeal.id, data: dataWithImage });
    } else {
      addMealMutation.mutate(dataWithImage);
    }
  };

  const filteredMeals = meals?.filter(m => {
    const matchesSearch = m.food_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || m.category === filterCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'breakfast': return 'bg-breakfast';
      case 'lunch': return 'bg-lunch';
      case 'dinner': return 'bg-dinner';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Meal Management</h1>
          <p className="text-muted-foreground">Manage weekly meal schedules</p>
        </div>

        <Dialog open={isAddDialogOpen || !!editingMeal} onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false);
            setEditingMeal(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Meal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingMeal ? 'Edit Meal' : 'Add New Meal'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Meal Image Upload */}
              <div className="flex justify-center">
                <div>
                  <Label className="block text-center mb-2">Meal Image</Label>
                  <ImageUpload
                    bucket="meal-images"
                    currentImage={imageUrl}
                    onUpload={(url) => setImageUrl(url)}
                    onRemove={() => setImageUrl(null)}
                    previewSize="lg"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleDateChange(e.target.value)}
                  required
                />
                {formData.day_of_week && (
                  <p className="text-sm text-muted-foreground mt-1 capitalize">
                    {formData.day_of_week}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: MealCategory) => setFormData({...formData, category: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="breakfast">Breakfast (6:00 AM - 8:00 AM)</SelectItem>
                    <SelectItem value="lunch">Lunch (11:00 AM - 1:00 PM)</SelectItem>
                    <SelectItem value="dinner">Dinner (6:00 PM - 7:00 PM)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="food_name">Food Name</Label>
                <Input
                  id="food_name"
                  value={formData.food_name}
                  onChange={(e) => setFormData({...formData, food_name: e.target.value})}
                  placeholder="e.g., Doro Wot"
                  required
                />
              </div>

              <div>
                <Label htmlFor="food_description">Description</Label>
                <Textarea
                  id="food_description"
                  value={formData.food_description}
                  onChange={(e) => setFormData({...formData, food_description: e.target.value})}
                  placeholder="Describe the meal..."
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    setEditingMeal(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={addMealMutation.isPending || updateMealMutation.isPending}
                >
                  {(addMealMutation.isPending || updateMealMutation.isPending) && (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  )}
                  {editingMeal ? 'Update' : 'Add'} Meal
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search meals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterCategory} onValueChange={(v: MealCategory | 'all') => setFilterCategory(v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="breakfast">Breakfast</SelectItem>
            <SelectItem value="lunch">Lunch</SelectItem>
            <SelectItem value="dinner">Dinner</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Meals Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredMeals.length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center">
            <UtensilsCrossed className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No meals found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMeals.map(meal => (
            <Card key={meal.id} className="overflow-hidden hover:shadow-medium transition-shadow">
              <div className="relative h-32">
                <img 
                  src={meal.food_image || getMealImage(meal.food_name)} 
                  alt={meal.food_name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 flex gap-2">
                  <Badge className={`${getCategoryColor(meal.category)} text-white`}>
                    {meal.category}
                  </Badge>
                </div>
                <div className="absolute top-2 right-2">
                  <Badge variant="outline" className="bg-card/80 backdrop-blur-sm">
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date(meal.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-foreground mb-1">{meal.food_name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {meal.food_description || 'No description'}
                </p>
                <p className="text-xs text-muted-foreground capitalize mb-3">
                  {meal.day_of_week}
                </p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleEdit(meal)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => deleteMealMutation.mutate(meal.id)}
                    disabled={deleteMealMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
