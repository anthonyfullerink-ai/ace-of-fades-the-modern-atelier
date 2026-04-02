import { db } from '../config/firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  setDoc,
  query, 
  where, 
  updateDoc, 
  doc, 
  deleteDoc,
  orderBy,
  limit,
  increment
} from 'firebase/firestore';

export interface Booking {
  id?: string;
  userId: string;
  customerName?: string;
  customerEmail?: string;
  serviceId: string;
  serviceDuration?: number; // duration in minutes
  date: string;
  time: string;
  status: 'Upcoming' | 'Completed' | 'Cancelled' | 'No-Show';
  barber: string;
  createdAt?: number;
  source?: 'local' | 'vagaro'; // origin of the booking
  externalId?: string; // ID from external system (e.g., Vagaro)
}

export interface BlockedSlot {
  id?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm AM/PM
  reason?: string;
}

export interface BlockedRange {
  id?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  reason?: string;
}

const bookingsCollection = collection(db, 'bookings');
const blockedSlotsCollection = collection(db, 'blocked_slots');
const blockedRangesCollection = collection(db, 'blocked_ranges');
const usersCollection = collection(db, 'users');
const settingsCollection = collection(db, 'settings');
const servicesCollection = collection(db, 'services');
const loginLogsCollection = collection(db, 'login_logs');
const dailyStatsCollection = collection(db, 'daily_stats');

export interface DailyStats {
  id?: string;
  visits: number;
  bookings: number;
  date: string; // YYYY-MM-DD
}

export interface LoginLog {
  id?: string;
  userId: string;
  email: string;
  displayName?: string;
  timestamp: number;
  role: 'admin' | 'client';
  userAgent: string;
}

export interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}

export interface WeeklyHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

export const WEEKDAY_ORDER: (keyof WeeklyHours)[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
];

export interface SpecialHours {
  id?: string;
  date: string; // YYYY-MM-DD
  open: string;
  close: string;
  closed: boolean;
  reason?: string;
}

export interface BusinessSettings {
  weeklyHours: WeeklyHours;
  specialHours: SpecialHours[];
  blockedRanges?: { id: string; startDate: string; endDate: string; reason?: string }[];
  notice?: string;
}

const DEFAULT_WEEKLY_HOURS: WeeklyHours = {
  monday: { open: '10:00', close: '18:00', closed: false },
  wednesday: { open: '10:00', close: '18:00', closed: false },
  friday: { open: '10:00', close: '18:00', closed: false },
  thursday: { open: '09:30', close: '18:00', closed: false },
  saturday: { open: '09:00', close: '15:00', closed: false },
  sunday: { open: '10:00', close: '18:00', closed: false },
  tuesday: { open: '10:00', close: '18:00', closed: false },
};

export interface Client {
  uid: string;
  displayName: string;
  email: string;
  phoneNumber?: string;
  createdAt: number;
  lastLogin?: number;
  isGuest?: boolean;
  suspended?: boolean;
  noShowCount?: number;
  source?: 'local' | 'vagaro'; // origin of the client record
  externalId?: string; // ID from external system (e.g., Vagaro)
}

const withTimeout = <T>(promise: Promise<T>, timeoutMs = 30000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error("Request timed out. Please check your internet connection or database status.")), timeoutMs)
    )
  ]);
};

