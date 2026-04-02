import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle } from 'lucide-react';

interface ConfirmationModalProps {
  show: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDangerous?: boolean;
}

export default function ConfirmationModal({ 
  show, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  isDangerous 
}: ConfirmationModalProps) {
  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-surface/80 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-sm bg-surface-container p-8 border border-outline-variant/20 shadow-2xl text-center"
          >
            <div className={`w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center ${isDangerous ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'}`}>
              <AlertCircle size={32} />
            </div>
            <h3 className="font-headline text-xl font-bold uppercase tracking-widest mb-2">{title}</h3>
            <p className="text-on-surface-variant text-sm mb-8 leading-relaxed">{message}</p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={onConfirm}
                className={`w-full py-4 font-headline text-xs font-bold uppercase tracking-widest transition-all ${isDangerous ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-primary text-on-primary hover:opacity-90'}`}
              >
                Confirm Action
              </button>
              <button 
                onClick={onCancel}
                className="w-full py-4 font-headline text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
