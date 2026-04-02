import React, { useState, FormEvent } from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { addBlockedRange } from '../../../services/api';
import toast from 'react-hot-toast';

interface RangeBlockingModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const RangeBlockingModal: React.FC<RangeBlockingModalProps> = ({ onClose, onSuccess }) => {
  const [data, setData] = useState({ 
    startDate: new Date().toISOString().split('T')[0], 
    endDate: new Date().toISOString().split('T')[0], 
    reason: '' 
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (new Date(data.endDate) < new Date(data.startDate)) { 
      toast.error("End date cannot be before start date"); 
      return; 
    }
    setSubmitting(true);
    try { 
      await addBlockedRange(data); 
      toast.success("Range blocked"); 
      onSuccess(); 
    } catch (error) { 
      toast.error("Failed to block range"); 
    } finally { 
      setSubmitting(false); 
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-stone-950/80 backdrop-blur-xl">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-xl bg-surface-container border border-outline-variant/10 shadow-3xl overflow-hidden">
         <div className="bg-red-500/10 p-8 border-b border-outline-variant/10 flex justify-between items-center">
          <div>
            <h2 className="font-headline text-3xl font-bold uppercase tracking-tight text-red-500/90">Block Schedule</h2>
            <p className="text-[10px] text-red-500/50 uppercase tracking-[0.3em] font-bold mt-1">Temporary Shutdown Range</p>
          </div>
          <button onClick={onClose} className="w-12 h-12 flex items-center justify-center bg-surface-container-lowest border border-outline-variant/20 text-on-surface-variant hover:text-red-500 transition-all"><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-outline-variant">Start Lockdown</label>
              <input type="date" required value={data.startDate} onChange={e => setData({...data, startDate: e.target.value})} className="w-full bg-surface-container-lowest border border-outline-variant/30 p-5 font-headline text-sm focus:border-red-500 outline-none" />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-outline-variant">End Lockdown</label>
              <input type="date" required min={data.startDate} value={data.endDate} onChange={e => setData({...data, endDate: e.target.value})} className="w-full bg-surface-container-lowest border border-outline-variant/30 p-5 font-headline text-sm focus:border-red-500 outline-none" />
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-outline-variant">Reason for Closure</label>
            <input type="text" value={data.reason} onChange={e => setData({...data, reason: e.target.value})} className="w-full bg-surface-container-lowest border border-outline-variant/30 p-5 font-headline text-sm focus:border-red-500 outline-none" placeholder="e.g. Studio Refurbishment" />
          </div>
          <div className="pt-4">
            <button disabled={submitting} className="w-full bg-red-600 text-white py-6 font-headline uppercase font-black text-[11px] tracking-[0.4em] shadow-xl hover:bg-red-700 transition-all disabled:opacity-50">
              {submitting ? 'ENFORCING CLOSURE...' : 'CONFIRM STUDIO SHUTDOWN'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default RangeBlockingModal;