export const createBooking = async (booking: Booking): Promise<string> => {
  try {
    // If duration is missing, try to find it (for manual entries or legacy support)
    let finalBooking = { ...booking, source: booking.source || 'local' as const };
    if (!finalBooking.serviceDuration) {
      // 1. Try to fetch from Firestore first (most accurate)
      try {
        const serviceRef = doc(db, 'services', booking.serviceId);
        const serviceSnap = await getDoc(serviceRef);
        if (serviceSnap.exists()) {
          finalBooking.serviceDuration = (serviceSnap.data() as any).duration;
        } else {
          // 2. Fallback to static data
          const { SERVICES } = await import('../data/services');
          const service = SERVICES.find(s => s.id === booking.serviceId);
          if (service) {
            finalBooking.serviceDuration = service.duration;
          }
        }
      } catch (e) {
        console.warn("Failed to fetch service duration during booking creation", e);
      }
    }

    // Check for booking conflicts before creating
    try {
      const { checkBookingConflict } = await import('./bookingConflicts');
      const conflict = await checkBookingConflict(
        finalBooking.date,
        finalBooking.time,
        finalBooking.serviceDuration || 30,
        finalBooking.barber
      );
      if (conflict.hasConflict) {
        throw new Error(`Booking conflict: ${conflict.reason}`);
      }
    } catch (conflictError: any) {
      // Re-throw actual conflict errors, but swallow import/network errors
      if (conflictError?.message?.startsWith('Booking conflict:')) {
        throw conflictError;
      }
      console.warn('Conflict check skipped:', conflictError);
    }

    const docRef = await addDoc(bookingsCollection, { 
      ...finalBooking, 
      createdAt: Date.now() 
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating booking:", error);
    throw error;
  }
};

export const getUserBookings = async (userId: string): Promise<Booking[]> => {
  try {
    const q = query(bookingsCollection, where("userId", "==", userId), orderBy("createdAt", "desc"));
    const querySnapshot = await withTimeout(getDocs(q));
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Booking));
  } catch (error) {
    console.warn("Error getting user bookings. Trying fallback or handling timeout.", error);
    if (error instanceof Error && error.message.includes("timed out")) {
        throw error;
    }
    
    try {
        const fallbackQ = query(bookingsCollection, where("userId", "==", userId));
        const fallbackSnapshot = await withTimeout(getDocs(fallbackQ), 15000);
        const docs = fallbackSnapshot.docs.map(d => ({
            id: d.id,
            ...d.data()
        } as Booking));
        return docs.sort((a,b) => b.createdAt - a.createdAt);
    } catch (fallbackError) {
        console.error("Fallback query also failed:", fallbackError);
        throw fallbackError;
    }
  }
};

export const rescheduleBooking = async (bookingId: string, newDate: string, newTime: string) => {
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    await updateDoc(bookingRef, {
      date: newDate,
      time: newTime
    });
    return true;
  } catch (error) {
    console.error("Error rescheduling booking: ", error);
    throw error;
  }
};

export const cancelBooking = async (bookingId: string) => {
  return updateBookingStatus(bookingId, 'Cancelled');
};

export const getAllBookings = async (): Promise<Booking[]> => {
  try {
    const q = query(bookingsCollection, orderBy("date", "desc"), orderBy("time", "desc"), limit(500));
    const querySnapshot = await withTimeout(getDocs(q));
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Booking));
  } catch (error) {
    console.error("Error getting all bookings:", error);
    // Fallback if index isn't ready or other error
    try {
      const querySnapshot = await withTimeout(getDocs(bookingsCollection), 15000);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Booking)).sort((a,b) => b.createdAt - a.createdAt);
    } catch (e) {
      console.error("Critical error in getAllBookings fallback:", e);
      return [];
    }
  }
};

export const getBookingsByDate = async (date: string): Promise<Booking[]> => {
  try {
    // Filter by date on the server for performance
    const q = query(bookingsCollection, where("date", "==", date));
    const querySnapshot = await withTimeout(getDocs(q), 15000);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Booking));
  } catch (error) {
    console.error("Error getting bookings by date:", error);
    // If the server query fails, we return an empty array to allow the UI to handle it
    // rather than potentially failing everything.
    return [];
  }
};

