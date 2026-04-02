import { motion } from 'motion/react';
import { Calendar, Scissors, ChevronRight, Loader2, User } from 'lucide-react';
import { useState, useEffect, FormEvent } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../config/firebase';
import { 
  getUserBookings, 
  cancelBooking, 
  rescheduleBooking, 
  Booking, 
  updateClient, 
  getClientByUid, 
  Client,
  getServices,
  Service,
  getBusinessSettings,
  getBlockedRanges,
  getBookingsByDate,
  getBlockedSlots,
  getShopHoursForDate,
  generateTimeSlots,
  isSlotAvailableForService,
  BusinessSettings,
  BlockedRange
} from '../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import ConfirmationModal from '../components/ConfirmationModal';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Profile state
  const [profile, setProfile] = useState<Client | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ displayName: '', phoneNumber: '', email: '' });

  // Reschedule state
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDangerous?: boolean;
  }>({ show: false, title: '', message: '', onConfirm: () => {} });

  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null);
  const [blockedRanges, setBlockedRanges] = useState<BlockedRange[]>([]);

  const fetchProfile = async () => {
    if (!user) return;
    try {
      const data = await getClientByUid(user.uid);
      if (data) {
        setProfile(data);
        setProfileForm({ 
          displayName: data.displayName, 
          phoneNumber: data.phoneNumber || '',
          email: data.email || user.email || ''
        });
      }
    } catch (error) {
      console.error("Failed to load profile", error);
    }
  };

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await updateClient(user.uid, profileForm);
      toast.success("Profile updated");
      setEditingProfile(false);
      fetchProfile();
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  const fetchData = async () => {
    if (!user) return;
    try {
      const [bookingsData, servicesData] = await Promise.all([
        getUserBookings(user.uid),
        getServices()
      ]);
      setBookings(bookingsData);
      setServices(servicesData);
    } catch (error) {
      console.error(error);
      const isTimeout = error instanceof Error && error.message.includes("timed out");
      toast.error(isTimeout ? "Database is taking too long." : "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
      fetchProfile();
      
      // Load business settings for rescheduling
      const loadSettings = async () => {
        try {
          const [settings, ranges] = await Promise.all([
            getBusinessSettings(),
            getBlockedRanges()
          ]);
          setBusinessSettings(settings);
          setBlockedRanges(ranges);
        } catch (e) {
          console.error("Failed to load settings", e);
        }
      };
      loadSettings();
    }
  }, [user]);

  // Fetch availability when date changes during rescheduling
  useEffect(() => {
    if (!reschedulingId || !newDate || !businessSettings) return;
    
    const fetchAvailability = async () => {
      setLoadingTimes(true);
      try {
        const booking = bookings.find(b => b.id === reschedulingId);
        if (!booking) return;

        const service = services.find(s => s.id === booking.serviceId);
        const duration = service?.duration || booking.serviceDuration || 30;

        const hours = getShopHoursForDate(businessSettings, newDate, blockedRanges);
        if (hours.closed) {
          setAvailableTimes([]);
          return;
        }

        const [dayBookings, blockedSlots] = await Promise.all([
          getBookingsByDate(newDate),
          getBlockedSlots(newDate)
        ]);

        const allPossibleSlots = generateTimeSlots(hours.open, hours.close);
        
        // Filter slots - exclude current booking from overlap check, and only consider same barber
        const filtered = allPossibleSlots.filter(slot => 
          isSlotAvailableForService(
            slot, 
            duration, 
            hours, 
            dayBookings.filter(b => b.id !== reschedulingId && b.barber === booking.barber), 
            blockedSlots
          )
        );
        
        setAvailableTimes(filtered);
      } catch (e) {
        console.error("Failed to fetch availability", e);
      } finally {
        setLoadingTimes(false);
      }
    };
    fetchAvailability();
  }, [newDate, reschedulingId, businessSettings, blockedRanges, services, bookings]);

  const handleCancel = async (id: string) => {
    setConfirmModal({
      show: true,
      title: 'Cancel Appointment',
      message: 'Are you sure you want to cancel this appointment? This action cannot be undone.',
      isDangerous: true,
      onConfirm: async () => {
        try {
          await cancelBooking(id);
          toast.success("Appointment cancelled");
          fetchData();
        } catch (e) {
          toast.error("Failed to cancel appointment");
        } finally {
          setConfirmModal(prev => ({ ...prev, show: false }));
        }
      }
    });
  };

  const handleReschedule = async (id: string) => {
    if (!newDate || !newTime) {
      toast.error("Please select a new date and time");
      return;
    }
    try {
      await rescheduleBooking(id, newDate, newTime);
      toast.success("Appointment rescheduled!");
      setReschedulingId(null);
      setNewDate('');
      setNewTime('');
      fetchData();
    } catch (e) {
      toast.error("Failed to reschedule");
    }
  };

  const getServiceName = (serviceId: string) => {
    return services.find(s => s.id === serviceId)?.name || 'Custom Service';
  };

  const upcoming = bookings.filter(b => b.status === 'Upcoming');
  const past = bookings.filter(b => b.status === 'Completed' || b.status === 'Cancelled');

  if (loading) {
    return (
      <main className="pt-32 pb-40 px-6 max-w-4xl mx-auto flex flex-col justify-center items-center min-h-[50vh] gap-6">
        <Loader2 className="animate-spin text-primary" size={48} />
        <div className="text-center">
            <p className="font-headline text-on-surface-variant tracking-widest uppercase text-sm">Synchronizing Data...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-32 pb-40 px-6 max-w-4xl mx-auto">
      {/* Profile Section */}
      <section className="mb-16 bg-surface-container border border-outline-variant/10 p-8">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-primary/10 border border-primary/20 flex items-center justify-center">
              <User size={32} className="text-primary" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary mb-1">MEMBER PROFILE</p>
              <h2 className="font-headline text-3xl font-bold uppercase tracking-tighter">{profile?.displayName || user?.displayName || 'Valued Guest'}</h2>
              <p className="text-on-surface-variant font-body text-sm mt-1">{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={() => setEditingProfile(!editingProfile)}
            className="text-[10px] font-headline font-bold uppercase tracking-widest border border-outline px-4 py-2 hover:bg-surface-container-highest transition-colors"
          >
            {editingProfile ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        {editingProfile ? (
          <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-outline-variant/10">
            <div className="space-y-2">
              <label className="text-[9px] uppercase tracking-widest font-bold opacity-60">Display Name</label>
              <input 
                required
                type="text"
                value={profileForm.displayName}
                onChange={e => setProfileForm({ ...profileForm, displayName: e.target.value })}
                className="w-full bg-surface-container-lowest border border-outline-variant/30 text-on-surface p-4 focus:border-primary focus:outline-none transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] uppercase tracking-widest font-bold opacity-60">Email Address</label>
              <input 
                required
                type="email"
                value={profileForm.email}
                onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                className="w-full bg-surface-container-lowest border border-outline-variant/30 text-on-surface p-4 focus:border-primary focus:outline-none transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] uppercase tracking-widest font-bold opacity-60">Phone Number</label>
              <input 
                type="tel"
                value={profileForm.phoneNumber}
                onChange={e => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                className="w-full bg-surface-container-lowest border border-outline-variant/30 text-on-surface p-4 focus:border-primary focus:outline-none transition-colors"
                placeholder="(XXX) XXX-XXXX"
              />
            </div>
            <div className="md:col-span-2 pt-2">
              <button className="bg-primary text-on-primary font-headline uppercase text-xs tracking-widest px-8 py-4 hover:shadow-lg hover:shadow-primary/20 transition-all">
                Save Changes
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-wrap gap-8 pt-6 border-t border-outline-variant/10">
             <div>
                <p className="text-[10px] uppercase tracking-widest font-bold opacity-40 mb-1">Phone Contact</p>
                <p className="font-headline font-bold tracking-tight text-primary">{profile?.phoneNumber || 'Not provided'}</p>
             </div>
             <div>
                <p className="text-[10px] uppercase tracking-widest font-bold opacity-40 mb-1">Status</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <p className="font-headline font-bold tracking-tight">Active Member</p>
                </div>
             </div>
          </div>
        )}
      </section>

      {/* Title Section */}
      <section className="mb-16">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-headline text-5xl md:text-7xl font-bold tracking-tighter text-primary uppercase"
        >
          MY RITUALS
        </motion.h1>
      </section>

      {/* Upcoming Sessions */}
      <section className="mb-24">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-headline text-xl tracking-widest text-on-surface uppercase border-l-4 border-primary pl-4">
            Upcoming Rituals
          </h2>
        </div>
        
        {upcoming.length === 0 ? (
          <p className="text-on-surface-variant italic">No upcoming rituals.</p>
        ) : (
          <div className="space-y-12">
            {upcoming.map((session, index) => (
              <motion.div 
                key={session.id!}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group relative bg-surface-container p-8 transition-all duration-500 hover:bg-surface-container-high"
              >
                <div className="absolute -left-2 top-8 w-1 h-12 bg-primary"></div>
                <div className="flex flex-col md:flex-row justify-between gap-8">
                  <div className="space-y-4">
                    <span className="block text-outline-variant font-headline text-6xl absolute right-8 top-4 opacity-10 pointer-events-none">
                      {(index + 1).toString().padStart(2, '0')}
                    </span>
                    <h3 className="font-headline text-3xl text-on-surface font-bold uppercase">{getServiceName(session.serviceId)}</h3>
                    <div className="flex flex-col gap-2 font-body text-on-surface-variant">
                      <div className="flex items-center gap-3">
                        <Calendar className="text-primary" size={16} />
                        <span>{session.date} at {session.time}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Scissors className="text-primary" size={16} />
                        <span>Barber: {session.barber}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-end gap-3 md:min-w-[180px] relative z-10">
                    {reschedulingId === session.id ? (
                      <div className="bg-surface p-4 border border-primary/30 flex flex-col gap-3">
                        <input 
                          type="date" 
                          min={new Date().toISOString().split('T')[0]}
                          value={newDate}
                          onChange={e => setNewDate(e.target.value)}
                          className="bg-transparent border border-outline-variant/30 text-on-surface text-sm p-2 w-full focus:border-primary focus:outline-none"
                        />
                        <select 
                          disabled={loadingTimes || availableTimes.length === 0}
                          value={newTime}
                          onChange={e => setNewTime(e.target.value)}
                          className={`bg-surface border border-outline-variant/30 text-on-surface text-sm p-2 w-full focus:border-primary focus:outline-none ${availableTimes.length === 0 ? 'opacity-50' : ''}`}
                        >
                          <option value="">{loadingTimes ? 'Syncing...' : availableTimes.length === 0 ? 'Closed/Full' : 'Select Time'}</option>
                          {availableTimes.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleReschedule(session.id!)}
                            className="flex-1 bg-primary text-on-primary font-headline text-xs tracking-widest py-2 px-2 uppercase hover:bg-primary-fixed transition-colors"
                          >
                            Save
                          </button>
                          <button 
                            onClick={() => setReschedulingId(null)}
                            className="flex-1 border border-outline-variant text-on-surface-variant font-headline text-xs tracking-widest py-2 px-2 uppercase"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button 
                          onClick={() => {
                            setReschedulingId(session.id!);
                            setNewDate(session.date);
                            setNewTime(session.time);
                          }}
                          className="border border-outline-variant hover:border-primary text-primary font-headline text-xs tracking-widest py-4 px-6 transition-all duration-300 uppercase bg-surface-container"
                        >
                          RESCHEDULE
                        </button>
                        <button 
                          onClick={() => handleCancel(session.id!)}
                          className="text-on-surface-variant hover:text-error font-headline text-[10px] tracking-[0.2em] py-2 transition-colors duration-300 uppercase"
                        >
                          CANCEL RITUAL
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Past Cuts */}
      <section>
        <div className="flex items-center justify-between mb-12">
          <h2 className="font-headline text-xl tracking-widest text-on-surface-variant uppercase border-l-4 border-outline-variant pl-4">
            Ritual History
          </h2>
          <div className="h-[1px] flex-grow mx-8 bg-outline-variant/20"></div>
        </div>
        
        {past.length === 0 ? (
           <p className="text-on-surface-variant italic">No ritual history found.</p>
        ) : (
          <div className="space-y-0">
            {past.map((item, index) => (
              <motion.div 
                key={item.id!}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 0.6 }}
                viewport={{ once: true }}
                className="group flex items-center justify-between py-8 border-b border-outline-variant/10 hover:opacity-100 transition-opacity"
              >
                <div>
                  <h4 className="font-headline text-xl text-on-surface mb-1 uppercase">
                    {getServiceName(item.serviceId)} 
                    {item.status === 'Cancelled' && <span className="text-error text-xs ml-2 tracking-widest">(CANCELLED)</span>}
                  </h4>
                  <p className="font-body text-sm text-on-surface-variant">{item.date}</p>
                </div>
                {item.status !== 'Cancelled' && (
                  <button 
                    onClick={() => navigate(`/book?serviceId=${item.serviceId}`)}
                    className="text-primary font-headline text-[10px] tracking-widest uppercase border-b border-primary/40 hover:border-primary pb-1 transition-all flex items-center gap-2"
                  >
                    BOOK AGAIN <ChevronRight size={12} />
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </section>
      <ConfirmationModal 
        show={confirmModal.show}
        title={confirmModal.title}
        message={confirmModal.message}
        isDangerous={confirmModal.isDangerous}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, show: false }))}
      />
    </main>
  );
}
