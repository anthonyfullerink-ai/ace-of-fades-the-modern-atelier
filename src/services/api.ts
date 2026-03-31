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
  orderBy
} from 'firebase/firestore';

export interface Booking {
  id?: string;
  userId: string;
  customerName?: string;
  customerEmail?: string;
  serviceId: string;
  date: string;
  time: string;
  status: 'Upcoming' | 'Completed' | 'Cancelled' | 'No-Show';
  barber: string;
  createdAt: number;
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
}

const withTimeout = <T>(promise: Promise<T>, timeoutMs = 10000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error("Request timed out. Please check your internet connection or database status.")), timeoutMs)
    )
  ]);
};

export const createBooking = async (bookingData: Omit<Booking, 'id' | 'createdAt'>) => {
  try {
    return await withTimeout(addDoc(bookingsCollection, {
      ...bookingData,
      createdAt: Date.now()
    }));
  } catch (error) {
    console.error("Error creating booking: ", error);
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
        const fallbackSnapshot = await withTimeout(getDocs(fallbackQ), 5000);
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
    const q = query(bookingsCollection, orderBy("date", "desc"), orderBy("time", "desc"));
    const querySnapshot = await withTimeout(getDocs(q));
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Booking));
  } catch (error) {
    console.error("Error getting all bookings:", error);
    // Fallback if index isn't ready or other error
    const querySnapshot = await withTimeout(getDocs(bookingsCollection));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Booking)).sort((a,b) => b.createdAt - a.createdAt);
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
          // Count total no-shows for this user
          const noShowQuery = query(bookingsCollection, where('userId', '==', userId), where('status', '==', 'No-Show'));
          const noShowSnap = await getDocs(noShowQuery);
          const noShowCount = noShowSnap.size;

          const userRef = doc(db, 'users', userId);
          await setDoc(userRef, { noShowCount }, { merge: true });

          if (noShowCount >= 2) {
            await setDoc(userRef, { suspended: true }, { merge: true });
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

export const getBlockedSlots = async (date?: string): Promise<BlockedSlot[]> => {
  try {
    let q = query(blockedSlotsCollection);
    if (date) {
      q = query(blockedSlotsCollection, where("date", "==", date));
    }
    const querySnapshot = await getDocs(q);
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
    return await addDoc(blockedSlotsCollection, slot);
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
    return await addDoc(blockedRangesCollection, range);
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

    // 2. Fetch all bookings to find guest contacts not yet in user docs
    const bookingsSnapshot = await withTimeout(getDocs(bookingsCollection));
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