export const updateBookingStatus = async (bookingId: string, status: Booking['status']) => {
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    await updateDoc(bookingRef, { status });

    // Auto-suspend after 2 no-shows
    if (status === 'No-Show') {
      const bookingSnap = await getDoc(bookingRef);
      if (bookingSnap.exists()) {
        const booking = bookingSnap.data() as Booking;
        const userId = booking.userId;
        // Don't process manual/guest entries
        if (userId && !userId.startsWith('manual-') && !userId.startsWith('guest-')) {
          const userRef = doc(db, 'users', userId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            const newCount = (userData.noShowCount || 0) + 1;
            await updateDoc(userRef, { 
              noShowCount: newCount,
              suspended: newCount >= 2
            });
          }
        }
      }
    }

    return true;
  } catch (error) {
    console.error("Error updating booking status:", error);
    throw error;
  }
};

/**
 * Synchronizes booking statuses by marking past "Upcoming" appointments as "Completed".
 */
export const syncBookingStatuses = async () => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Query for all upcoming bookings
    const q = query(bookingsCollection, where("status", "==", "Upcoming"));
    const snapshot = await withTimeout(getDocs(q));

    const updates = snapshot.docs.map(async (docSnapshot) => {
      const booking = docSnapshot.data() as Booking;
      const bDate = booking.date;
      const bMinutes = timeToMinutes(booking.time);
      const bDuration = booking.serviceDuration || 30;

      // Condition for completion:
      // 1. Date is strictly in the past
      // 2. Date is today, but the appointment end time (start + duration) has passed
      if (bDate < todayStr || (bDate === todayStr && (bMinutes + bDuration) < currentMinutes)) {
        await updateDoc(docSnapshot.ref, { status: 'Completed' });
        return docSnapshot.id;
      }
      return null;
    });

    const results = await Promise.all(updates);
    const updatedCount = results.filter(r => r !== null).length;
    
    if (updatedCount > 0) {
      console.log(`Successfully auto-completed ${updatedCount} past appointments.`);
    }
    
    return updatedCount;
  } catch (error) {
    console.error("Failed to sync booking statuses:", error);
    return 0;
  }
};

export const getBlockedSlots = async (date?: string): Promise<BlockedSlot[]> => {
  try {
    let q = query(blockedSlotsCollection);
    if (date) {
      q = query(blockedSlotsCollection, where("date", "==", date));
    }
    const querySnapshot = await withTimeout(getDocs(q), 15000);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as BlockedSlot));
  } catch (error) {
    console.error("Error getting blocked slots:", error);
    return [];
  }
};

export const addBlockedSlot = async (slot: Omit<BlockedSlot, 'id'>) => {
  try {
    const docRef = await addDoc(blockedSlotsCollection, slot);
    return docRef.id;
  } catch (error) {
    console.error("Error adding blocked slot:", error);
    throw error;
  }
};

export const removeBlockedSlot = async (slotId: string) => {
  try {
    const slotRef = doc(db, 'blocked_slots', slotId);
    await deleteDoc(slotRef);
    return true;
  } catch (error) {
    console.error("Error removing blocked slot:", error);
    throw error;
  }
};

export const getBlockedRanges = async (): Promise<BlockedRange[]> => {
  try {
    const querySnapshot = await getDocs(blockedRangesCollection);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as BlockedRange));
  } catch (error) {
    console.error("Error getting blocked ranges:", error);
    return [];
  }
};

export const addBlockedRange = async (range: Omit<BlockedRange, 'id'>) => {
  try {
    const docRef = await addDoc(blockedRangesCollection, range);
    return docRef.id;
  } catch (error) {
    console.error("Error adding blocked range:", error);
    throw error;
  }
};

export const removeBlockedRange = async (rangeId: string) => {
  try {
    const rangeRef = doc(db, 'blocked_ranges', rangeId);
    await deleteDoc(rangeRef);
    return true;
  } catch (error) {
    console.error("Error removing blocked range:", error);
    throw error;
  }
};

// --- Client Management ---

