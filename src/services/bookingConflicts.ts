import { db } from '../config/firebase';
import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import {
  Booking,
  timeToMinutes,
  BlockedSlot,
  BusinessSettings,
  BlockedRange,
  getShopHoursForDate,
  generateTimeSlots,
} from './api';

const bookingsCollection = collection(db, 'bookings');

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ConflictCheckResult {
  hasConflict: boolean;
  conflictingBooking?: Booking;
  reason?: string;
}

export interface AvailableSlot {
  time: string;
  available: boolean;
  reason?: string;
}

// ─── Core Overlap Detection ──────────────────────────────────────────────────

/**
 * Checks whether two time ranges overlap.
 * Uses the standard interval overlap formula: (StartA < EndB) && (EndA > StartB)
 */
const doTimesOverlap = (
  startA: number,
  durationA: number,
  startB: number,
  durationB: number
): boolean => {
  const endA = startA + durationA;
  const endB = startB + durationB;
  return startA < endB && endA > startB;
};

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Checks if a proposed booking conflicts with any existing active booking
 * for the same barber on the same date. This is provider-agnostic — it works
 * against the unified Firestore data regardless of source (Vagaro, manual, web).
 *
 * @param date       - YYYY-MM-DD
 * @param time       - Time string (e.g. "10:00 AM")
 * @param duration   - Duration in minutes
 * @param barber     - Barber name
 * @param excludeId  - Optional booking ID to exclude (for rescheduling)
 */
export const checkBookingConflict = async (
  date: string,
  time: string,
  duration: number,
  barber: string,
  excludeId?: string
): Promise<ConflictCheckResult> => {
  try {
    // Query all bookings for this date
    const q = query(bookingsCollection, where('date', '==', date));
    const snapshot = await getDocs(q);

    const proposedStart = timeToMinutes(time);
    const proposedDuration = duration || 30; // fallback

    for (const docSnap of snapshot.docs) {
      const booking = { id: docSnap.id, ...docSnap.data() } as Booking;

      // Skip cancelled bookings — they don't block slots
      if (booking.status === 'Cancelled') continue;

      // Skip the booking being rescheduled
      if (excludeId && booking.id === excludeId) continue;

      // Only check same barber (different barbers can overlap)
      if (booking.barber !== barber) continue;

      const existingStart = timeToMinutes(booking.time);
      const existingDuration = booking.serviceDuration || 30;

      if (doTimesOverlap(proposedStart, proposedDuration, existingStart, existingDuration)) {
        return {
          hasConflict: true,
          conflictingBooking: booking,
          reason: `Conflicts with ${booking.customerName || 'existing booking'} at ${booking.time} (${existingDuration} min)`,
        };
      }
    }

    return { hasConflict: false };
  } catch (error) {
    console.error('Error checking booking conflict:', error);
    // On error, allow the booking to prevent blocking the user flow
    // The overlap check is a guard, not a gate
    return { hasConflict: false, reason: 'Conflict check unavailable' };
  }
};

/**
 * Returns all time slots for a given date and barber with availability status.
 * Factors in shop hours, existing bookings (from all sources), and blocked slots.
 */
export const getAvailableSlotsForBarber = async (
  date: string,
  barber: string,
  serviceDuration: number,
  settings: BusinessSettings,
  blockedRanges: BlockedRange[] = [],
  blockedSlots: BlockedSlot[] = []
): Promise<AvailableSlot[]> => {
  try {
    const hours = getShopHoursForDate(settings, date, blockedRanges);

    if (hours.closed) {
      return [];
    }

    // Generate all possible 15-min slots
    const allSlots = generateTimeSlots(hours.open, hours.close);

    // Fetch all bookings for this date and barber
    const q = query(bookingsCollection, where('date', '==', date));
    const snapshot = await getDocs(q);
    const dayBookings = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() } as Booking))
      .filter(b => b.barber === barber && b.status !== 'Cancelled');

    const shopOpen = timeToMinutes(hours.open);
    const shopClose = timeToMinutes(hours.close);

    return allSlots.map(slotTime => {
      const slotStart = timeToMinutes(slotTime);
      const slotEnd = slotStart + serviceDuration;

      // Check shop hours boundary
      if (slotStart < shopOpen || slotEnd > shopClose) {
        return { time: slotTime, available: false, reason: 'Outside shop hours' };
      }

      // Check blocked slots (15-min blocks)
      const isBlocked = blockedSlots.some(blocked => {
        const blockStart = timeToMinutes(blocked.time);
        const blockEnd = blockStart + 15;
        return doTimesOverlap(slotStart, serviceDuration, blockStart, 15);
      });

      if (isBlocked) {
        return { time: slotTime, available: false, reason: 'Manually blocked' };
      }

      // Check existing booking conflicts
      const conflicting = dayBookings.find(booking => {
        const bStart = timeToMinutes(booking.time);
        const bDuration = booking.serviceDuration || 30;
        return doTimesOverlap(slotStart, serviceDuration, bStart, bDuration);
      });

      if (conflicting) {
        return {
          time: slotTime,
          available: false,
          reason: `Booked: ${conflicting.customerName || 'Client'} (${conflicting.source === 'vagaro' ? 'Vagaro' : 'Local'})`,
        };
      }

      return { time: slotTime, available: true };
    });
  } catch (error) {
    console.error('Error getting available slots:', error);
    return [];
  }
};
