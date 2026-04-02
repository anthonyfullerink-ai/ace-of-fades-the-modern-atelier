import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

// API & Types
import { 
  Booking, 
  Client, 
  BusinessSettings, 
  BlockedRange, 
  Service,
  WeeklyHours,
  DayHours,
  getAllBookings, 
  updateBookingStatus, 
  deleteBooking,
  getAllClients, 
  updateClient, 
  deleteClient,
  getBusinessSettings, 
  updateBusinessSettings, 
  getBlockedRanges, 
  removeBlockedRange, 
  getServices,
  addService,
  updateService,
  deleteService,
  getBlockedSlots,
  addBlockedSlot,
  removeBlockedSlot,
  BlockedSlot,
  generateTimeSlots, 
  getShopHoursForDate
} from '../services/api';

// Components
import AdminLayout from './admin/AdminLayout';
import AppointmentsTab from './admin/tabs/AppointmentsTab';
import CalendarTab from './admin/tabs/CalendarTab';
import AvailabilityTab from './admin/tabs/AvailabilityTab';
import ClientsTab from './admin/tabs/ClientsTab';
import ServicesTab from './admin/tabs/ServicesTab';
import SettingsTab from './admin/tabs/SettingsTab';
import KnowledgeTab from './admin/tabs/KnowledgeTab';

// Data
import { BARBERS } from '../data/barbers';

// Modals
import ManualBookingModal from './admin/modals/ManualBookingModal';
import RangeBlockingModal from './admin/modals/RangeBlockingModal';
import EditClientModal from './admin/modals/EditClientModal';
import ConfirmationModal from '../components/ConfirmationModal';

// Services
import { migrateServicesToFirestore } from '../services/migration';
import { isVagaroConfigured, runFullVagaroSync } from '../services/vagaro';

type AdminView = 'list' | 'calendar' | 'availability' | 'clients' | 'services' | 'settings' | 'knowledge';

const WEEKDAY_ORDER: (keyof WeeklyHours)[] = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
];