export const getAllClients = async (): Promise<Client[]> => {
  try {
    // 1. Fetch all user documents (includes both registered and guest docs created by suspend/update)
    const usersSnapshot = await withTimeout(getDocs(usersCollection));
    const clientMap = new Map<string, Client>();

    // Build map from Firestore user docs (these have suspend/noShowCount data)
    usersSnapshot.docs.forEach(docSnap => {
      const data = docSnap.data() as Client;
      const key = data.email ? data.email.toLowerCase() : data.uid;
      clientMap.set(key, { ...data, uid: data.uid || docSnap.id });
    });

    // 2. Fetch recent bookings to find guest contacts not yet in user docs
    const bookingsSnapshot = await withTimeout(getDocs(query(bookingsCollection, orderBy("createdAt", "desc"), limit(200))));
    const allBookings = bookingsSnapshot.docs.map(d => d.data() as Booking);

    // Merge booking contacts — only add if not already present
    allBookings.forEach(booking => {
      if (booking.customerEmail) {
        const key = booking.customerEmail.toLowerCase();
        if (!clientMap.has(key)) {
          clientMap.set(key, {
            uid: booking.userId.startsWith('manual-') ? `guest-${key}` : booking.userId,
            displayName: booking.customerName || 'Guest',
            email: booking.customerEmail,
            createdAt: booking.createdAt,
            isGuest: true
          });
        }
      }
    });

    return Array.from(clientMap.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  } catch (error) {
    console.error("Error getting unified client list:", error);
    return [];
  }
};

export const getClientByUid = async (uid: string): Promise<Client | null> => {
  try {
    const userRef = doc(db, 'users', uid);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      return { uid: docSnap.id, ...docSnap.data() } as Client;
    }
    return null;
  } catch (error) {
    console.error("Error getting client by UID:", error);
    return null;
  }
};

export const updateClient = async (uid: string, data: Partial<Client>) => {
  try {
    const userRef = doc(db, 'users', uid);
    // Use setDoc with merge: true so it works for both existing users and guests being "upgraded"
    await setDoc(userRef, {
      ...data,
      uid: uid // Ensure UID is preserved
    }, { merge: true });
    return true;
  } catch (error) {
    console.error("Error updating client:", error);
    throw error;
  }
};

export const deleteClient = async (uid: string) => {
  try {
    const userRef = doc(db, 'users', uid);
    await deleteDoc(userRef);
    return true;
  } catch (error) {
    console.error("Error deleting client:", error);
    throw error;
  }
};

export const deleteBooking = async (bookingId: string) => {
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    await deleteDoc(bookingRef);
    return true;
  } catch (error) {
    console.error("Error deleting booking:", error);
    throw error;
  }
};

export const suspendClient = async (uid: string, suspended: boolean, clientData?: { email?: string; displayName?: string }) => {
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, { 
      suspended, 
      uid,
      ...(clientData || {})
    }, { merge: true });
    return true;
  } catch (error) {
    console.error("Error suspending client:", error);
    throw error;
  }
};

export const initClientDoc = async (user: any) => {
  try {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    
    // To prevent overwriting createdAt, we check if it exists first
    const docSnap = await getDoc(userRef);
    if (!docSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        displayName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        email: user.email || '',
        createdAt: Date.now(),
        lastLogin: Date.now(),
        isGuest: false
      });
    } else {
      await updateDoc(userRef, { 
        lastLogin: Date.now(),
        // Sync displayName if it was missing
        ...( !docSnap.data().displayName ? { displayName: user.displayName || user.email?.split('@')[0] || 'Anonymous' } : {} )
      });
    }

    return true;
  } catch (error) {
    console.error("Error initializing client doc:", error);
  }
};

// --- Service Management ---

export interface Service {
  id: string;
  name: string;
  desc: string;
  price: string;
  duration: number; // in minutes
}

