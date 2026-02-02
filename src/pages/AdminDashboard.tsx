import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, UtensilsCrossed, History, LogOut, 
  Loader2, Menu, X, LayoutDashboard, Radio, ClipboardList, MessageCircle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useToast } from '@/hooks/use-toast';
import haramayaLogo from '@/assets/haramaya-logo.png';
import { StudentManagement } from '@/components/admin/StudentManagement';
import { MealManagement } from '@/components/admin/MealManagement';
import { MealLogs } from '@/components/admin/MealLogs';
import { AdminOverview } from '@/components/admin/AdminOverview';
import { TickerManagement } from '@/components/admin/TickerManagement';
import { VerificationLogs } from '@/components/admin/VerificationLogs';
import { AdminChatPanel } from '@/components/admin/AdminChatPanel';

const AdminDashboard: React.FC = () => {
  const { user, isLoading, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      toast({
        title: 'Access Denied',
        description: 'You need admin privileges to access this page.',
        variant: 'destructive'
      });
      navigate('/');
    }
  }, [isLoading, user, isAdmin, navigate, toast]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'meals', label: 'Meals', icon: UtensilsCrossed },
    { id: 'messages', label: 'Messages', icon: MessageCircle },
    { id: 'tickers', label: 'Tickers', icon: Radio },
    { id: 'verification-logs', label: 'Verification Logs', icon: ClipboardList },
    { id: 'meal-logs', label: 'Meal Logs (Legacy)', icon: History },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-64 flex-col bg-card border-r border-border">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <img src={haramayaLogo} alt="HU" className="h-10 w-10" />
            <div>
              <h2 className="font-bold text-foreground">Admin Panel</h2>
              <p className="text-xs text-muted-foreground">Cafeteria System</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === id 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-border space-y-2">
          <ThemeToggle />
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <img src={haramayaLogo} alt="HU" className="h-8 w-8" />
          <span className="font-bold">Admin Panel</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setIsSidebarOpen(false)}>
          <aside className="w-64 h-full bg-card" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <img src={haramayaLogo} alt="HU" className="h-10 w-10" />
                <div>
                  <h2 className="font-bold text-foreground">Admin Panel</h2>
                  <p className="text-xs text-muted-foreground">Cafeteria System</p>
                </div>
              </div>
            </div>

            <nav className="flex-1 p-4 space-y-2">
              {navItems.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => {
                    setActiveTab(id);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </button>
              ))}
            </nav>

            <div className="p-4 border-t border-border">
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
                Logout
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:p-8 p-4 pt-20 lg:pt-8 overflow-auto">
        {activeTab === 'overview' && <AdminOverview />}
        {activeTab === 'students' && <StudentManagement />}
        {activeTab === 'meals' && <MealManagement />}
        {activeTab === 'messages' && <AdminChatPanel />}
        {activeTab === 'tickers' && <TickerManagement />}
        {activeTab === 'verification-logs' && <VerificationLogs />}
        {activeTab === 'meal-logs' && <MealLogs />}
      </main>
    </div>
  );
};

export default AdminDashboard;
