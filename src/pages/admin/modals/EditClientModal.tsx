import React, { useState, FormEvent } from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { Client, updateClient } from '../../../services/api';
import toast from 'react-hot-toast';

interface EditClientModalProps {
  client: Client;
  onClose: () => void;
  onSuccess: () => void;
}

const EditClientModal: React.FC<EditClientModalProps> = ({ client, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({ 
    displayName: client.displayName, 
    email: client.email, 
    phoneNumber: client.phoneNumber || '' 
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await updateClient(client.uid, formData);
      toast.success("Client profile updated");
      onSuccess();
    } catch (error) {
      toast.error("Failed to update client");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-stone-950/80 backdrop-blur-xl">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-xl bg-surface-container border border-outline-variant/10 shadow-3xl overflow-hidden">
         <div className="bg-surface-container-highest/20 p-8 border-b border-outline-variant/10 flex justify-between items-center">
          <div>
            <h2 className="font-headline text-3xl font-bold uppercase tracking-tight text-on-surface">Client Profile</h2>
            <p className="text-[10px] text-primary uppercase tracking-[0.3em] font-bold mt-1">Information Record Update</p>
          </div>
          <button onClick={onClose} className="w-12 h-12 flex items-center justify-center bg-surface-container-lowest border border-outline-variant/20 text-on-surface-variant hover:text-primary transition-all"><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="space-y-3">
            <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-outline-variant">Display Name</label>
            <input required type="text" value={formData.displayName} onChange={e => setFormData({...formData, displayName: e.target.value})} className="w-full bg-surface-container-lowest border border-outline-variant/20 p-5 font-headline text-sm focus:border-primary outline-none" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-outline-variant">Email Contact</label>
              <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-surface-container-lowest border border-outline-variant/20 p-5 font-headline text-sm focus:border-primary outline-none" />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-outline-variant">Phone Number</label>
              <input type="tel" value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} className="w-full bg-surface-container-lowest border border-outline-variant/20 p-5 font-headline text-sm focus:border-primary outline-none" />
            </div>
          </div>
          <div className="pt-4">
            <button disabled={submitting} className="w-full gold-gradient py-6 font-headline uppercase font-black text-[11px] tracking-[0.4em] shadow-xl hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50">
              {submitting ? 'SYNCHRONIZING...' : 'SAVE MODIFICATIONS'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default EditClientModal;