export const getServices = async (): Promise<Service[]> => {
  try {
    const q = query(servicesCollection, orderBy("name", "asc"));
    // Add a reasonable timeout to prevent infinite hang if network is slow/broken
    const querySnapshot = await withTimeout(getDocs(q), 10000);
    
    if (querySnapshot.empty) {
      console.warn("No services found in Firestore, using static data.");
      const { SERVICES } = await import('../data/services');
      return SERVICES;
    }

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Service));
  } catch (error) {
    console.error("Critical error fetching services:", error);
    // Absolute fallback so the app stays functional
    try {
      const { SERVICES } = await import('../data/services');
      return SERVICES;
    } catch (e) {
      console.error("Double failure in getServices:", e);
      return [];
    }
  }
};

export const addService = async (service: Omit<Service, 'id'>) => {
  try {
    const docRef = await addDoc(servicesCollection, service);
    return docRef.id;
  } catch (error) {
    console.error("Error adding service:", error);
    throw error;
  }
};

export const updateService = async (serviceId: string, data: Partial<Service>) => {
  try {
    const serviceRef = doc(db, 'services', serviceId);
    await updateDoc(serviceRef, data);
    return true;
  } catch (error) {
    console.error("Error updating service:", error);
    throw error;
  }
};

export const deleteService = async (serviceId: string) => {
  try {
    const serviceRef = doc(db, 'services', serviceId);
    await deleteDoc(serviceRef);
    return true;
  } catch (error) {
    console.error("Error deleting service:", error);
    throw error;
  }
};

export const getServiceById = async (id: string): Promise<Service | null> => {
  try {
    const serviceRef = doc(db, 'services', id);
    const docSnap = await getDoc(serviceRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Service;
    }
    return null;
  } catch (error) {
    console.error("Error getting service by ID:", error);
    return null;
  }
};

// --- Business Settings ---

export const getBusinessSettings = async (): Promise<BusinessSettings> => {
  try {
    const settingsRef = doc(db, 'settings', 'business');
    const docSnap = await getDoc(settingsRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data() as BusinessSettings;
      // Ensure all days are present and other fields are initialized
      return {
        ...data,
        weeklyHours: { ...DEFAULT_WEEKLY_HOURS, ...data.weeklyHours },
        specialHours: data.specialHours || [],
        blockedRanges: data.blockedRanges || [],
      };
    }
    
    // Return default if no settings exist yet
    return {
      weeklyHours: DEFAULT_WEEKLY_HOURS,
      specialHours: [],
      blockedRanges: [],
      notice: ""
    };
  } catch (error) {
    console.error("Error getting business settings:", error);
    return {
      weeklyHours: DEFAULT_WEEKLY_HOURS,
      specialHours: [],
      blockedRanges: [],
      notice: ""
    };
  }
};

export const updateBusinessSettings = async (settings: Partial<BusinessSettings>) => {
  const docRef = doc(db, 'settings', 'business');
  await setDoc(docRef, settings, { merge: true });
};

/**
 * Gets the shop hours for a specific date, factoring in blocked ranges, special hours, and weekly schedule.
 */
export const getShopHoursForDate = (
  settings: BusinessSettings, 
  dateStr: string, 
  externalBlockedRanges: BlockedRange[] = []
): { open: string; close: string; closed: boolean; reason?: string } => {
  // 1. Check blocked ranges (Closures)
  // Check both the settings object and external collection for maximum coverage
  const allBlocked = [...(settings.blockedRanges || []), ...externalBlockedRanges];
  const isBlocked = allBlocked.some(range => {
    return dateStr >= range.startDate && dateStr <= range.endDate;
  });
  if (isBlocked) {
    const range = allBlocked.find(r => dateStr >= r.startDate && dateStr <= r.endDate);
    return { open: '00:00', close: '00:00', closed: true, reason: range?.reason || "Closed for Holiday/Maintenance" };
  }

  // 2. Check special hours (Overrides)
  const specialDay = settings.specialHours?.find(sh => sh.date === dateStr);
  if (specialDay) {
    return { 
      open: specialDay.open, 
      close: specialDay.close, 
      closed: specialDay.closed, 
      reason: specialDay.reason || "Special Event" 
    };
  }

  // 3. Check weekly hours
  // Manual parsing of YYYY-MM-DD prevents timezone shifts
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const dayNames: (keyof WeeklyHours)[] = [
    'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'
  ];
  const dayName = dayNames[date.getDay()];
  const hours = settings.weeklyHours[dayName];
  
  if (!hours || hours.closed) {
    return { open: '00:00', close: '00:00', closed: true, reason: "Closed Today" };
  }

  return { open: hours.open, close: hours.close, closed: false };
};

