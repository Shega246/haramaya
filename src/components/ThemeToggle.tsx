import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="relative h-10 w-10 rounded-full bg-card/50 backdrop-blur-sm hover:bg-card transition-all duration-300"
    >
      <Sun className={`h-5 w-5 transition-all duration-300 ${theme === 'dark' ? 'scale-0 rotate-90' : 'scale-100 rotate-0'} absolute`} />
      <Moon className={`h-5 w-5 transition-all duration-300 ${theme === 'dark' ? 'scale-100 rotate-0' : 'scale-0 -rotate-90'} absolute`} />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
};
