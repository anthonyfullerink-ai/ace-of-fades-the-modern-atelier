import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, User, Mail, Phone, Tag, MessageSquare, Send } from 'lucide-react';
import { createInquiry } from '../services/api';
import toast from 'react-hot-toast';

interface InquiryModalProps {
  show: boolean;
  onClose: () => void;
}

const EVENT_TYPES = [
  'Wedding',
  'Sweet 16',
  'Graduation',
  'Birthday Party',
  'Bachelor Party',
  'Corporate Event',
  'Private Session',
  'Other'
];

export default function InquiryModal({ show, onClose }: InquiryModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    eventType: 'Wedding',
    eventDate: '',
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createInquiry({
        name: formData.name,
        email: formData.email,
        phoneNumber: formData.phone,
        eventType: formData.eventType,
        eventDate: formData.eventDate,
        description: formData.description
      });
      toast.success("Inquiry sent! We'll contact you soon.");
      onClose();
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        eventType: 'Wedding',
        eventDate: '',
        description: ''
      });
    } catch (error) {
      toast.error("Failed to send inquiry. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-6 bg-surface/90 backdrop-blur-xl outline-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-2xl bg-surface-container border border-outline-variant/20 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] overflow-hidden relative"
          >
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

            <div className="flex justify-between items-center p-8 border-b border-outline-variant/10">
              <div>
                <h2 className="font-headline text-2xl md:text-3xl font-bold uppercase tracking-tighter text-on-surface">Bespoke Inquiry</h2>
                <p className="text-primary font-headline text-[10px] uppercase tracking-[0.3em] font-bold mt-1">Elevate Your Signature Event</p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-full transition-colors text-on-surface-variant hover:text-primary"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold text-outline">
                    <User size={12} className="text-primary" /> Full Name
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    className="w-full bg-surface-container-high border border-outline-variant/20 py-4 px-5 text-on-surface focus:border-primary/50 focus:outline-none transition-colors font-body"
                  />
                </div>

                {/* Event Type */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold text-outline">
                    <Tag size={12} className="text-primary" /> Event Type
                  </label>
                  <select
                    value={formData.eventType}
                    onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                    className="w-full bg-surface-container-high border border-outline-variant/20 py-4 px-5 text-on-surface focus:border-primary/50 focus:outline-none transition-colors font-body appearance-none"
                  >
                    {EVENT_TYPES.map(type => (
                      <option key={type} value={type} className="bg-surface-container-high">{type}</option>
                    ))}
                  </select>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold text-outline">
                    <Mail size={12} className="text-primary" /> Email Address
                  </label>
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                    className="w-full bg-surface-container-high border border-outline-variant/20 py-4 px-5 text-on-surface focus:border-primary/50 focus:outline-none transition-colors font-body"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold text-outline">
                    <Phone size={12} className="text-primary" /> Phone Number
                  </label>
                  <input
                    required
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(555) 000-0000"
                    className="w-full bg-surface-container-high border border-outline-variant/20 py-4 px-5 text-on-surface focus:border-primary/50 focus:outline-none transition-colors font-body"
                  />
                </div>

                {/* Event Date */}
                <div className="space-y-2 md:col-span-2">
                  <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold text-outline">
                    <Calendar size={12} className="text-primary" /> Preferred Event Date
                  </label>
                  <input
                    required
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                    className="w-full bg-surface-container-high border border-outline-variant/20 py-4 px-5 text-on-surface focus:border-primary/50 focus:outline-none transition-colors font-body [color-scheme:dark]"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2 md:col-span-2">
                  <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold text-outline">
                    <MessageSquare size={12} className="text-primary" /> Tell us more about your needs
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the group size, special requests, or wedding details..."
                    className="w-full bg-surface-container-high border border-outline-variant/20 py-4 px-5 text-on-surface focus:border-primary/50 focus:outline-none transition-colors font-body resize-none"
                  />
                </div>
              </div>

              <button
                disabled={loading}
                type="submit"
                className="w-full gold-gradient py-5 text-on-primary font-headline font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin"></div>
                ) : (
                  <><Send size={18} /> Submit Formal Inquiry</>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
