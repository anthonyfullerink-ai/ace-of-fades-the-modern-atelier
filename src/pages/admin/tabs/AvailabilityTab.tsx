import React from 'react';
import { motion } from 'motion/react';
import { Calendar, Ban, Clock } from 'lucide-react';
import { BlockedSlot, Booking } from '../../../services/api';

interface AvailabilityTabProps {
  availabilityDate: string;
  setAvailabilityDate: (val: string) => void;
  isManaging: boolean;
  adminTimeSlots: string[];
  blockedSlots: BlockedSlot[];
  bookings: Booking[];
  onToggleSlot: (time: string) => void;
  onBlockFullDay: () => void;
}

const AvailabilityTab: React.FC<AvailabilityTabProps> = ({
  availabilityDate,
  setAvailabilityDate,
  isManaging,
  adminTimeSlots,
  blockedSlots,
  bookings,
  onToggleSlot,
  onBlockFullDay
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <div className="bg-surface-container p-8 border border-outline-variant/10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h2 className="font-headline text-2xl font-bold uppercase tracking-widest mb-2">Shop Availability</h2>
            <p className="text-on-surface-variant text-sm">Select a date to block or open specific time slots.</p>
          </div>
          <div className="flex items-center gap-4 bg-surface-container-highest p-4 border border-outline-variant/10">
            <Calendar size={18} className="text-primary" />
            <input 
              type="date" 
              value={availabilityDate} 
              onChange={(e) => setAvailabilityDate(e.target.value)} 
              className="bg-transparent text-on-surface focus:outline-none font-headline uppercase text-xs tracking-widest cursor-pointer" 
            />
          </div>
        </div>

        {isManaging ? (
          <div className="py-20 text-center flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="font-headline uppercase tracking-widest text-sm">Loading Slots...</p>
          </div>
        ) : adminTimeSlots.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center gap-6 border-2 border-dashed border-outline-variant/10 bg-surface-container-highest/20">
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center">
              <Ban size={32} className="text-red-500" />
            </div>
            <div>
              <h3 className="font-headline text-2xl font-bold uppercase tracking-tight text-red-500 mb-2">Shop Closed</h3>
              <p className="text-on-surface-variant font-body text-sm max-w-sm mx-auto">This date is currently marked as closed in your business settings or by a special closure.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {adminTimeSlots.map((time) => {
                const isBlocked = blockedSlots.some(s => s.time === time);
                const hasBooking = bookings.some(b => b.date === availabilityDate && b.time === time && b.status !== 'Cancelled');
                return (
                  <button
                    key={time}
                    disabled={hasBooking}
                    onClick={() => onToggleSlot(time)}
                    className={`p-4 border transition-all text-center group relative ${hasBooking ? 'bg-surface-container-lowest border-outline-variant/10 opacity-40 cursor-not-allowed' : isBlocked ? 'bg-red-500/10 border-red-500 text-red-500 hover:bg-red-500/20' : 'bg-surface-container border-outline-variant/20 hover:border-primary text-on-surface'}`}
                  >
                    <div className="flex flex-col items-center gap-1">
                       <Clock size={14} className={isBlocked ? "text-red-500" : "text-primary opacity-50 group-hover:opacity-100"} />
                       <span className="font-headline text-sm font-bold">{time}</span>
                       <span className="text-[8px] uppercase tracking-tighter opacity-50 font-bold">
                        {hasBooking ? 'Booked' : isBlocked ? 'Blocked' : 'Available'}
                       </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="bg-surface-container-highest p-8 border border-outline-variant/10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-red-500/10 text-red-500">
                  <Ban size={24} />
                </div>
                <div>
                  <h4 className="font-headline font-bold uppercase tracking-widest text-sm mb-1">Full Day Override</h4>
                  <p className="text-xs text-on-surface-variant max-w-sm">Quickly block the ENTIRE day. This will create a special closure entry for today's date.</p>
                </div>
              </div>
              <button 
                onClick={onBlockFullDay}
                className="w-full md:w-auto px-10 py-5 border border-red-500/30 text-red-500 font-headline uppercase text-[10px] font-bold tracking-[0.2em] hover:bg-red-500/10 transition-all flex items-center justify-center gap-3"
              >
                <Ban size={16} /> Block Entire Day
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AvailabilityTab;
