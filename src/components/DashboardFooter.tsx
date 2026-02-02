import React from 'react';
import { Clock, Coffee, Sun, Moon, Info } from 'lucide-react';
import haramayaLogo from '@/assets/haramaya-logo.png';

export const DashboardFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const mealSchedule = [
    { category: 'Breakfast', time: '6:00 AM - 8:00 AM', icon: Coffee },
    { category: 'Lunch', time: '11:00 AM - 1:00 PM', icon: Sun },
    { category: 'Dinner', time: '6:00 PM - 7:00 PM', icon: Moon },
  ];

  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-8">
        {/* Meal Schedule */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Cafeteria Meal Schedule
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {mealSchedule.map(({ category, time, icon: Icon }) => (
              <div 
                key={category}
                className="flex items-center gap-3 p-4 rounded-lg bg-muted/50"
              >
                <div className={`p-2 rounded-full ${
                  category === 'Breakfast' ? 'bg-breakfast/20 text-breakfast' :
                  category === 'Lunch' ? 'bg-lunch/20 text-lunch' :
                  'bg-dinner/20 text-dinner'
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{category}</p>
                  <p className="text-sm text-muted-foreground">{time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Important Notice */}
        <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 mb-8">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-foreground mb-1">Important Notice</h4>
              <p className="text-sm text-muted-foreground">
                Please present your QR code at the cafeteria entrance during meal hours. 
                Each student is entitled to one meal per category per day. 
                QR codes are only valid during designated meal times.
              </p>
            </div>
          </div>
        </div>

        {/* University Info */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t border-border">
          <div className="flex items-center gap-3">
            <img 
              src={haramayaLogo} 
              alt="Haramaya University"
              className="h-10 w-10 object-contain"
            />
            <div>
              <p className="font-semibold text-foreground">Haramaya University</p>
              <p className="text-sm text-muted-foreground">Students Cafeteria Management System</p>
            </div>
          </div>
          
          <div className="text-center md:text-right">
            <p className="text-sm text-muted-foreground">
              Haramaya, Ethiopia • East Africa Time (UTC+3)
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              © {currentYear} Haramaya University. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
