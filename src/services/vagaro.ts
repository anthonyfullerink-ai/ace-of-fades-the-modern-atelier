/**
 * Vagaro API Integration Service
 * 
 * This module handles all communication with the Vagaro booking platform.
 * It maps Vagaro data structures to the local Booking/Client interfaces and
 * syncs records into Firestore to maintain a unified data layer.
 * 
 * SETUP:
 * 1. Set VITE_VAGARO_API_KEY in .env.local
 * 2. Set VITE_VAGARO_BUSINESS_ID in .env.local
 * 3. The sync will activate automatically on next dashboard load
 * 
 * NOTE: In production, API calls should be routed through a serverless proxy
 * (Firebase Cloud Function / Netlify Function) to protect the API key.
 * The fetch functions below are structured for easy migration to that pattern.
 */

import { db } from '../config/firebase';
import {
  collection,
  getDocs,
  setDoc,
  doc,
  query,
  where,
} from 'firebase/firestore';
import { Booking, Client } from './api';

// ─── Configuration ───────────────────────────────────────────────────────────

interface VagaroConfig {
  apiKey: string;
  businessId: string;
  baseUrl: string;
}

const getVagaroConfig = (): VagaroConfig | null => {
  const apiKey = import.meta.env.VITE_VAGARO_API_KEY;
  const businessId = import.meta.env.VITE_VAGARO_BUSINESS_ID;

  if (!apiKey || !businessId) {
    return null;
  }

  return {
    apiKey,
    businessId,
    // Vagaro API base — will be confirmed when API access is granted
    baseUrl: `https://api.vagaro.com/v1/businesses/${businessId}`,
  };
};

/**
 * Returns true if Vagaro API credentials are configured.
 * Used to conditionally show sync UI and enable auto-sync.
 */
export const isVagaroConfigured = (): boolean => {
  return getVagaroConfig() !== null;
};

// ─── Vagaro Data Types ───────────────────────────────────────────────────────

/** Raw appointment shape from Vagaro API */
export interface VagaroAppointment {
  id: string;
  customerId: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail?: string;
  customerPhone?: string;
  serviceId: string;
  serviceName: string;
  serviceDuration: number; // minutes
  employeeId: string;
  employeeName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm (24h)
  status: string; // "Booked", "Completed", "Cancelled", "No-Show"
  createdAt?: string; // ISO timestamp
}

/** Raw client shape from Vagaro API */
export interface VagaroClient {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  createdAt?: string; // ISO timestamp
  lastVisit?: string; // ISO timestamp
}

// ─── Data Mappers ────────────────────────────────────────────────────────────

/**
 * Maps a Vagaro status string to local status enum.
 */
const mapVagaroStatus = (vagaroStatus: string): Booking['status'] => {
  const statusMap: Record<string, Booking['status']> = {
    'Booked': 'Upcoming',
    'Confirmed': 'Upcoming',
    'CheckedIn': 'Upcoming',
    'Completed': 'Completed',
    'Cancelled': 'Cancelled',
    'No-Show': 'No-Show',
    'NoShow': 'No-Show',
  };
  return statusMap[vagaroStatus] || 'Upcoming';
};

/**
 * Converts 24h time string "HH:mm" to 12h "hh:mm AM/PM" format
 * to match the local booking time format.
 */
const to12HourTime = (time24: string): string => {
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${period}`;
};

/**
 * Maps a Vagaro appointment to the local Booking interface.
 */
export const mapVagaroBookingToLocal = (apt: VagaroAppointment): Booking => {
  return {
    userId: `vagaro-${apt.customerId}`,
    customerName: `${apt.customerFirstName} ${apt.customerLastName}`.trim(),
    customerEmail: apt.customerEmail || '',
    serviceId: `vagaro-svc-${apt.serviceId}`,
    serviceDuration: apt.serviceDuration,
    date: apt.date,
    time: to12HourTime(apt.startTime),
    status: mapVagaroStatus(apt.status),
    barber: apt.employeeName || 'Mo The Barber',
    createdAt: apt.createdAt ? new Date(apt.createdAt).getTime() : Date.now(),
    source: 'vagaro',
    externalId: apt.id,
  };
};

/**
 * Maps a Vagaro client to the local Client interface.
 */
export const mapVagaroClientToLocal = (client: VagaroClient): Client => {
  return {
    uid: `vagaro-${client.id}`,
    displayName: `${client.firstName} ${client.lastName}`.trim(),
    email: client.email || '',
    phoneNumber: client.phone,
    createdAt: client.createdAt ? new Date(client.createdAt).getTime() : Date.now(),
    lastLogin: client.lastVisit ? new Date(client.lastVisit).getTime() : undefined,
    isGuest: false,
    source: 'vagaro',
    externalId: client.id,
  };
};

// ─── API Fetch Functions ─────────────────────────────────────────────────────
// These are structured for easy migration to a serverless proxy.
// For now they make direct calls when configured.

/**
 * Fetches appointments from Vagaro for a given date range.
 * Returns empty array if Vagaro is not configured.
 */
export const fetchVagaroAppointments = async (
  startDate?: string,
  endDate?: string
): Promise<VagaroAppointment[]> => {
  const config = getVagaroConfig();
  if (!config) return [];

  try {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await fetch(
      `${config.baseUrl}/appointments?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error(`Vagaro API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    return data.appointments || data.data || [];
  } catch (error) {
    console.error('Failed to fetch Vagaro appointments:', error);
    return [];
  }
};

/**
 * Fetches the client list from Vagaro.
 * Returns empty array if Vagaro is not configured.
 */
export const fetchVagaroClients = async (): Promise<VagaroClient[]> => {
  const config = getVagaroConfig();
  if (!config) return [];

  try {
    const response = await fetch(
      `${config.baseUrl}/customers`,
      {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error(`Vagaro API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    return data.customers || data.data || [];
  } catch (error) {
    console.error('Failed to fetch Vagaro clients:', error);
    return [];
  }
};

