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
      {isSuspended ? (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
        >
          <div className="inline-flex items-center justify-center w-24 h-24 bg-red-500/10 border-2 border-red-500/30 rounded-full mb-8">
            <AlertTriangle className="text-red-500" size={48} />
          </div>
          <h2 className="font-headline text-3xl font-bold uppercase tracking-widest text-red-500 mb-4">Account Suspended</h2>
          <p className="text-on-surface-variant font-body max-w-md mx-auto">
            Your account has been suspended due to repeated no-shows. Please contact us directly to resolve this.
          </p>
        </motion.div>
      ) : !selectedService ? (
        <div className="text-center py-20">
          <h2 className="font-headline text-3xl font-bold uppercase tracking-widest text-on-surface mb-4">Service Not Found</h2>
          <p className="text-on-surface-variant mb-8">The service you requested is currently unavailable.</p>
          <button onClick={() => navigate('/services')} className="gold-gradient px-10 py-4 uppercase font-bold tracking-widest">View Services</button>
        </div>
      ) : (
      <AnimatePresence mode="wait">
        {/* Step 1: Select Barber */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h1 className="font-headline text-4xl md:text-6xl font-bold tracking-tighter text-primary uppercase mb-4">
              Select Your Barber
            </h1>
            <p className="text-on-surface-variant font-body mb-12 text-lg">Choose your barber for <span className="text-primary font-bold">{selectedService.name}</span></p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {BARBERS.map((barber) => (
                <button
                  key={barber.id}
                  onClick={() => handleBarberSelect(barber)}
                  className={`group relative p-8 border-2 transition-all text-left hover:border-primary hover:shadow-lg hover:shadow-primary/5 ${
                    selectedBarber?.id === barber.id 
                      ? 'bg-primary/5 border-primary' 
                      : 'bg-surface-container border-outline-variant/20'
                  }`}
                >
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-primary/10 border-2 border-primary/30 rounded-full flex items-center justify-center group-hover:border-primary transition-colors">
                      <User size={36} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="font-headline text-2xl font-bold uppercase tracking-tight">{barber.name}</h3>
                      <p className="text-on-surface-variant text-sm mt-1 font-body">{barber.title}</p>
                    </div>
                  </div>
                  <div className="absolute top-4 right-4">
                    <div className={`w-3 h-3 rounded-full ${selectedBarber?.id === barber.id ? 'bg-primary' : 'bg-outline-variant/30 group-hover:bg-primary/50'} transition-colors`}></div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 2: Select Date */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <button 
              onClick={() => setStep(1)}
              className="flex items-center gap-2 text-on-surface-variant hover:text-primary mb-8 transition-colors uppercase text-xs tracking-widest"
            >
              <ChevronLeft size={16} /> Back to barber selection
            </button>
            <h1 className="font-headline text-4xl md:text-6xl font-bold tracking-tighter text-primary uppercase mb-4">
              Select Date
            </h1>
            <p className="text-on-surface-variant font-body mb-12 text-sm">Booking with <span className="text-primary font-bold">{selectedBarber?.name}</span></p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {availableDates.map((date) => {
                const d = new Date(date + 'T00:00:00');
                return (
                  <button
                    key={date}
                    onClick={() => handleDateSelect(date)}
                    className={`p-6 border border-outline-variant/20 transition-all text-center hover:bg-surface-container-highest ${
                      selectedDate === date ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container'
                    }`}
                  >
                    <p className="text-xs uppercase tracking-widest opacity-60 mb-1">
                      {d.toLocaleDateString('en-US', { weekday: 'short' })}
                    </p>
                    <p className="font-headline text-2xl font-bold">
                      {d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                    </p>
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
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <button 
              onClick={() => setStep(2)}
              className="flex items-center gap-2 text-on-surface-variant hover:text-primary mb-8 transition-colors uppercase text-xs tracking-widest"
            >
              <ChevronLeft size={16} /> Back to dates
            </button>
            <h1 className="font-headline text-4xl md:text-6xl font-bold tracking-tighter text-primary uppercase mb-8">
              Select Time
            </h1>
            
            {loadingTimes ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="animate-spin text-primary" size={48} />
                <p className="font-headline uppercase tracking-[0.2em] text-sm opacity-60">Checking Schedule...</p>
              </div>
            ) : availableTimes.length === 0 ? (
              <div className="text-center py-20 border border-outline-variant/10 bg-surface-container">
                <p className="font-headline text-xl uppercase tracking-widest opacity-60">No slots available for this day</p>
                <button 
                  onClick={() => setStep(2)}
                  className="mt-6 text-primary font-bold uppercase text-xs tracking-[0.2em] hover:underline"
                >
                  Try another date
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {availableTimes.map((time) => (
                  <button
                    key={time}
                    onClick={() => handleTimeSelect(time)}
                    className={`p-4 border border-outline-variant/20 transition-all text-center hover:bg-surface-container-highest group ${
                      selectedTime === time ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container'
                    }`}
                  >
                    <p className="font-headline text-sm font-bold">{time.replace(':00', '')}</p>
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-surface-container p-8 md:p-12 border border-outline-variant/10"
          >
            <h1 className="font-headline text-4xl font-bold tracking-tighter text-primary uppercase mb-12 text-center">
              Confirm Booking
            </h1>
            
            <div className="space-y-8 mb-12">
              <div className="flex justify-between items-end border-b border-outline-variant/20 pb-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-outline mb-1">Service</p>
                  <h3 className="font-headline text-2xl font-bold uppercase">{selectedService.name}</h3>
                </div>
                <p className="font-headline text-xl text-primary font-bold">{selectedService.price}</p>
              </div>

              <div className="flex justify-between items-end border-b border-outline-variant/20 pb-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-outline mb-1">Barber</p>
                  <h3 className="font-headline text-xl font-bold uppercase">{selectedBarber?.name}</h3>
                  <p className="text-on-surface-variant text-sm">{selectedBarber?.title}</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 border border-primary/30 rounded-full flex items-center justify-center">
                  <User size={20} className="text-primary" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-outline mb-1">Date & Time</p>
                  <div className="flex items-center gap-3 text-on-surface">
                    <CalendarIcon size={18} className="text-primary" />
                    <span className="font-body">
                      {new Date(selectedDate! + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-on-surface mt-2">
                    <Clock size={18} className="text-primary" />
                    <span className="font-body">{selectedTime} ({selectedService.duration} min)</span>
                  </div>
                </div>
                
                <div className="bg-surface-container-lowest p-6 border-l-4 border-primary">
                  <div className="flex items-start gap-3 text-primary mb-2">
                    <AlertTriangle size={20} />
                    <h4 className="font-headline font-bold uppercase text-sm tracking-widest">Late Policy</h4>
                  </div>
                  <p className="text-on-surface-variant text-sm leading-relaxed">
                    Precision requires preparation. All clients arriving <span className="text-on-surface font-bold">5 minutes late</span> will be considered a no-show. Please arrive 5-10 minutes early.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <button 
                onClick={handleConfirm}
                disabled={isSubmitting}
                className="gold-gradient w-full py-6 flex justify-center items-center gap-2 text-on-primary font-headline font-bold tracking-[0.3em] uppercase active:scale-[0.98] transition-transform disabled:opacity-70"
              >
                {isSubmitting ? (
                    <><Loader2 className="animate-spin" size={24} /> Processing...</>
                ) : (
                    'Confirm Appointment'
                )}
              </button>
              <button 
                onClick={() => setStep(3)}
                className="text-on-surface-variant hover:text-on-surface uppercase text-[10px] tracking-widest transition-colors py-2"
              >
                Change details
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 5: Success */}
        {step === 5 && (
          <motion.div
            key="step5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-8">
              <CheckCircle size={40} className="text-primary" />
            </div>
            <h1 className="font-headline text-4xl md:text-6xl font-bold tracking-tighter text-on-surface uppercase mb-4">
              Booking Confirmed
            </h1>
            <p className="text-on-surface-variant text-lg mb-12 max-w-md mx-auto">
              Your appointment with <span className="text-primary font-bold">{selectedBarber?.name}</span> for {selectedService?.name} is set for {selectedTime} on {new Date(selectedDate! + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}.
            </p>
            <button 
              onClick={() => navigate('/dashboard')}
              className="gold-gradient px-12 py-5 text-on-primary font-headline font-bold tracking-widest uppercase"
            >
              Go to Dashboard
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      )}
    </main>
  );
}