/**
 * Generates 15-minute time slots between open and close times.
 */
export const generateTimeSlots = (openTimeStr: string, closeTimeStr: string) => {
  const slots = [];
  const [openH, openM] = openTimeStr.split(':').map(Number);
  const [closeH, closeM] = closeTimeStr.split(':').map(Number);

  let current = new Date();
  current.setHours(openH, openM, 0, 0); 
  const end = new Date();
  end.setHours(closeH, closeM, 0, 0);

  while (current < end) {
    slots.push(current.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    }));
    current.setMinutes(current.getMinutes() + 15);
  }
  return slots;
};

/**
 * Checks if the shop is currently open based on settings and specific date overrides.
 */
export const isShopOpen = (settings: BusinessSettings, externalBlockedRanges: BlockedRange[] = []): { isOpen: boolean; message: string; nextStatusChange?: string } => {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const hours = getShopHoursForDate(settings, dateStr, externalBlockedRanges);
  
  if (hours.closed) {
    return { isOpen: false, message: hours.reason || "Closed" };
  }

  const [openH, openM] = hours.open.split(':').map(Number);
  const [closeH, closeM] = hours.close.split(':').map(Number);
  const openTime = openH * 60 + openM;
  const closeTime = closeH * 60 + closeM;

  if (currentTime >= openTime && currentTime < closeTime) {
    return { isOpen: true, message: `Open until ${hours.close}` };
  }
  
  if (currentTime < openTime) {
    return { isOpen: false, message: `Opens today at ${hours.open}` };
  }

  return { isOpen: false, message: "Closed for the day" };
};
/**
 * Converts a time string (e.g., "10:00", "02:30 PM", "14:30") to minutes from midnight.
 * High robustness against non-standard whitespace (common in browser time formatting).
 */
export const timeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  
  // Normalize string: Replace any whitespace sequence with a standard space and trim
  const normalized = timeStr.replace(/\s+/g, ' ').trim().toUpperCase();
  
  // Handle "HH:mm AM/PM" or "HH:mmAM/PM"
  if (normalized.includes('AM') || normalized.includes('PM')) {
    let timePart, period;
    
    if (normalized.includes(' ')) {
      [timePart, period] = normalized.split(' ');
    } else {
      // Handle cases like "14:30PM" or "2:00AM"
      timePart = normalized.replace(/[AP]M/, '');
      period = normalized.includes('AM') ? 'AM' : 'PM';
    }
    
    const [hStr, mStr] = timePart.split(':');
    let h = parseInt(hStr);
    const m = parseInt(mStr);
    
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    
    return h * 60 + m;
  }
  
  // Handle "HH:mm" format (24-hour)
  const [h, m] = normalized.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

/**
 * Converts minutes from midnight back to "HH:mm AM/PM" format.
 */
export const minutesToTime = (minutes: number): string => {
  let h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  
  const displayH = h % 12 || 12;
  return `${displayH}:${m.toString().padStart(2, '0')} ${period}`;
};
/**
 * Formats a time string like "10:30" or "18:00" to "12 PM"
 */