// ─── Sync Functions ──────────────────────────────────────────────────────────

const bookingsCollection = collection(db, 'bookings');
const usersCollection = collection(db, 'users');

/**
 * Pulls appointments from Vagaro and writes them to Firestore.
 * Uses the `externalId` field to prevent duplicate imports.
 * 
 * @returns Object with counts of synced/skipped/failed records
 */
export const syncVagaroAppointments = async (
  startDate?: string,
  endDate?: string
): Promise<{ synced: number; skipped: number; failed: number }> => {
  if (!isVagaroConfigured()) {
    return { synced: 0, skipped: 0, failed: 0 };
  }

  const result = { synced: 0, skipped: 0, failed: 0 };

  try {
    const vagaroAppointments = await fetchVagaroAppointments(startDate, endDate);

    if (vagaroAppointments.length === 0) {
      return result;
    }

    // Fetch existing Vagaro bookings to check for duplicates
    const existingQuery = query(bookingsCollection, where('source', '==', 'vagaro'));
    const existingSnapshot = await getDocs(existingQuery);
    const existingExternalIds = new Set(
      existingSnapshot.docs
        .map(d => (d.data() as any).externalId)
        .filter(Boolean)
    );

    for (const apt of vagaroAppointments) {
      try {
        // Skip if already imported
        if (existingExternalIds.has(apt.id)) {
          result.skipped++;
          continue;
        }

        const localBooking = mapVagaroBookingToLocal(apt);

        // Use a deterministic doc ID based on Vagaro ID for idempotency
        const docId = `vagaro-${apt.id}`;
        const bookingRef = doc(db, 'bookings', docId);
        await setDoc(bookingRef, {
          ...localBooking,
          createdAt: localBooking.createdAt || Date.now(),
        });

        result.synced++;
      } catch (error) {
        console.error(`Failed to sync Vagaro appointment ${apt.id}:`, error);
        result.failed++;
      }
    }
  } catch (error) {
    console.error('Vagaro appointment sync failed:', error);
  }

  return result;
};

/**
 * Pulls clients from Vagaro and merges them into the Firestore users collection.
 * Uses the `externalId` field to prevent duplicate imports.
 * 
 * @returns Object with counts of synced/skipped/failed records
 */
export const syncVagaroClients = async (): Promise<{
  synced: number;
  skipped: number;
  failed: number;
}> => {
  if (!isVagaroConfigured()) {
    return { synced: 0, skipped: 0, failed: 0 };
  }

  const result = { synced: 0, skipped: 0, failed: 0 };

  try {
    const vagaroClients = await fetchVagaroClients();

    if (vagaroClients.length === 0) {
      return result;
    }

    // Fetch existing Vagaro clients to check for duplicates
    const existingQuery = query(usersCollection, where('source', '==', 'vagaro'));
    const existingSnapshot = await getDocs(existingQuery);
    const existingExternalIds = new Set(
      existingSnapshot.docs
        .map(d => (d.data() as any).externalId)
        .filter(Boolean)
    );

    for (const client of vagaroClients) {
      try {
        // Skip if already imported
        if (existingExternalIds.has(client.id)) {
          result.skipped++;
          continue;
        }

        const localClient = mapVagaroClientToLocal(client);

        // Use a deterministic doc ID based on Vagaro client ID
        const docId = `vagaro-${client.id}`;
        const userRef = doc(db, 'users', docId);
        await setDoc(userRef, localClient, { merge: true });

        result.synced++;
      } catch (error) {
        console.error(`Failed to sync Vagaro client ${client.id}:`, error);
        result.failed++;
      }
    }
  } catch (error) {
    console.error('Vagaro client sync failed:', error);
  }

  return result;
};

/**
 * Runs a full sync of both appointments and clients from Vagaro.
 * This is the main entry point called from the Admin Dashboard.
 */
export const runFullVagaroSync = async (): Promise<{
  appointments: { synced: number; skipped: number; failed: number };
  clients: { synced: number; skipped: number; failed: number };
}> => {
  // Sync last 90 days of appointments by default
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const [appointments, clients] = await Promise.all([
    syncVagaroAppointments(startDate, endDate),
    syncVagaroClients(),
  ]);

  return { appointments, clients };
};
