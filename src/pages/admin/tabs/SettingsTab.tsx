import React from 'react';
import { motion } from 'motion/react';
import { 
  Clock, 
  Calendar, 
  Plus, 
  Trash2, 
  AlertCircle, 
  CheckCircle,
  XSquare
} from 'lucide-react';
import { BusinessSettings, WeeklyHours, DayHours, SpecialHours, BlockedRange } from '../../../services/api';

interface SettingsTabProps {
  businessSettings: BusinessSettings | null;
  onUpdateWeeklyHours: (day: keyof WeeklyHours, field: keyof DayHours, value: any) => void;
  newSpecialDate: string;
  setNewSpecialDate: (val: string) => void;
  newSpecialOpen: string;
  setNewSpecialOpen: (val: string) => void;
  newSpecialClose: string;
  setNewSpecialClose: (val: string) => void;
  newSpecialClosed: boolean;
  setNewSpecialClosed: (val: boolean) => void;
  newSpecialReason: string;
  setNewSpecialReason: (val: string) => void;
  onAddSpecialHours: () => void;
  onRemoveSpecialHours: (id: string) => void;
  blockedRanges: BlockedRange[];
  onDeleteBlockedRange: (id: string) => void;
  isSaving: boolean;
  WEEKDAY_ORDER: (keyof WeeklyHours)[];
}

