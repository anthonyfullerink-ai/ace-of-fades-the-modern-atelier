import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { 
  BusinessSettings, 
  BlockedRange, 
  Client, 
  Service, 
  createBooking, 
  getBookingsByDate, 
  getBlockedSlots,
  getShopHoursForDate, 
  generateTimeSlots, 
  isSlotAvailableForService, 
  formatTimeStr 
} from '../../../services/api';
import { BARBERS } from '../../../data/barbers';
import toast from 'react-hot-toast';

interface ManualBookingModalProps {
  onClose: () => void;
  onSuccess: () => void;
  businessSettings: BusinessSettings;
  blockedRanges: BlockedRange[];
  clients: Client[];
  services: Service[];
}

const ManualBookingModal: React.FC<ManualBookingModalProps> = ({ 
  onClose, 
  onSuccess, 
  businessSettings,
  blockedRanges = [],
  clients = [],
  services = []
}) => {
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    serviceId: services?.[0]?.id || '', 
    date: new Date().toISOString().split('T')[0], 
    time: '', 
    barber: BARBERS?.[0]?.name || '',
    uid: '' 
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showClientList, setShowClientList] = useState(false);
  const filteredClients = (clients || []).filter(c => 
    (c?.displayName || '').toLowerCase().includes((searchTerm || '').toLowerCase()) || 
    (c?.email || '').toLowerCase().includes((searchTerm || '').toLowerCase())
  ).slice(0, 5);

  const [submitting, setSubmitting] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const clientRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (clientRef.current && !clientRef.current.contains(event.target as Node)) {
        setShowClientList(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchRealAvailability = async () => {
      if (!formData.date || !formData.serviceId) return;
      setLoadingSlots(true);
      try {
        const hours = getShopHoursForDate(businessSettings, formData.date, blockedRanges);
        if (hours.closed) {
          setAvailableSlots([]);
          return;
        }

        const [dayBookings, blockedSlotsData] = await Promise.all([
          getBookingsByDate(formData.date),
          getBlockedSlots(formData.date)
        ]);

        const allPossibleSlots = generateTimeSlots(hours.open, hours.close);
        const service = services.find(s => s.id === formData.serviceId);
        const duration = service?.duration || 30;

        const filtered = allPossibleSlots.filter(slot => 
          isSlotAvailableForService(slot, duration, hours, dayBookings, blockedSlotsData)
        );

        setAvailableSlots(filtered);
      } catch (error) {
        console.error("Failed to fetch availability", error);
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchRealAvailability();
  }, [formData.date, formData.serviceId, businessSettings, blockedRanges, services]);

  useEffect(() => {
    if (availableSlots.length > 0 && (!formData.time || !availableSlots.includes(formData.time))) {
      setFormData(prev => ({ ...prev, time: availableSlots[0] }));
    } else if (availableSlots.length === 0) {
      setFormData(prev => ({ ...prev, time: '' }));
    }
  }, [availableSlots]);

  const handleSelectClient = (client: Client) => {
    setFormData(prev => ({ 
      ...prev, 
      name: client.displayName, 
      email: client.email,
      uid: client.uid
    }));
    setSearchTerm(client.displayName);
    setShowClientList(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (availableSlots.length === 0) {
      toast.error("Shop is closed on the selected date");
      return;
    }
    setSubmitting(true);
    try {
      const selectedService = services.find(s => s.id === formData.serviceId);
      await createBooking({ 
        userId: formData.uid || `manual-entry-${Date.now()}`, 
        customerName: formData.name, 
        customerEmail: formData.email, 
        serviceId: formData.serviceId, 
        serviceDuration: selectedService?.duration,
        date: formData.date, 
        time: formData.time, 
        status: 'Upcoming', 
        barber: formData.barber 
      });
      toast.success("Booking created");
      onSuccess();
    } catch (error) { 
      toast.error("Failed to create booking"); 
    } finally { 
      setSubmitting(false); 
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-stone-950/80 backdrop-blur-xl">
      <motion.div initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-2xl bg-surface-container border border-outline-variant/10 shadow-3xl overflow-hidden">
        <div className="bg-surface-container-highest/20 p-8 border-b border-outline-variant/10 flex justify-between items-center">
          <div>
            <h2 className="font-headline text-3xl font-bold uppercase tracking-tight text-on-surface">Direct Booking</h2>
            <p className="text-[10px] text-primary uppercase tracking-[0.3em] font-bold mt-1">Manual Entry Subsystem</p>
          </div>
          <button onClick={onClose} className="w-12 h-12 flex items-center justify-center bg-surface-container-lowest border border-outline-variant/20 text-on-surface-variant hover:text-primary transition-all rounded-none"><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3 relative" ref={clientRef}>
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-outline-variant">Client Identity</label>
              <div className="relative">
                <input 
                  required 
                  type="text" 
                  placeholder="Search Existing or Type Name" 
                  value={formData.name} 
                  onFocus={() => setShowClientList(true)}
                  onChange={e => {
                    setFormData({...formData, name: e.target.value, uid: ''});
                    setSearchTerm(e.target.value);
                    setShowClientList(true);
                  }} 
                  className="w-full bg-surface-container-lowest border border-outline-variant/20 p-5 font-headline text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all" 
                />
                
                <AnimatePresence>
                  {showClientList && searchTerm && filteredClients.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute left-0 right-0 top-full mt-2 z-[60] bg-surface-container border border-outline-variant/20 shadow-2xl overflow-hidden"
                    >
                      {filteredClients.map((client) => (
                        <button
                          key={client.uid}
                          type="button"
                          onClick={() => handleSelectClient(client)}
                          className="w-full p-4 flex flex-col items-start gap-1 hover:bg-primary/5 transition-all border-b border-outline-variant/10 last:border-0"
                        >
                          <span className="font-headline text-xs font-bold uppercase tracking-widest">{client.displayName}</span>
                          <span className="text-[9px] text-on-surface-variant opacity-60 uppercase">{client.email}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-outline-variant">Email Address</label>
              <input type="email" placeholder="client@example.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-surface-container-lowest border border-outline-variant/20 p-5 font-headline text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-outline-variant">Technical Service</label>
              <select value={formData.serviceId} onChange={e => setFormData({...formData, serviceId: e.target.value})} className="w-full bg-surface-container-lowest border border-outline-variant/20 p-5 font-headline text-sm focus:border-primary outline-none appearance-none cursor-pointer">
                {services.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()} — {s.price}</option>)}
              </select>
            </div>
             <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-outline-variant">Artist / Barber</label>
              <select value={formData.barber} onChange={e => setFormData({...formData, barber: e.target.value})} className="w-full bg-surface-container-lowest border border-outline-variant/20 p-5 font-headline text-sm focus:border-primary outline-none appearance-none cursor-pointer">
                {BARBERS.map(b => <option key={b.id} value={b.name}>{b.name.toUpperCase()}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-outline-variant/5">
            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-outline-variant">Appointment Date</label>
              <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-surface-container-lowest border border-outline-variant/20 p-5 font-headline text-sm focus:border-primary outline-none transition-all" />
            </div>
            <div className="space-y-3 relative">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-outline-variant">Requested Time</label>
              {loadingSlots ? (
                <div className="w-full p-5 bg-surface-container-lowest border border-outline-variant/20 text-[10px] uppercase font-bold tracking-widest animate-pulse">Scanning Availability...</div>
              ) : (
                <select 
                  disabled={availableSlots.length === 0}
                  value={formData.time} 
                  onChange={e => setFormData({...formData, time: e.target.value})} 
                  className={`w-full bg-surface-container-lowest border border-outline-variant/20 p-5 font-headline text-sm focus:border-primary outline-none transition-all ${availableSlots.length === 0 ? 'opacity-20 cursor-not-allowed italic' : ''}`}
                >
                  {availableSlots.length > 0 ? (
                    availableSlots.map(t => <option key={t} value={t}>{formatTimeStr(t)}</option>)
                  ) : (
                    <option value="">Studio Closed</option>
                  )}
                </select>
              )}
            </div>
          </div>

          <div className="pt-8">
            <button 
              disabled={submitting || availableSlots.length === 0} 
              className="w-full gold-gradient py-6 font-headline font-black uppercase text-[11px] tracking-[0.4em] shadow-2xl hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-30 disabled:grayscale"
            >
              {submitting ? 'PROCESSING...' : availableSlots.length === 0 ? 'NOT AVAILABLE' : 'SECURE APPOINTMENT'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ManualBookingModal;
