import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useLiveClock } from '@/hooks/useLiveClock';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ChatButton } from '@/components/chat/ChatButton';
import haramayaLogo from '@/assets/haramaya-logo.png';
import defaultAvatar from '@/assets/default-avatar.png';
interface DashboardHeaderProps {
  onQRClick: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onQRClick }) => {
  const { student, signOut, isAdmin } = useAuth();
  const { formattedDate, formattedTime } = useLiveClock();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const getInitials = () => {
    if (student) {
      return `${student.first_name[0]}${student.last_name[0]}`.toUpperCase();
    }
    return 'HU';
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-gradient-hero text-primary-foreground">
      <div className="container mx-auto px-4 py-4">
        {/* Top Row - Logo and Actions */}
        <div className="flex items-center justify-between mb-4">
          {/* Student Info */}
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 ring-2 ring-secondary/50 shadow-medium">
              <AvatarImage src={student?.photo_url || defaultAvatar} alt={student?.first_name} />
              <AvatarFallback className="bg-secondary text-secondary-foreground font-bold">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:block">
              <p className="font-semibold text-lg leading-tight">
                {student ? `${student.first_name} ${student.last_name}` : 'Welcome'}
              </p>
              <p className="text-sm text-primary-foreground/80">
                {student?.department || 'Haramaya Student'}
              </p>
            </div>
          </div>

          {/* Center - University Logo */}
          <div className="flex flex-col items-center">
            <img 
              src={haramayaLogo} 
              alt="Haramaya University" 
              className="h-14 w-14 object-contain drop-shadow-lg"
            />
            <span className="text-xs font-medium mt-1 hidden md:block">Haramaya University</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            
            {!isAdmin && (
              <>
                <ChatButton className="h-10 w-10 rounded-full shadow-medium hover:scale-105 transition-transform bg-secondary text-secondary-foreground border-0" />
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={onQRClick}
                  className="h-10 w-10 rounded-full shadow-medium hover:scale-105 transition-transform"
                >
                  <QrCode className="h-5 w-5" />
                </Button>
              </>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="h-10 w-10 rounded-full bg-destructive/20 hover:bg-destructive/40 text-primary-foreground"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Bottom Row - Date and Time */}
        <div className="flex items-center justify-between px-2">
          <div>
            <p className="text-sm text-primary-foreground/80">{formattedDate}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold tracking-tight">{formattedTime}</p>
            <p className="text-xs text-primary-foreground/70">East Africa Time</p>
          </div>
        </div>
      </div>
    </header>
  );
};
