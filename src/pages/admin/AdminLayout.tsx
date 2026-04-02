import React from 'react';
import { motion } from 'motion/react';
import { 
  LayoutList, 
  CalendarDays, 
  Clock, 
  Users, 
  Settings, 
  Plus, 
  ArrowUpDown,
  Scissors,
  BookOpen,
  RefreshCw,
  BarChart3
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeView: string;
  setActiveView: (view: any) => void;
  onAddBooking: () => void;
  onSyncData: () => void;
  onVagaroSync?: () => void;
  isVagaroSyncing?: boolean;
  stats: {
    total: number;
    today: number;
    upcoming: number;
    completed: number;
  };
}

const tabs = [
  { id: 'analytics', icon: BarChart3, title: 'Analytics' },
  { id: 'list', icon: LayoutList, title: 'Appointments' },
  { id: 'calendar', icon: CalendarDays, title: 'Calendar' },
  { id: 'availability', icon: Clock, title: 'Availability' },
  { id: 'clients', icon: Users, title: 'Clients' },
  { id: 'services', icon: Scissors, title: 'Services' },
  { id: 'settings', icon: Settings, title: 'Settings' },
  { id: 'knowledge', icon: BookOpen, title: 'Knowledge Base' }
];

const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  activeView,
  setActiveView,
  onAddBooking,
  onSyncData,
  onVagaroSync,
  isVagaroSyncing,
  stats
}) => {

  return (
    <main className="pt-32 pb-24 px-4 md:px-8 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 mb-16">
        <div>
          <h1 className="font-headline text-5xl md:text-7xl font-bold tracking-tighter text-primary uppercase leading-none mb-3">
            Admin Portal
          </h1>
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
            <p className="text-on-surface-variant font-headline uppercase text-[10px] tracking-[0.2em] font-bold">Studio Operations Center</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
          {/* Main Navigation Tab Switcher */}
          <div className="flex bg-surface-container-lowest p-1.5 border border-outline-variant/10 shadow-2xl rounded-none w-full md:w-auto justify-between md:justify-start">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className={`p-3 transition-all relative group ${activeView === tab.id ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
                title={tab.title}
              >
                <tab.icon size={20} strokeWidth={activeView === tab.id ? 2.5 : 2} />
                {activeView === tab.id && (
                  <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-[0_0_10px_#f2ca50]" />
                )}
              </button>
            ))}
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <button 
              onClick={onAddBooking}
              className="flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-4 gold-gradient text-on-primary font-headline uppercase text-[11px] font-bold tracking-[0.2em] hover:brightness-110 active:scale-[0.98] transition-all shadow-xl"
            >
              <Plus size={16} /> Add Booking
            </button>
            <button 
              onClick={onSyncData}
              className="md:flex-none flex items-center justify-center p-4 border border-outline-variant/20 text-on-surface-variant hover:text-primary hover:border-primary transition-all bg-surface-container/30"
              title="Sync Data"
            >
              <ArrowUpDown size={18} />
            </button>
            {onVagaroSync && (
              <button 
                onClick={onVagaroSync}
                disabled={isVagaroSyncing}
                className="md:flex-none flex items-center justify-center gap-2 px-5 py-4 border border-outline-variant/20 text-on-surface-variant hover:text-primary hover:border-primary transition-all bg-surface-container/30 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Sync Vagaro"
              >
                <RefreshCw size={16} className={isVagaroSyncing ? 'animate-spin' : ''} />
                <span className="hidden md:inline font-headline uppercase text-[10px] tracking-[0.15em] font-bold">Vagaro</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {[
          { label: 'Total Volume', value: stats.total, icon: LayoutList },
          { label: "Today's Schedule", value: stats.today, icon: CalendarDays },
          { label: 'Upcoming', value: stats.upcoming, icon: Clock },
          { label: 'Completed', value: stats.completed, icon: Users },
        ].map((stat, i) => (
          <div key={i} className="bg-surface-container p-6 border border-outline-variant/10">
            <stat.icon className="text-primary mb-4" size={20} />
            <p className="text-[10px] uppercase tracking-widest text-outline mb-1">{stat.label}</p>
            <h3 className="font-headline text-3xl font-bold">{stat.value}</h3>
          </div>
        ))}
      </div>

      {children}
    </main>
  );
};

export default AdminLayout;
