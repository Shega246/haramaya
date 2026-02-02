// Ethiopian timezone utilities for East Africa Time (EAT, UTC+3)

export const EAT_OFFSET = 3; // UTC+3

export const getEATTime = (): Date => {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utc + (EAT_OFFSET * 3600000));
};

// Alias for clarity
export const getEATDate = getEATTime;

export const formatEATDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Africa/Addis_Ababa'
  });
};

export const formatEATTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Africa/Addis_Ababa'
  });
};

export type MealCategory = 'breakfast' | 'lunch' | 'dinner' | null;

export interface MealTimeWindow {
  category: MealCategory;
  start: string;
  end: string;
  isActive: boolean;
}

export interface MealTimeWindowsObject {
  breakfast: { start: string; end: string };
  lunch: { start: string; end: string };
  dinner: { start: string; end: string };
}

export const getMealTimeWindows = (): MealTimeWindowsObject => {
  return {
    breakfast: { start: '6:00', end: '8:00' },
    lunch: { start: '11:00', end: '13:00' },
    dinner: { start: '18:00', end: '19:00' }
  };
};

export const getMealTimeWindowsArray = (): MealTimeWindow[] => {
  const now = getEATTime();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentTime = hours * 60 + minutes; // Convert to minutes

  const windows: MealTimeWindow[] = [
    {
      category: 'breakfast',
      start: '6:00 AM',
      end: '8:00 AM',
      isActive: currentTime >= 360 && currentTime < 480 // 6:00-8:00
    },
    {
      category: 'lunch',
      start: '11:00 AM',
      end: '1:00 PM',
      isActive: currentTime >= 660 && currentTime < 780 // 11:00-13:00
    },
    {
      category: 'dinner',
      start: '6:00 PM',
      end: '7:00 PM',
      isActive: currentTime >= 1080 && currentTime < 1140 // 18:00-19:00
    }
  ];

  return windows;
};

export const isWithinMealTime = (): boolean => {
  const now = getEATTime();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentTime = hours * 60 + minutes;

  // Breakfast: 6:00-8:00 (360-480 minutes)
  // Lunch: 11:00-13:00 (660-780 minutes)
  // Dinner: 18:00-19:00 (1080-1140 minutes)
  return (
    (currentTime >= 360 && currentTime < 480) ||
    (currentTime >= 660 && currentTime < 780) ||
    (currentTime >= 1080 && currentTime < 1140)
  );
};

export const getCurrentMealCategory = (): MealCategory => {
  const windows = getMealTimeWindowsArray();
  const activeWindow = windows.find(w => w.isActive);
  return activeWindow?.category ?? null;
};

export const getNextMealTime = (): { category: MealCategory; startsIn: string } | null => {
  const now = getEATTime();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentTime = hours * 60 + minutes;

  const mealTimes = [
    { category: 'breakfast' as MealCategory, start: 360 }, // 6:00 AM
    { category: 'lunch' as MealCategory, start: 660 },     // 11:00 AM
    { category: 'dinner' as MealCategory, start: 1080 }    // 6:00 PM
  ];

  for (const meal of mealTimes) {
    if (currentTime < meal.start) {
      const diff = meal.start - currentTime;
      const h = Math.floor(diff / 60);
      const m = diff % 60;
      return {
        category: meal.category,
        startsIn: h > 0 ? `${h}h ${m}m` : `${m}m`
      };
    }
  }

  // Next day breakfast
  const diff = (24 * 60 - currentTime) + 360;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return {
    category: 'breakfast',
    startsIn: `${h}h ${m}m`
  };
};

export const getDayOfWeek = (date: Date): string => {
  return date.toLocaleDateString('en-US', { 
    weekday: 'long',
    timeZone: 'Africa/Addis_Ababa'
  }).toLowerCase();
};

export const formatDateForDB = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
