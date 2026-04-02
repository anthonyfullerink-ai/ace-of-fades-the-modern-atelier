import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar as CalendarIcon, Clock, ChevronLeft, AlertTriangle, CheckCircle, Loader2, User } from 'lucide-react';
import { BARBERS, Barber } from '../data/barbers';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../config/firebase';
import { 
  getBlockedSlots, 
  getBookingsByDate, 
  createBooking, 
  getBlockedRanges, 
  BlockedRange, 
  getClientByUid, 
  getBusinessSettings, 
  BusinessSettings, 
  getShopHoursForDate, 
  generateTimeSlots, 
  isSlotAvailableForService, 
  timeToMinutes,
  getServices,
  Service
} from '../services/api';
import { sendBookingConfirmation } from '../services/email';
import toast from 'react-hot-toast';

export default function Booking() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const serviceId = searchParams.get('serviceId');
  const [user] = useAuthState(auth);
  
  const [step, setStep] = useState(1);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);

  const selectedService = useMemo(() => 
    services.find(s => s.id === serviceId) || services[0], 
  [serviceId, services]);

  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [blockedRanges, setBlockedRanges] = useState<BlockedRange[]>([]);
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null);
  const [isSuspended, setIsSuspended] = useState(false);

  // Fetch Services
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const svs = await getServices();
        setServices(svs);
      } catch (error) {
        toast.error("Failed to load services");
      } finally {
        setLoadingServices(false);
      }
    };
    fetchServices();
  }, []);

  // Check if user is suspended
  useEffect(() => {
    if (!user) return;
    const checkSuspension = async () => {
      try {
        const client = await getClientByUid(user.uid);
        if (client?.suspended) {
          setIsSuspended(true);
        }
      } catch (error) {
        console.error('Failed to check suspension status');
      }
    };
    checkSuspension();
  }, [user]);


  // Fetch real availability
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [ranges, settings] = await Promise.all([
          getBlockedRanges(),
          getBusinessSettings()
        ]);
        setBlockedRanges(ranges);
        setBusinessSettings(settings);
      } catch (error) {
        console.error("Failed to load initial data");
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!selectedDate || !businessSettings || !selectedService) return;

    const fetchAvailability = async () => {
        setLoadingTimes(true);
        try {
            const hours = getShopHoursForDate(businessSettings, selectedDate, blockedRanges);

            if (hours.closed) {
              setAvailableTimes([]);
              return;
            }

            const [dayBookings, blockedSlots] = await Promise.all([
                getBookingsByDate(selectedDate),
                getBlockedSlots(selectedDate)
            ]);

            const allPossibleSlots = generateTimeSlots(hours.open, hours.close);
            
            // Current time check for "today"
            const now = new Date();
            const localDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();

            const serviceDuration = selectedService?.duration || 30;

            const filtered = allPossibleSlots.filter(slot => {
                // 1. Core availability (Shop hours, overlaps, manual blocks)
                const isAvailable = isSlotAvailableForService(
                  slot, 
                  serviceDuration, 
                  hours, 
                  dayBookings, 
                  blockedSlots
                );
                
                if (!isAvailable) return false;

                // 2. Additional "Today" check: Can't book in the past or within next 30 mins
                if (selectedDate === localDateStr) {
                  const slotTimeInMinutes = timeToMinutes(slot);
                  if (slotTimeInMinutes < currentTimeInMinutes + 30) return false;
                }

                return true;
            });

            setAvailableTimes(filtered);
        } catch (error) {
            toast.error("Failed to check availability");
        } finally {
            setLoadingTimes(false);
        }
    };

    fetchAvailability();
  }, [selectedDate, blockedRanges, businessSettings, selectedService]);

  // Available dates (next 45 days)
  const availableDates = useMemo(() => {
    if (!businessSettings) return [];
    
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 45; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      
      const hours = getShopHoursForDate(businessSettings, dateStr, blockedRanges);

      if (!hours.closed) {
        dates.push(dateStr);
      }
    }
    return dates;
  }, [blockedRanges, businessSettings]);


  const handleBarberSelect = (barber: Barber) => {
    setSelectedBarber(barber);
    setStep(2);
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setStep(3);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep(4);
  };

  const handleConfirm = async () => {
    if (!user || !selectedDate || !selectedTime || !selectedBarber || !selectedService) {
        toast.error("Missing booking information or not logged in.");
        return;
    }

    setIsSubmitting(true);
    try {
        await createBooking({
            userId: user.uid,
            customerName: user.displayName || 'Client',
            customerEmail: user.email || '',
            serviceId: selectedService.id,
            date: selectedDate,
            time: selectedTime,
            status: 'Upcoming',
            barber: selectedBarber.name
        });

        // Send Email Confirmation (Optional/Best Effort)
        try {
            await sendBookingConfirmation({
                to_email: user.email || '',
                to_name: user.displayName || 'Valued Client',
                service_name: selectedService.name,
                booking_date: selectedDate,
                booking_time: selectedTime,
                price: selectedService.price,
                barber_name: selectedBarber.name
            });
        } catch (emailError) {
            console.warn("Booking saved, but confirmation email failed to send.", emailError);
        }

        toast.success("Booking confirmed!");
        setStep(5);
    } catch (error) {
        console.error("Booking error:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to confirm booking.";
        toast.error(errorMessage);
    } finally {
        setIsSubmitting(false);
    }
  };

  if (loadingServices) return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-6">
      <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <div className="font-headline uppercase tracking-[0.4em] text-xs text-primary animate-pulse">Initializing Portal</div>
    </div>
  );

  return (
    <main className="pt-32 pb-24 px-6 max-w-4xl mx-auto min-h-screen">
      {/* Progress Indicator */}
      {!isSuspended && step < 5 && (
        <div className="flex gap-2 mb-12">
          {[1, 2, 3, 4].map((s) => (
            <div 
              key={s} 
              className={`h-1.5 flex-1 transition-all duration-700 ${
                step >= s ? 'bg-primary' : 'bg-outline-variant/20'
              }`}
            ></div>
          ))}
        </div>
      )}

      {isSuspended ? (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24 bg-surface-container/30 backdrop-blur-md border border-red-500/10 p-12"
        >
          <div className="inline-flex items-center justify-center w-24 h-24 bg-red-500/10 border-2 border-red-500/30 rounded-full mb-10">
            <AlertTriangle className="text-red-500" size={48} />
          </div>
          <h2 className="font-headline text-4xl font-bold uppercase tracking-tight text-red-500 mb-6">Reservation Access Revoked</h2>
          <p className="text-on-surface-variant font-body max-w-md mx-auto text-lg leading-relaxed">
            Due to previous policy violations, online booking is unavailable. Please coordinate with Ace Of Fades management directly.
          </p>
        </motion.div>
      ) : !selectedService ? (
        <div className="text-center py-32 bg-surface-container/30 backdrop-blur-md border border-outline-variant/10 p-12">
          <h2 className="font-headline text-4xl font-bold uppercase tracking-tight text-on-surface mb-8">Service Unavailable</h2>
          <p className="text-on-surface-variant mb-12 max-w-md mx-auto text-lg">The specified treatment is currently being updated in our menu.</p>
          <button onClick={() => navigate('/services')} className="gold-gradient px-12 py-5 uppercase font-bold tracking-widest transition-transform active:scale-95 shadow-xl">Return to Menu</button>
        </div>
      ) : (
      <AnimatePresence mode="wait">
        {/* Step 1: Select Barber */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -10 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mb-12 relative">
               <span className="font-headline text-xs tracking-[0.4em] text-primary uppercase font-bold mb-4 block">The Artisans</span>
               <h1 className="font-headline text-5xl md:text-7xl font-bold tracking-tighter text-on-surface uppercase leading-none">
                 Select Your<br/>Artisan
               </h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {BARBERS.map((barber) => (
                <button
                  key={barber.id}
                  onClick={() => handleBarberSelect(barber)}
                  className={`group relative p-10 transition-all duration-700 text-left border overflow-hidden ${
                    selectedBarber?.id === barber.id 
                      ? 'bg-surface-container-high border-primary shadow-2xl' 
                      : 'bg-surface-container/40 border-outline-variant/10 hover:border-primary/40'
                  }`}
                >
                  <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-10 transition-opacity">
                    <User size={80} className="text-primary" />
                  </div>
                  <div className="flex items-center gap-8 relative z-10">
                    <div className="w-24 h-24 bg-primary/5 border border-primary/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-700">
                      <User size={40} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="font-headline text-3xl font-bold uppercase tracking-tight mb-1">{barber.name}</h3>
                      <p className="text-on-surface-variant text-xs uppercase tracking-[0.2em] font-bold opacity-60">{barber.title}</p>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-700"></div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 2: Select Date */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -10 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <button 
              onClick={() => setStep(1)}
              className="group flex items-center gap-3 text-on-surface-variant hover:text-primary mb-12 transition-all uppercase text-[10px] tracking-[0.3em] font-bold"
            >
              <div className="w-8 h-8 rounded-full border border-outline-variant/30 flex items-center justify-center group-hover:border-primary">
                <ChevronLeft size={16} />
              </div>
              Back to artisans
            </button>
            <div className="mb-12">
               <span className="font-headline text-xs tracking-[0.4em] text-primary uppercase font-bold mb-4 block">Availability</span>
               <h1 className="font-headline text-5xl md:text-7xl font-bold tracking-tighter text-on-surface uppercase leading-none">
                 Select Your<br/>Ritual Date
               </h1>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {availableDates.map((date) => {
                const d = new Date(date + 'T00:00:00');
                const isSelected = selectedDate === date;
                return (
                  <button
                    key={date}
                    onClick={() => handleDateSelect(date)}
                    className={`p-10 border transition-all duration-700 text-center relative group overflow-hidden ${
                      isSelected 
                        ? 'bg-primary text-on-primary border-primary shadow-2xl scale-105 z-10' 
                        : 'bg-surface-container/40 border-outline-variant/10 hover:border-primary/40'
                    }`}
                  >
                    <div className="relative z-10">
                      <p className={`text-[10px] uppercase tracking-[0.3em] font-bold mb-3 ${isSelected ? 'text-on-primary/60' : 'text-outline'}`}>
                        {d.toLocaleDateString('en-US', { weekday: 'short' })}
                      </p>
                      <p className="font-headline text-4xl font-black">
                        {d.toLocaleDateString('en-US', { day: 'numeric' })}
                      </p>
                      <p className={`text-xs uppercase tracking-[0.2em] font-bold mt-2 ${isSelected ? 'text-on-primary/80' : 'text-on-surface-variant opacity-60'}`}>
                        {d.toLocaleDateString('en-US', { month: 'short' })}
                      </p>
                    </div>
                    {!isSelected && <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                       <CalendarIcon size={12} className="text-primary" />
                    </div>}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Step 3: Select Time */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -10 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <button 
              onClick={() => setStep(2)}
              className="group flex items-center gap-3 text-on-surface-variant hover:text-primary mb-12 transition-all uppercase text-[10px] tracking-[0.3em] font-bold"
            >
              <div className="w-8 h-8 rounded-full border border-outline-variant/30 flex items-center justify-center group-hover:border-primary">
                <ChevronLeft size={16} />
              </div>
              Back to calendar
            </button>
            <div className="mb-12">
               <span className="font-headline text-xs tracking-[0.4em] text-primary uppercase font-bold mb-4 block">Precision</span>
               <h1 className="font-headline text-5xl md:text-7xl font-bold tracking-tighter text-on-surface uppercase leading-none">
                 Select Your<br/>Ritual Time
               </h1>
            </div>
            
            {loadingTimes ? (
              <div className="flex flex-col items-center justify-center py-32 bg-surface-container/20 backdrop-blur-sm border border-outline-variant/10 gap-8">
                <div className="relative">
                   <div className="w-20 h-20 border-2 border-primary/20 rounded-full"></div>
                   <div className="absolute top-0 left-0 w-20 h-20 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="font-headline uppercase tracking-[0.4em] text-xs text-primary animate-pulse font-black">Syncing Ritual Schedule</p>
              </div>
            ) : availableTimes.length === 0 ? (
              <div className="text-center py-24 bg-surface-container/30 backdrop-blur-md border border-outline-variant/10 p-12">
                <p className="font-headline text-2xl uppercase tracking-widest text-on-surface-variant opacity-60 mb-8 font-bold">Ace Of Fades fully booked for this ritual cycle</p>
                <button 
                  onClick={() => setStep(2)}
                  className="gold-gradient px-12 py-5 text-on-primary font-headline uppercase font-bold tracking-widest shadow-xl"
                >
                  Explore Alternative Rituals
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {availableTimes.map((time) => (
                  <button
                    key={time}
                    onClick={() => handleTimeSelect(time)}
                    className={`p-6 border transition-all duration-500 text-center relative group overflow-hidden ${
                      selectedTime === time 
                        ? 'bg-primary text-on-primary border-primary shadow-xl scale-105 z-10' 
                        : 'bg-surface-container/40 border-outline-variant/10 hover:border-primary/40'
                    }`}
                  >
                    <p className="font-headline text-lg font-black tracking-tighter">{time.replace(':00', '')}</p>
                    <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-40">
                      <Clock size={10} className={selectedTime === time ? 'text-on-primary' : 'text-primary'} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Step 4: Confirm */}
        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="bg-surface-container/40 backdrop-blur-xl p-10 md:p-16 border border-outline-variant/10 shadow-3xl overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
               <CheckCircle size={200} className="text-primary" />
            </div>

            <h1 className="font-headline text-5xl font-bold tracking-tighter text-on-surface uppercase mb-16 text-center leading-none">
              Review Your<br/><span className="text-primary">Ritual Details</span>
            </h1>
            
            <div className="space-y-12 mb-20 relative z-10">
              <div className="flex justify-between items-end border-b-2 border-outline-variant/10 pb-6 group">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.4em] text-primary/60 font-black mb-2">The Treatment</p>
                  <h3 className="font-headline text-3xl md:text-4xl font-bold uppercase tracking-tight">{selectedService.name}</h3>
                </div>
                <p className="font-headline text-3xl text-primary font-black mb-1">{selectedService.price}</p>
              </div>

              <div className="flex justify-between items-end border-b-2 border-outline-variant/10 pb-6">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.4em] text-primary/60 font-black mb-2">The Practitioner</p>
                  <h3 className="font-headline text-2xl md:text-3xl font-bold uppercase tracking-tight">{selectedBarber?.name}</h3>
                  <p className="text-on-surface-variant text-xs uppercase tracking-[0.2em] font-bold opacity-60 mt-1">{selectedBarber?.title}</p>
                </div>
                <div className="w-16 h-16 bg-primary/10 border-2 border-primary/20 rounded-full flex items-center justify-center mb-1">
                  <User size={28} className="text-primary" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="flex flex-col gap-6">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.4em] text-primary/60 font-black mb-3">Ritual Schedule</p>
                    <div className="flex items-center gap-4 text-on-surface">
                      <div className="w-10 h-10 rounded-full bg-primary/5 border border-primary/20 flex items-center justify-center">
                        <CalendarIcon size={16} className="text-primary" />
                      </div>
                      <span className="font-headline text-sm uppercase tracking-widest font-bold">
                        {new Date(selectedDate! + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-on-surface mt-4">
                      <div className="w-10 h-10 rounded-full bg-primary/5 border border-primary/20 flex items-center justify-center">
                        <Clock size={16} className="text-primary" />
                      </div>
                      <span className="font-headline text-sm uppercase tracking-widest font-bold">{selectedTime} <span className="text-primary/60 ml-2">({selectedService.duration} min session)</span></span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-surface-container-highest/50 backdrop-blur-md p-8 border-l-4 border-primary relative">
                  <div className="flex items-start gap-4 text-primary mb-3">
                    <AlertTriangle size={24} />
                    <h4 className="font-headline font-black uppercase text-xs tracking-[0.3em]">Protocol</h4>
                  </div>
                  <p className="text-on-surface-variant text-sm leading-relaxed font-body">
                    Elegance is timely. Rituals with a <span className="text-on-surface font-black">5-minute delay</span> will be considered forfeited. We recommend arriving 10 minutes prior for the full experience.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6 relative z-10">
              <button 
                onClick={handleConfirm}
                disabled={isSubmitting}
                className="gold-gradient w-full py-7 flex justify-center items-center gap-4 text-on-primary font-headline font-black tracking-[0.4em] uppercase shadow-2xl transition-all duration-500 hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
              >
                {isSubmitting ? (
                    <><Loader2 className="animate-spin" size={24} /> Processing Ritual...</>
                ) : (
                    <>Establish Ritual <CheckCircle size={20} /></>
                )}
              </button>
              <button 
                onClick={() => setStep(3)}
                className="text-on-surface-variant hover:text-primary uppercase text-[10px] tracking-[0.4em] font-black transition-all py-3 border border-transparent hover:border-primary/20"
              >
                Revise Details
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 5: Success */}
        {step === 5 && (
          <motion.div
            key="step5"
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="text-center py-32 bg-surface-container/30 backdrop-blur-md border border-primary/20 shadow-3xl p-16"
          >
            <div className="inline-flex items-center justify-center w-28 h-28 bg-primary/10 border-2 border-primary/30 rounded-full mb-12 animate-bounce">
              <CheckCircle size={56} className="text-primary" />
            </div>
            <h1 className="font-headline text-5xl md:text-8xl font-bold tracking-tighter text-on-surface uppercase mb-6 leading-none">
              RITUAL<br/><span className="text-primary">SECURED</span>
            </h1>
            <p className="text-on-surface-variant text-xl mb-16 max-w-lg mx-auto leading-relaxed">
              Your ritual with <span className="text-primary font-black uppercase tracking-widest">{selectedBarber?.name}</span> is confirmed for {selectedTime} on {new Date(selectedDate! + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}.
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <button 
                onClick={() => navigate('/dashboard')}
                className="gold-gradient px-12 py-6 text-on-primary font-headline font-black tracking-[0.3em] uppercase shadow-xl hover:brightness-110 transition-all"
              >
                Access Dashboard
              </button>
              <button 
                onClick={() => navigate('/')}
                className="bg-surface-container-high px-12 py-6 text-on-surface font-headline font-black tracking-[0.3em] uppercase border border-outline-variant/20 hover:border-primary transition-all"
              >
                Return Home
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      )}
    </main>
  );
}