export const formatTimeStr = (timeString: string) => {
  const [h, m] = timeString.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return m === 0 ? `${hour} ${period}` : `${hour}:${m.toString().padStart(2, '0')} ${period}`;
};

/**
 * Check if a time slot is available for a service given its duration, 
 * shop hours, existing bookings, and manual blocks.
 */
export const isSlotAvailableForService = (
  slotTimeStr: string,
  serviceDuration: number,
  shopHours: { open: string; close: string; closed: boolean },
  dayBookings: Booking[],
  blockedSlots: BlockedSlot[]
): boolean => {
  if (shopHours.closed) return false;

  const slotStart = timeToMinutes(slotTimeStr);
  const slotEnd = slotStart + Number(serviceDuration);
  const shopOpen = timeToMinutes(shopHours.open);
  const shopClose = timeToMinutes(shopHours.close);

  // 1. Must be within shop hours
  if (slotStart < shopOpen || slotEnd > shopClose) return false;

  // 2. Check for overlaps with existing bookings
  const hasOverlap = dayBookings.some(booking => {
    if (booking.status === 'Cancelled') return false;
    
    const bStart = timeToMinutes(booking.time);
    // Use stored duration, fallback to 30 mins for legacy
    const bDuration = Number(booking.serviceDuration || 30); 
    const bEnd = bStart + bDuration;

    // Overlap condition: (StartA < EndB) && (EndA > StartB)
    return slotStart < bEnd && slotEnd > bStart;
  });

  if (hasOverlap) return false;

  // 3. Check for overlaps with manually blocked slots (assuming they are 15-min blocks)
  const isBlocked = blockedSlots.some(blocked => {
    const blockStart = timeToMinutes(blocked.time);
    const blockEnd = blockStart + 15;
    return slotStart < blockEnd && slotEnd > blockStart;
  });

  return !isBlocked;
};

// --- Audit Logs ---

export const logLogin = async (user: any) => {
  try {
    const { ADMIN_EMAILS } = await import('../config/firebase');
    const role = ADMIN_EMAILS.includes(user.email) ? 'admin' : 'client';
    
    const log: LoginLog = {
      userId: user.uid,
      email: user.email || 'unknown',
      displayName: user.displayName || '',
      timestamp: Date.now(),
      role,
      userAgent: navigator.userAgent
    };
    
    await addDoc(loginLogsCollection, log);
  } catch (err) {
    console.error("Failed to log login:", err);
  }
};

export const getLoginLogs = async (limitCount: number = 200): Promise<LoginLog[]> => {
  try {
    const q = query(loginLogsCollection, orderBy('timestamp', 'desc'), limit(limitCount));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LoginLog));
  } catch (err) {
    console.error("Failed to fetch login logs:", err);
    return [];
  }
};

// --- Website Metrics & Traffic Tracking ---

const getTodayString = () => new Date().toISOString().split('T')[0];

export const trackVisit = async () => {
  try {
    const today = getTodayString();
    const statsRef = doc(db, 'daily_stats', today);
    await setDoc(statsRef, { 
      visits: increment(1),
      date: today
    }, { merge: true });
  } catch (err) {
    console.error("Failed to track visit:", err);
  }
};

export const trackConversion = async () => {
  try {
    const today = getTodayString();
    const statsRef = doc(db, 'daily_stats', today);
    await setDoc(statsRef, { 
      bookings: increment(1),
      date: today
    }, { merge: true });
  } catch (err) {
    console.error("Failed to track conversion:", err);
  }
};

export const getTrafficStats = async (days: number = 30): Promise<DailyStats[]> => {
  try {
    const q = query(dailyStatsCollection, orderBy('date', 'desc'), limit(days));
    const querySnapshot = await getDocs(q);
    const stats = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailyStats));
    // Sort ascending for charts
    return stats.sort((a, b) => a.date.localeCompare(b.date));
  } catch (err) {
    console.error("Failed to fetch traffic stats:", err);
    return [];
  }
};
