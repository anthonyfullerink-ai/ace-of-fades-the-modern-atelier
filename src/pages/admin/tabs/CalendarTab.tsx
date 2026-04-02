import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Booking } from '../../../services/api';

interface CalendarTabProps {
  currentMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  bookingsByDate: Record<string, Booking[]>;
  onDateSelect: (date: string) => void;
}

const CalendarTab: React.FC<CalendarTabProps> = ({
  currentMonth,
  onPrevMonth,
  onNextMonth,
  bookingsByDate,
  onDateSelect
}) => {
  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days = [];
    const startPadding = firstDay.getDay();
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    
    for (let i = startPadding - 1; i >= 0; i--) {
      days.push({ day: prevMonthLastDay - i, currentMonth: false, dateStr: null });
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ day: i, currentMonth: true, dateStr });
    }
    
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, currentMonth: false, dateStr: null });
    }
    
    return days;
  }, [currentMonth]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="bg-surface-container p-8 border border-outline-variant/10">
        <div className="flex justify-between items-center mb-8">
          <h2 className="font-headline text-2xl font-bold uppercase tracking-widest">{monthName}</h2>
          <div className="flex gap-2">
            <button onClick={onPrevMonth} className="p-2 hover:bg-surface-container-highest"><ChevronLeft size={24} /></button>
            <button onClick={onNextMonth} className="p-2 hover:bg-surface-container-highest"><ChevronRight size={24} /></button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-px bg-outline-variant/10 border border-outline-variant/10">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="bg-surface-container-highest p-4 text-center font-headline text-[10px] uppercase tracking-[0.2em] opacity-60">{d}</div>
          ))}
          {calendarDays.map((dateObj, i) => {
            const dayBookings = dateObj.dateStr ? (bookingsByDate[dateObj.dateStr] || []) : [];
            const isToday = dateObj.dateStr === new Date().toISOString().split('T')[0];

            return (
              <div 
                key={i} 
                onClick={() => { if (dateObj.dateStr) onDateSelect(dateObj.dateStr); }}
                className={`group min-h-[120px] p-2 bg-surface-container transition-all cursor-pointer hover:bg-surface-container-highest border-t-2 relative ${dateObj.currentMonth ? 'text-on-surface' : 'opacity-20 pointer-events-none'} ${isToday ? 'border-primary' : 'border-transparent'}`}
              >
                <div className={`font-headline text-sm mb-2 ${isToday ? 'text-primary font-bold' : ''}`}>{dateObj.day}</div>
                <div className="space-y-1">
                  {dayBookings.slice(0, 3).map((b, bi) => {
                    const isCompleted = b.status === 'Completed';
                    return (
                      <div 
                        key={bi} 
                        className={`text-[9px] truncate px-1 py-0.5 font-headline uppercase font-bold border-l-2 transition-colors ${
                          isCompleted 
                            ? 'bg-green-500/10 text-green-500 border-green-500' 
                            : 'bg-primary/10 text-primary border-primary'
                        }`}
                      >
                        {b.time} - {b.customerName}
                      </div>
                    );
                  })}
                  {dayBookings.length > 3 && <div className="text-[9px] opacity-50 font-headline uppercase text-center py-1 bg-surface-container-highest/50">+ {dayBookings.length - 3} more</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default CalendarTab;