export default function AdminDashboard() {
  const [activeView, setActiveView] = useState<AdminView>('list');
  const [loading, setLoading] = useState(true);

  // Data State
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null);
  const [blockedRanges, setBlockedRanges] = useState<BlockedRange[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  
  // Tab-specific State
  const [bookingFilter, setBookingFilter] = useState<'Upcoming' | 'Completed' | 'Cancelled' | 'No-Show' | 'All'>('Upcoming');
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingDateFilter, setBookingDateFilter] = useState('');
  const [bookingServiceFilter, setBookingServiceFilter] = useState('All');
  const [bookingBarberFilter, setBookingBarberFilter] = useState('All');
  const [bookingSortOrder, setBookingSortOrder] = useState<'newest' | 'oldest'>('newest');

  const [clientSearch, setClientSearch] = useState('');
  const [clientStatusFilter, setClientStatusFilter] = useState<'All' | 'Active' | 'Suspended'>('All');
  const [clientTypeFilter, setClientTypeFilter] = useState<'All' | 'Registered' | 'Guest'>('All');
  const [clientSortOrder, setClientSortOrder] = useState<'newest' | 'oldest' | 'az' | 'za'>('newest');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availabilityDate, setAvailabilityDate] = useState(new Date().toISOString().split('T')[0]);
  const [adminTimeSlots, setAdminTimeSlots] = useState<string[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [isManagingAvailability, setIsManagingAvailability] = useState(false);

  // Modal State
  const [showManualBooking, setShowManualBooking] = useState(false);
  const [isBlockingRange, setIsBlockingRange] = useState(false);
  const [isEditingClient, setIsEditingClient] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDangerous?: boolean;
  }>({ show: false, title: '', message: '', onConfirm: () => {} });

  // Settings Temp State
  const [newSpecialDate, setNewSpecialDate] = useState('');
  const [newSpecialOpen, setNewSpecialOpen] = useState('09:00');
  const [newSpecialClose, setNewSpecialClose] = useState('18:00');
  const [newSpecialClosed, setNewSpecialClosed] = useState(false);
  const [newSpecialReason, setNewSpecialReason] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isVagaroSyncing, setIsVagaroSyncing] = useState(false);
  
  const bookingsByDate = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    bookings.forEach(b => {
      if (!map[b.date]) map[b.date] = [];
      map[b.date].push(b);
    });
    return map;
  }, [bookings]);

  const fetchData = useCallback(async () => {
    try {
      const [b, c, s, r, sv] = await Promise.all([
        getAllBookings(),
        getAllClients(),
        getBusinessSettings(),
        getBlockedRanges(),
        getServices()
      ]);
      setBookings(b);
      setClients(c);
      setBusinessSettings(s);
      setBlockedRanges(r);
      setServices(sv);

      // Auto-sync Vagaro data in background if configured
      if (isVagaroConfigured()) {
        runFullVagaroSync().then(() => {
          // Silently refresh after Vagaro sync completes
          Promise.all([getAllBookings(), getAllClients()]).then(([nb, nc]) => {
            setBookings(nb);
            setClients(nc);
          });
        }).catch(err => console.warn('Background Vagaro sync skipped:', err));
      }
    } catch (error) {
      toast.error("Failed to sync application data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Availability Management
  useEffect(() => {
    const loadAvailability = async () => {
      if (!businessSettings) return;
      setIsManagingAvailability(true);
      try {
        const hours = getShopHoursForDate(businessSettings, availabilityDate, blockedRanges);
        if (hours.closed) {
          setAdminTimeSlots([]);
        } else {
          setAdminTimeSlots(generateTimeSlots(hours.open, hours.close));
        }
        const slots = await getBlockedSlots(availabilityDate);
        setBlockedSlots(slots);
      } catch (error) {
        console.error("Availability load error", error);
      } finally {
        setIsManagingAvailability(false);
      }
    };
    loadAvailability();
  }, [availabilityDate, businessSettings, blockedRanges]);

  // Stats
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return {
      total: bookings.length,
      today: bookings.filter(b => b.date === today).length,
      upcoming: bookings.filter(b => b.status === 'Upcoming').length,
      completed: bookings.filter(b => b.status === 'Completed').length
    };
  }, [bookings]);

  // Booking Actions
  const handleUpdateStatus = async (id: string, status: Booking['status']) => {
    try {
      await updateBookingStatus(id, status);
      toast.success(`Booking marked as ${status}`);
      fetchData();
    } catch (error) {
      toast.error("Status update failed");
    }
  };

  const handleDeleteBooking = (id: string) => {
    setConfirmModal({
      show: true,
      title: 'Delete Booking',
      message: 'This operation is irreversible. The client will not be notified by default.',
      isDangerous: true,
      onConfirm: async () => {
        try {
          await deleteBooking(id);
          toast.success("Booking purged");
          fetchData();
        } catch (error) {
          toast.error("Deletion failed");
        }
        setConfirmModal(prev => ({ ...prev, show: false }));
      }
    });
  };

  // Client Actions
  const handleSuspendClient = async (client: Client, currentStatus: boolean) => {
    try {
      await updateClient(client.uid, { suspended: !currentStatus });
      toast.success(currentStatus ? "Client reactivated" : "Client suspended");
      fetchData();
    } catch (error) {
      toast.error("Operation failed");
    }
  };

  const handleDeleteClient = (uid: string) => {
    setConfirmModal({
      show: true,
      title: 'Delete Client',
      message: 'This will purge all client records. Active bookings will remain but be unlinked.',
      isDangerous: true,
      onConfirm: async () => {
        try {
          await deleteClient(uid);
          toast.success("Client record deleted");
          fetchData();
        } catch (error) {
          toast.error("Operation failed");
        }
        setConfirmModal(prev => ({ ...prev, show: false }));
      }
    });
  };

  // Settings Actions
  const handleUpdateWeeklyHours = async (day: keyof WeeklyHours, field: keyof DayHours, value: any) => {
    if (!businessSettings) return;
    const updated = {
      ...businessSettings,
      weeklyHours: {
        ...businessSettings.weeklyHours,
        [day]: { ...businessSettings.weeklyHours[day], [field]: value }
      }
    };
    setBusinessSettings(updated);
    try {
      await updateBusinessSettings(updated);
      toast.success(`${day} schedule updated`);
    } catch (error) {
      toast.error("Sync failed");
    }
  };

  const handleAddSpecialHours = async () => {
    if (!businessSettings || !newSpecialDate) return;
    setIsSavingSettings(true);
    const newOverride = {
      id: Date.now().toString(),
      date: newSpecialDate,
      open: newSpecialOpen,
      close: newSpecialClose,
      closed: newSpecialClosed,
      reason: newSpecialReason || 'Ad-hoc Closure'
    };
    const updated = {
      ...businessSettings,
      specialHours: [...(businessSettings.specialHours || []), newOverride]
    };
    try {
      await updateBusinessSettings(updated);
      setBusinessSettings(updated);
      setNewSpecialDate('');
      setNewSpecialReason('');
      toast.success("Date override added");
    } catch (error) {
      toast.error("Failed to add override");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleRemoveSpecialHours = async (id: string) => {
    if (!businessSettings) return;
    const updated = {
      ...businessSettings,
      specialHours: businessSettings.specialHours?.filter(h => h.id !== id) || []
    };
    try {
      await updateBusinessSettings(updated);
      setBusinessSettings(updated);
      toast.success("Override removed");
    } catch (error) {
      toast.error("Failed to remove override");
    }
  };

  const handleDeleteBlockedRange = async (id: string) => {
    try {
      await removeBlockedRange(id);
      toast.success("Range reopened");
      fetchData();
    } catch (error) {
      toast.error("Operation failed");
    }
  };

  // Availability Actions
  const handleToggleSlot = async (time: string) => {
    const existing = blockedSlots.find(s => s.time === time);
    try {
      if (existing) {
        await removeBlockedSlot(existing.id!);
        setBlockedSlots(prev => prev.filter(s => s.id !== existing.id));
      } else {
        const id = await addBlockedSlot({ date: availabilityDate, time });
        setBlockedSlots(prev => [...prev, { id, date: availabilityDate, time }]);
      }
    } catch (error) {
      toast.error("Slot toggle failed");
    }
  };

  const handleBlockFullDay = () => {
    setNewSpecialDate(availabilityDate);
    setNewSpecialClosed(true);
    setNewSpecialReason('Full Day Block');
    setActiveView('settings');
    toast.success("Closing settings opened for selection");
  };

  // Service Actions
  const handleAddService = async (service: Omit<Service, 'id'>) => {
    const id = await addService(service);
    fetchData();
    return { id };
  };

  const handleUpdateService = async (id: string, service: Partial<Service>) => {
    await updateService(id, service);
    fetchData();
  };

  const handleDeleteService = async (id: string) => {
    await deleteService(id);
    fetchData();
  };

  const handleMigrate = async () => {
    return await migrateServicesToFirestore();
  };

  const handleVagaroSync = async () => {
    setIsVagaroSyncing(true);
    try {
      const result = await runFullVagaroSync();
      const totalSynced = result.appointments.synced + result.clients.synced;
      const totalSkipped = result.appointments.skipped + result.clients.skipped;
      if (totalSynced > 0) {
        toast.success(`Vagaro sync: ${totalSynced} new records imported`);
      } else if (totalSkipped > 0) {
        toast.success(`Vagaro sync: All records up to date`);
      } else {
        toast.success('Vagaro sync complete — no new data');
      }
      await fetchData();
    } catch (error) {
      toast.error('Vagaro sync failed. Check console for details.');
      console.error('Vagaro sync error:', error);
    } finally {
      setIsVagaroSyncing(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-6">
      <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <div className="font-headline uppercase tracking-[0.4em] text-xs text-primary animate-pulse">Initializing Dashboard</div>
    </div>
  );

  return (
    <AdminLayout
      activeView={activeView}
      setActiveView={setActiveView}
      onAddBooking={() => setShowManualBooking(true)}
      onSyncData={fetchData}
      onVagaroSync={isVagaroConfigured() ? handleVagaroSync : undefined}
      isVagaroSyncing={isVagaroSyncing}
      stats={stats}
    >
      <AnimatePresence mode="wait">
        {activeView === 'list' && (
          <AppointmentsTab 
            key="list"
            bookings={bookings}
            loading={loading}
            searchTerm={bookingSearch}
            setSearchTerm={setBookingSearch}
            statusFilter={bookingFilter}
            setStatusFilter={setBookingFilter}
            dateFilter={bookingDateFilter}
            setDateFilter={setBookingDateFilter}
            serviceFilter={bookingServiceFilter}
            setServiceFilter={setBookingServiceFilter}
            barberFilter={bookingBarberFilter}
            setBarberFilter={setBookingBarberFilter}
            sortOrder={bookingSortOrder}
            setSortOrder={setBookingSortOrder}
            services={services}
            barbers={BARBERS}
            onStatusUpdate={handleUpdateStatus}
            onDeleteBooking={handleDeleteBooking}
          />
        )}

        {activeView === 'calendar' && (
          <CalendarTab 
            key="calendar"
            currentMonth={currentMonth}
            onPrevMonth={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
            onNextMonth={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
            bookingsByDate={bookingsByDate}
            onDateSelect={(date) => {
              setBookingDateFilter(date);
              setBookingFilter('All');
              setActiveView('list');
            }}
          />
        )}

        {activeView === 'availability' && (
          <AvailabilityTab 
            key="availability"
            availabilityDate={availabilityDate}
            setAvailabilityDate={setAvailabilityDate}
            isManaging={isManagingAvailability}
            adminTimeSlots={adminTimeSlots}
            blockedSlots={blockedSlots}
            bookings={bookings}
            onToggleSlot={handleToggleSlot}
            onBlockFullDay={handleBlockFullDay}
          />
        )}

        {activeView === 'clients' && (
          <ClientsTab 
            key="clients"
            clients={clients}
            bookings={bookings}
            services={services}
            clientSearch={clientSearch}
            setClientSearch={setClientSearch}
            clientStatusFilter={clientStatusFilter}
            setClientStatusFilter={setClientStatusFilter}
            clientTypeFilter={clientTypeFilter}
            setClientTypeFilter={setClientTypeFilter}
            clientSortOrder={clientSortOrder}
            setClientSortOrder={setClientSortOrder}
            onSuspendClient={handleSuspendClient}
            onDeleteClient={handleDeleteClient}
          />
        )}

        {activeView === 'services' && (
          <ServicesTab 
            key="services"
            services={services}
            onAddService={handleAddService}
            onUpdateService={handleUpdateService}
            onDeleteService={handleDeleteService}
            onMigrate={handleMigrate}
          />
        )}

        {activeView === 'settings' && (
          <SettingsTab 
            key="settings"
            businessSettings={businessSettings}
            onUpdateWeeklyHours={handleUpdateWeeklyHours}
            newSpecialDate={newSpecialDate}
            setNewSpecialDate={setNewSpecialDate}
            newSpecialOpen={newSpecialOpen}
            setNewSpecialOpen={setNewSpecialOpen}
            newSpecialClose={newSpecialClose}
            setNewSpecialClose={setNewSpecialClose}
            newSpecialClosed={newSpecialClosed}
            setNewSpecialClosed={setNewSpecialClosed}
            newSpecialReason={newSpecialReason}
            setNewSpecialReason={setNewSpecialReason}
            onAddSpecialHours={handleAddSpecialHours}
            onRemoveSpecialHours={handleRemoveSpecialHours}
            blockedRanges={blockedRanges}
            onDeleteBlockedRange={handleDeleteBlockedRange}
            isSaving={isSavingSettings}
            WEEKDAY_ORDER={WEEKDAY_ORDER}
          />
        )}

        {activeView === 'knowledge' && (
          <KnowledgeTab key="knowledge" />
        )}
      </AnimatePresence>

      {/* Modals */}
      {showManualBooking && businessSettings && (
        <ManualBookingModal 
          onClose={() => setShowManualBooking(false)} 
          onSuccess={() => { fetchData(); setShowManualBooking(false); }} 
          businessSettings={businessSettings}
          blockedRanges={blockedRanges}
          clients={clients}
          services={services}
        />
      )}

      {isBlockingRange && (
        <RangeBlockingModal 
          onClose={() => setIsBlockingRange(false)} 
          onSuccess={() => { fetchData(); setIsBlockingRange(false); }} 
        />
      )}

      {isEditingClient && selectedClient && (
        <EditClientModal 
          client={selectedClient} 
          onClose={() => { setIsEditingClient(false); setSelectedClient(null); }} 
          onSuccess={() => { fetchData(); setIsEditingClient(false); setSelectedClient(null); }} 
        />
      )}

      <ConfirmationModal 
        show={confirmModal.show}
        title={confirmModal.title}
        message={confirmModal.message}
        isDangerous={confirmModal.isDangerous}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, show: false }))}
      />
    </AdminLayout>
  );
}