const SettingsTab: React.FC<SettingsTabProps> = ({
  businessSettings,
  onUpdateWeeklyHours,
  newSpecialDate,
  setNewSpecialDate,
  newSpecialOpen,
  setNewSpecialOpen,
  newSpecialClose,
  setNewSpecialClose,
  newSpecialClosed,
  setNewSpecialClosed,
  newSpecialReason,
  setNewSpecialReason,
  onAddSpecialHours,
  onRemoveSpecialHours,
  blockedRanges,
  onDeleteBlockedRange,
  isSaving,
  WEEKDAY_ORDER
}) => {
  if (!businessSettings) return (
    <div className="p-20 text-center flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="font-headline uppercase tracking-widest text-sm">Loading Settings...</p>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-12"
    >
      {/* Weekly Hours */}
      <section className="bg-surface-container border border-outline-variant/10 overflow-hidden">
        <div className="bg-surface-container-highest p-6 border-b border-outline-variant/20 flex items-center gap-4">
          <Clock className="text-primary" size={24} />
          <h2 className="font-headline text-2xl font-bold uppercase tracking-tight">Standard Weekly Hours</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {WEEKDAY_ORDER.map((day) => {
              const hours = businessSettings.weeklyHours[day];
              return (
                <div key={day} className="bg-surface-container p-6 border border-outline-variant/10 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-headline font-bold uppercase tracking-widest text-primary">{day}</h3>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <span className={`text-[10px] uppercase font-bold tracking-widest transition-colors ${hours.closed ? 'text-red-500' : 'text-green-500'}`}>
                        {hours.closed ? 'Closed' : 'Open'}
                      </span>
                      <div className="relative w-10 h-5 bg-surface-container-lowest border border-outline-variant/30 rounded-full">
                        <input 
                          type="checkbox" 
                          className="sr-only" 
                          checked={!hours.closed} 
                          onChange={(e) => onUpdateWeeklyHours(day, 'closed', !e.target.checked)}
                        />
                        <div className={`absolute top-1 left-1 w-3 h-3 rounded-full transition-all duration-300 ${!hours.closed ? 'translate-x-5 bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500'}`} />
                      </div>
                    </label>
                  </div>
                  
                  {!hours.closed && (
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-outline mb-2 font-bold">Opens At</p>
                        <input 
                          type="time" 
                          value={hours.open}
                          onChange={(e) => onUpdateWeeklyHours(day, 'open', e.target.value)}
                          className="w-full bg-surface-container-lowest border border-outline-variant/30 text-on-surface p-3 font-headline uppercase text-xs tracking-widest focus:border-primary transition-colors focus:outline-none"
                        />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-outline mb-2 font-bold">Closes At</p>
                        <input 
                          type="time" 
                          value={hours.close}
                          onChange={(e) => onUpdateWeeklyHours(day, 'close', e.target.value)}
                          className="w-full bg-surface-container-lowest border border-outline-variant/30 text-on-surface p-3 font-headline uppercase text-xs tracking-widest focus:border-primary transition-colors focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Special Hours */}
        <section className="bg-surface-container border border-outline-variant/10 overflow-hidden flex flex-col">
          <div className="bg-surface-container-highest p-6 border-b border-outline-variant/20 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Calendar className="text-primary" size={24} />
              <h2 className="font-headline text-2xl font-bold uppercase tracking-tight">Special Hours & Overrides</h2>
            </div>
          </div>
          <div className="p-6 flex-1 flex flex-col gap-8">
            <div className="bg-surface-container-highest/30 p-6 border border-outline-variant/20 space-y-4">
              <h3 className="font-headline text-xs font-bold uppercase tracking-[0.2em] text-primary">Add Date Specific Override</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/50" size={16} />
                  <input type="date" value={newSpecialDate} onChange={(e) => setNewSpecialDate(e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant/30 text-on-surface p-3 pl-10 focus:border-primary transition-colors text-xs font-headline uppercase focus:outline-none" />
                </div>
                <div className="relative">
                  <AlertCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/50" size={16} />
                  <input type="text" placeholder="Reason (e.g. Holiday)" value={newSpecialReason} onChange={(e) => setNewSpecialReason(e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant/30 text-on-surface p-3 pl-10 focus:border-primary transition-colors text-xs font-headline uppercase focus:outline-none" />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-outline">From</span>
                    <input type="time" disabled={newSpecialClosed} value={newSpecialOpen} onChange={(e) => setNewSpecialOpen(e.target.value)} className="bg-surface-container-lowest border border-outline-variant/30 text-on-surface p-2 text-xs font-headline focus:border-primary focus:outline-none disabled:opacity-50" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-outline">Until</span>
                    <input type="time" disabled={newSpecialClosed} value={newSpecialClose} onChange={(e) => setNewSpecialClose(e.target.value)} className="bg-surface-container-lowest border border-outline-variant/30 text-on-surface p-2 text-xs font-headline focus:border-primary focus:outline-none disabled:opacity-50" />
                  </div>
                </div>
                <label className="flex items-center gap-3 cursor-pointer group py-2">
                  <div className={`w-10 h-5 bg-surface-container-lowest border border-outline-variant/30 rounded-full relative transition-all duration-300 ${newSpecialClosed ? 'border-red-500/50' : 'border-green-500/50'}`}>
                    <input type="checkbox" className="sr-only" checked={newSpecialClosed} onChange={(e) => setNewSpecialClosed(e.target.checked)} />
                    <div className={`absolute top-1 left-1 w-3 h-3 rounded-full transition-all duration-300 ${newSpecialClosed ? 'translate-x-5 bg-red-500 shadow-[0_0_8px_#ef4444]' : 'bg-green-500'}`} />
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant font-headline">Mark as Fully Closed</span>
                </label>
              </div>
              <button onClick={onAddSpecialHours} disabled={!newSpecialDate || isSaving} className="w-full py-4 px-8 gold-gradient text-on-primary font-headline uppercase text-[11px] font-bold tracking-[0.2em] hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-xl disabled:opacity-50">
                <Plus size={16} /> Add Override
              </button>
            </div>

            <div className="space-y-4">
              <h3 className="font-headline text-xs font-bold uppercase tracking-[0.2em] text-outline">Upcoming Special Dates</h3>
              {businessSettings.specialHours?.length === 0 ? (
                <div className="p-12 text-center border-2 border-dashed border-outline-variant/10 bg-surface-container-lowest/30">
                  <Calendar className="mx-auto text-outline/20 mb-4" size={32} />
                  <p className="text-[10px] uppercase tracking-widest text-outline font-bold">No overrides configured</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {businessSettings.specialHours?.map((special) => (
                    <div key={special.id} className="flex items-center justify-between bg-surface-container-highest p-4 border border-outline-variant/10 group">
                      <div className="flex items-center gap-5">
                        <div className={`w-12 h-12 rounded-full flex flex-col items-center justify-center border ${special.closed ? 'bg-red-500/5 border-red-500/30 text-red-500' : 'bg-primary/5 border-primary/30 text-primary'}`}>
                          <Calendar size={18} />
                        </div>
                        <div>
                          <div className="font-headline font-bold uppercase text-lg leading-none mb-1">{special.date}</div>
                          <div className="flex items-center gap-2">
                             <span className="text-[10px] uppercase font-bold tracking-widest text-outline">{special.reason}</span>
                             <span className="w-1 h-1 rounded-full bg-outline-variant/40" />
                             <span className={`text-[10px] uppercase font-bold tracking-widest ${special.closed ? 'text-red-500' : 'text-primary'}`}>{special.closed ? 'FULLY CLOSED' : `${special.open} - ${special.close}`}</span>
                          </div>
                        </div>
                      </div>
                      <button onClick={() => onRemoveSpecialHours(special.id!)} className="p-3 text-on-surface-variant hover:text-red-500 hover:bg-red-500/10 rounded transition-all">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Long-term Closures */}
        <section className="bg-surface-container border border-outline-variant/10 overflow-hidden flex flex-col">
          <div className="bg-surface-container-highest p-6 border-b border-outline-variant/20 flex items-center gap-4">
            <XSquare className="text-red-500" size={24} />
            <h2 className="font-headline text-2xl font-bold uppercase tracking-tight">Shop Closures & Blocked Dates</h2>
          </div>
          <div className="p-6 flex-1 flex flex-col gap-8">
            <p className="text-on-surface-variant text-sm">Long-term closures (vacations, renovations, etc.) will block all bookings for the specified date range.</p>
            
            {blockedRanges.length === 0 ? (
              <div className="flex-1 p-12 text-center border-2 border-dashed border-outline-variant/10 bg-surface-container-lowest/30 flex flex-col items-center justify-center">
                <AlertCircle className="mx-auto text-outline/20 mb-4" size={32} />
                <p className="text-[10px] uppercase tracking-widest text-outline font-bold">No active closures</p>
                <p className="text-[10px] text-on-surface-variant mt-2 max-w-xs mx-auto">Use the Availability tab to block off full days or ranges.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {blockedRanges.map((range) => (
                  <div key={range.id} className="bg-surface-container-highest/50 p-6 border border-outline-variant/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4">
                      <button onClick={() => onDeleteBlockedRange(range.id!)} className="text-on-surface-variant hover:text-red-500 transition-colors p-2">
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="flex items-start gap-5">
                      <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center text-red-500">
                        <XSquare size={20} />
                      </div>
                      <div className="pr-12">
                        <h4 className="font-headline font-bold uppercase tracking-widest text-on-surface-variant mb-2">Closure Window</h4>
                        <div className="text-2xl font-headline font-bold text-on-surface mb-2 tracking-tighter">
                          {range.startDate === range.endDate ? range.startDate : `${range.startDate} — ${range.endDate}`}
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle size={12} className="text-primary" />
                          <p className="text-[10px] uppercase tracking-widest text-primary font-bold">{range.reason}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </motion.div>
  );
};

export default SettingsTab;
