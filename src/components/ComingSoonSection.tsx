import React from 'react';
import { Sparkles, Bell, Wallet, MessageSquare, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const upcomingFeatures = [
  {
    icon: Wallet,
    title: 'Digital Wallet',
    description: 'Load credits for special meals',
    color: 'text-amber-500 bg-amber-500/10'
  },
  {
    icon: Bell,
    title: 'Meal Reminders',
    description: 'Get notified before meal times',
    color: 'text-blue-500 bg-blue-500/10'
  },
  {
    icon: MessageSquare,
    title: 'Feedback System',
    description: 'Rate and comment on meals',
    color: 'text-green-500 bg-green-500/10'
  }
];

export const ComingSoonSection: React.FC = () => {
  return (
    <section className="mt-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-full bg-secondary/20">
          <Sparkles className="h-5 w-5 text-secondary" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Coming Soon</h2>
        <Badge variant="outline" className="text-xs">Future Development</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {upcomingFeatures.map(({ icon: Icon, title, description, color }) => (
          <Card 
            key={title}
            className="group cursor-pointer transition-all duration-300 hover:shadow-medium border-dashed border-2 bg-card/50"
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};
