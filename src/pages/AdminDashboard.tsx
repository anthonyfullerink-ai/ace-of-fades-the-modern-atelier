import { useState, useEffect, useMemo, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  Clock, 
  User, 
  CheckCircle, 
  XSquare, 
  AlertCircle, 
  Search, 
  Filter,
  BarChart3,
  Users,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LayoutList,
  Trash2,
  ShieldOff,
  ShieldCheck,
  Ban,
  ArrowUpDown,
  Scissors,
  X,
  Settings,
  Plus
} from 'lucide-react';
import ConfirmationModal from '../components/ConfirmationModal';
import { 
  getAllBookings, 
  getBookingsByDate, 
  updateBookingStatus, 
  deleteBooking, 
  getAllClients, 
  updateClient, 
  deleteClient, 
  suspendClient, 
  Client, 
  getBusinessSettings, 
  updateBusinessSettings, 
  BusinessSettings, 
  Booking, 
  WeeklyHours, 
  DayHours, 
  SpecialHours, 
  getShopHoursForDate, 
  generateTimeSlots, 
  createBooking,
  isSlotAvailableForService,
  getBlockedSlots,
  timeToMinutes,
  BlockedRange,
  BlockedSlot,
  addBlockedSlot,
  removeBlockedSlot,
  getBlockedRanges,
  addBlockedRange,
  removeBlockedRange,
  WEEKDAY_ORDER,
  formatTimeStr
} from '../services/api';

import { SERVICES } from '../data/services';
import { BARBERS } from '../data/barbers';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [dateFilter, setDateFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState<string>('All');
  const [barberFilter, setBarberFilter] = useState<string>('All');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [view, setView] = useState<'list' | 'calendar' | 'availability' | 'clients' | 'settings'>('list');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Availability State
  const [availabilityDate, setAvailabilityDate] = useState(new Date().toISOString().split('T')[0]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [isManaging, setIsManaging] = useState(false);
  const [showManualBooking, setShowManualBooking] = useState(false);
  const [isBlockingRange, setIsBlockingRange] = useState(false);
  const [blockedRanges, setBlockedRanges] = useState<BlockedRange[]>([]);
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDangerous?: boolean;
  }>({ show: false, title: '', message: '', onConfirm: () => {} });

  // Clients State
  const [clients, setClients] = useState<Client[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [clientStatusFilter, setClientStatusFilter] = useState<'All' | 'Active' | 'Suspended'>('All');
  const [clientTypeFilter, setClientTypeFilter] = useState<'All' | 'Registered' | 'Guest'>('All');
  const [clientSortOrder, setClientSortOrder] = useState<'newest' | 'oldest' | 'az' | 'za'>('newest');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isEditingClient, setIsEditingClient] = useState(false);
  
  // Business Settings State
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [newSpecialDate, setNewSpecialDate] = useState('');
  const [newSpecialOpen, setNewSpecialOpen] = useState('09:00');
  const [newSpecialClose, setNewSpecialClose] = useState('18:00');
  const [newSpecialClosed, setNewSpecialClosed] = useState(false);
  const [newSpecialReason, setNewSpecialReason] = useState('');

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const data = await getAllBookings();
      setBookings(data);
    } catch (error) {
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  const fetchBlockedRanges = async () => {
    try {
      const data = await getBlockedRanges();
      setBlockedRanges(data);
    } catch (error) {
      console.error("Error fetching ranges:", error);
    }
  };

  const fetchSettings = async () => {
    try {
      const data = await getBusinessSettings();
      setBusinessSettings(data);
    } catch (error) {
      toast.error("Failed to load business settings");
    }
  };

  const fetchClients = async () => {
    try {
      const data = await getAllClients();
      setClients(data);
    } catch (error) {
      console.error("Failed to load clients");
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchBlockedRanges();
    fetchSettings();
    fetchClients();
  }, []);

  const handleUpdateWeeklyHours = async (day: keyof WeeklyHours, field: keyof DayHours, value: any) => {
    if (!businessSettings) return;
    
    const updatedSettings = {
      ...businessSettings,
      weeklyHours: {
        ...businessSettings.weeklyHours,
        [day]: {
          ...businessSettings.weeklyHours[day],
          [field]: value
        }
      }
    };
    
    setBusinessSettings(updatedSettings);
    try {
      await updateBusinessSettings(updatedSettings);
      toast.success(`${day.charAt(0).toUpperCase() + day.slice(1)} hours updated`);
    } catch (error) {
      toast.error("Failed to update hours");
    }
  };

  const handleAddSpecialHours = async () => {
    if (!businessSettings || !newSpecialDate) return;
    
    const newSpecial: SpecialHours = {
      id: Date.now().toString(),
      date: newSpecialDate,
      open: newSpecialOpen,
      close: newSpecialClose,
      closed: newSpecialClosed,
      reason: newSpecialReason
    };
    
    const updatedSettings = {
      ...businessSettings,
      specialHours: [...(businessSettings.specialHours || []), newSpecial]
    };
    
    setIsSavingSettings(true);
    try {
      await updateBusinessSettings(updatedSettings);
      setBusinessSettings(updatedSettings);
      setNewSpecialDate('');
      setNewSpecialReason('');
      toast.success("Special hours added");
    } catch (error) {
      toast.error("Failed to add special hours");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleRemoveSpecialHours = async (id: string) => {
    if (!businessSettings) return;
    
    const updatedSettings = {
      ...businessSettings,
      specialHours: businessSettings.specialHours?.filter(s => s.id !== id) || []
    };
    
    try {
      await updateBusinessSettings(updatedSettings);
      setBusinessSettings(updatedSettings);
      toast.success("Special hours removed");
    } catch (error) {
      toast.error("Failed to remove special hours");
    }
  };

  const handleDeleteBlockedRange = async (id: string) => {
    setConfirmModal({
      show: true,
      title: 'Delete Shop Closure',
      message: 'Are you sure you want to remove this shop closure? This will reopen the dates for booking.',
      isDangerous: true,
      onConfirm: async () => {
        try {
          await removeBlockedRange(id);
          setBlockedRanges(prev => prev.filter(r => r.id !== id));
          toast.success("Closure removed");
        } catch (error) {
          toast.error("Failed to remove closure");
        }
        setConfirmModal(prev => ({ ...prev, show: false }));
      }
    });
  };

  const fetchBlocked = async (date: string) => {
    setIsManaging(true);
    try {
      const data = await getBlockedSlots(date);
      setBlockedSlots(data);
    } catch (error) {
      toast.error("Failed to load blocked slots");
    } finally {
      setIsManaging(false);
    }
  };

  useEffect(() => {
    if (view === 'availability') {
      fetchBlocked(availabilityDate);
    }
  }, [view, availabilityDate]);

  const handleToggleSlot = async (time: string) => {
    const existing = blockedSlots.find(s => s.time === time);
    try {
      if (existing) {
        await removeBlockedSlot(existing.id!);
        setBlockedSlots(prev => prev.filter(s => s.id !== existing.id));
        toast.success("Slot opened");
      } else {
        const newSlot = { date: availabilityDate, time };
        const docRef = await addBlockedSlot(newSlot);
        setBlockedSlots(prev => [...prev, { ...newSlot, id: docRef.id }]);
        toast.success("Slot blocked");
      }
    } catch (error) {
      toast.error("Operation failed");
    }
  };

  const handleBlockFullDay = async () => {
    const confirm = window.confirm("Are you sure you want to block the ENTIRE day? Existing bookings will be kept but no new ones can be made.");
    if (!confirm) return;

    try {
      await addBlockedRange({
        startDate: availabilityDate,
        endDate: availabilityDate,
        reason: 'Staff Holiday / Full Day Closure'
      });
      fetchBlockedRanges();
      toast.success("Day blocked");
    } catch (error) {
      toast.error("Failed to block day");
    }
  };

  const adminTimeSlots = useMemo(() => {
    if (!businessSettings) return [];
    
    const hours = getShopHoursForDate(businessSettings, availabilityDate, blockedRanges);
    if (hours.closed) return [];
    
    return generateTimeSlots(hours.open, hours.close);
  }, [availabilityDate, businessSettings, blockedRanges]);


  const handleStatusUpdate = async (id: string, status: Booking['status']) => {
    try {
      await updateBookingStatus(id, status);
      if (status === 'No-Show') {
        toast.success('Marked as No-Show. No-show count updated.');
      } else {
        toast.success(`Updated to ${status}`);
      }
      fetchBookings();
      fetchClients();
    } catch (error) {
      console.error('Status update error:', error);
      toast.error("Failed to update status");
    }
  };

  const handleDeleteBooking = async (id: string) => {
    setConfirmModal({
      show: true,
      title: 'Delete Appointment',
      message: 'Are you sure you want to permanently delete this appointment record? This action cannot be undone.',
      isDangerous: true,
      onConfirm: async () => {
        try {
          await deleteBooking(id);
          toast.success("Appointment record deleted");
          fetchBookings();
        } catch (error) {
          toast.error("Failed to delete record");
        } finally {
          setConfirmModal(prev => ({ ...prev, show: false }));
        }
      }
    });
  };

  const handleDeleteClient = async (uid: string) => {
    setConfirmModal({
      show: true,
      title: 'Delete Client',
      message: 'Are you sure you want to permanently delete this client? This will remove all their data and cannot be undone.',
      isDangerous: true,
      onConfirm: async () => {
        try {
          await deleteClient(uid);
          toast.success("Client deleted successfully");
          fetchClients();
        } catch (error) {
          toast.error("Failed to delete client");
        } finally {
          setConfirmModal(prev => ({ ...prev, show: false }));
        }
      }
    });
  };

  const handleSuspendClient = async (client: Client, currentlySuspended: boolean) => {
    const action = currentlySuspended ? 'unsuspend' : 'suspend';
    try {
      await suspendClient(client.uid, !currentlySuspended, {
        email: client.email,
        displayName: client.displayName
      });
      toast.success(`Client ${action}ed`);
      fetchClients();
    } catch (error) {
      console.error('Suspend client error:', error);
      toast.error(`Failed to ${action} client`);
    }
  };

  const filteredBookings = useMemo(() => {
    const filtered = bookings.filter(b => {
      const matchesSearch = 
        (b.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
         b.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         b.serviceId.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'All' || b.status === statusFilter;
      const matchesDate = !dateFilter || b.date === dateFilter;
      const matchesService = serviceFilter === 'All' || b.serviceId === serviceFilter;
      const matchesBarber = barberFilter === 'All' || b.barber === barberFilter;

      return matchesSearch && matchesStatus && matchesDate && matchesService && matchesBarber;
    });

    // Sort
    filtered.sort((a, b) => {
      if (sortOrder === 'newest') {
        return b.createdAt - a.createdAt;
      } else {
        return a.createdAt - b.createdAt;
      }
    });

    return filtered;
  }, [bookings, searchTerm, statusFilter, dateFilter, serviceFilter, barberFilter, sortOrder]);

  const hasActiveFilters = searchTerm || statusFilter !== 'All' || dateFilter || serviceFilter !== 'All' || barberFilter !== 'All' || sortOrder !== 'newest';

  const clearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setDateFilter('');
    setServiceFilter('All');
    setBarberFilter('All');
    setSortOrder('newest');
  };

  const filteredClients = useMemo(() => {
    const filtered = clients.filter(c => {
      const matchesSearch = 
        c.displayName.toLowerCase().includes(clientSearch.toLowerCase()) ||
        c.email.toLowerCase().includes(clientSearch.toLowerCase()) ||
        c.phoneNumber?.includes(clientSearch);
      
      const matchesStatus = 
        clientStatusFilter === 'All' ||
        (clientStatusFilter === 'Suspended' && c.suspended) ||
        (clientStatusFilter === 'Active' && !c.suspended);

      const matchesType =
        clientTypeFilter === 'All' ||
        (clientTypeFilter === 'Guest' && c.isGuest) ||
        (clientTypeFilter === 'Registered' && !c.isGuest);

      return matchesSearch && matchesStatus && matchesType;
    });

    filtered.sort((a, b) => {
      switch (clientSortOrder) {
        case 'newest': return (b.createdAt || 0) - (a.createdAt || 0);
        case 'oldest': return (a.createdAt || 0) - (b.createdAt || 0);
        case 'az': return a.displayName.localeCompare(b.displayName);
        case 'za': return b.displayName.localeCompare(a.displayName);
        default: return 0;
      }
    });

    return filtered;
  }, [clients, clientSearch, clientStatusFilter, clientTypeFilter, clientSortOrder]);

  const hasActiveClientFilters = clientSearch || clientStatusFilter !== 'All' || clientTypeFilter !== 'All' || clientSortOrder !== 'newest';

  const clearAllClientFilters = () => {
    setClientSearch('');
    setClientStatusFilter('All');
    setClientTypeFilter('All');
    setClientSortOrder('newest');
  };

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayBookings = bookings.filter(b => b.date === today);
    
    return {
      total: bookings.length,
      today: todayBookings.length,
      upcoming: bookings.filter(b => b.status === 'Upcoming').length,
      completed: bookings.filter(b => b.status === 'Completed').length
    };
  }, [bookings]);

  const getServiceLabel = (id: string) => {
    return SERVICES.find(s => s.id === id)?.name || 'Custom Service';
  };

  const getStatusColor = (status: Booking['status']) => {
    switch(status) {
      case 'Upcoming': return 'text-primary border-primary bg-primary/5';
      case 'Completed': return 'text-green-500 border-green-500 bg-green-500/5';
      case 'Cancelled': return 'text-red-500 border-red-500 bg-red-500/5';
      case 'No-Show': return 'text-yellow-500 border-yellow-500 bg-yellow-500/5';
      default: return 'text-outline border-outline bg-surface-container-highest';
    }
  };

  // Calendar Logic
  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
  
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days = [];
    const startPadding = firstDay.getDay();
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    
    for (let i = startPadding - 1; i >= 0; i--) {
      days.push({ day: prevMonthLastDay - i, currentMonth: false, dateStr: null });
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ day: i, currentMonth: true, dateStr });
    }
    
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, currentMonth: false, dateStr: null });
    }
    
    return days;
  }, [currentMonth]);

  const bookingsByDate = useMemo(() => {
    const grouped: Record<string, Booking[]> = {};
    bookings.filter(b => b.status === 'Upcoming' || b.status === 'Completed').forEach(b => {
      if (!grouped[b.date]) grouped[b.date] = [];
      grouped[b.date].push(b);
    });
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => a.time.localeCompare(b.time));
    });
    return grouped;
  }, [bookings]);

  return (
    <main className="pt-32 pb-24 px-4 md:px-8 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 mb-16">
        <div>
          <h1 className="font-headline text-5xl md:text-7xl font-bold tracking-tighter text-primary uppercase leading-none mb-3">
            Admin Portal
          </h1>
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
            <p className="text-on-surface-variant font-headline uppercase text-[10px] tracking-[0.2em] font-bold">Studio Operations Center</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
          {/* Main Navigation Tab Switcher */}
          <div className="flex bg-surface-container-lowest p-1.5 border border-outline-variant/10 shadow-2xl rounded-none w-full md:w-auto justify-between md:justify-start">
            {[
              { id: 'list', icon: LayoutList, title: 'Appointments' },
              { id: 'calendar', icon: CalendarDays, title: 'Calendar' },
              { id: 'availability', icon: Clock, title: 'Availability' },
              { id: 'clients', icon: Users, title: 'Clients' },
              { id: 'settings', icon: Settings, title: 'Settings' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setView(tab.id as any)}
                className={`p-3 transition-all relative group ${view === tab.id ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
                title={tab.title}
              >
                <tab.icon size={20} strokeWidth={view === tab.id ? 2.5 : 2} />
                {view === tab.id && (
                  <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-[0_0_10px_#f2ca50]" />
                )}
              </button>
            ))}
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <button 
              onClick={() => setShowManualBooking(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-4 gold-gradient text-on-primary font-headline uppercase text-[11px] font-bold tracking-[0.2em] hover:brightness-110 active:scale-[0.98] transition-all shadow-xl"
            >
              <Plus size={16} /> Add Booking
            </button>
            <button 
              onClick={fetchBookings}
              className="md:flex-none flex items-center justify-center p-4 border border-outline-variant/20 text-on-surface-variant hover:text-primary hover:border-primary transition-all bg-surface-container/30"
              title="Sync Data"
            >
              <ArrowUpDown size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {[
          { label: 'Total Volume', value: stats.total, icon: BarChart3 },
          { label: "Today's Schedule", value: stats.today, icon: CalendarDays },
          { label: 'Upcoming', value: stats.upcoming, icon: Clock },
          { label: 'Completed', value: stats.completed, icon: Users },
        ].map((stat, i) => (
          <div key={i} className="bg-surface-container p-6 border border-outline-variant/10">
            <stat.icon className="text-primary mb-4" size={20} />
            <p className="text-[10px] uppercase tracking-widest text-outline mb-1">{stat.label}</p>
            <h3 className="font-headline text-3xl font-bold">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Main Content View */}
      <AnimatePresence mode="wait">
        {view === 'list' ? (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="bg-surface-container p-6 border border-outline-variant/10 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="md:col-span-2 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-50" size={18} />
                    <input 
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant/30 text-on-surface p-4 pl-12 focus:border-primary focus:outline-none transition-colors"
                    />
                </div>
                <div className="relative">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-50" size={18} />
                    <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full appearance-none bg-surface-container-lowest border border-outline-variant/30 text-on-surface p-4 pl-12 focus:border-primary focus:outline-none transition-colors"
                    >
                    <option value="All">All Statuses</option>
                    <option value="Upcoming">Upcoming</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="No-Show">No-Show</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-50 pointer-events-none" size={16} />
                </div>
                <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-50" size={18} />
                    <input 
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant/30 text-on-surface p-4 pl-12 focus:border-primary focus:outline-none transition-colors"
                    />
                </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="relative">
                    <Scissors className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-50" size={18} />
                    <select 
                    value={serviceFilter}
                    onChange={(e) => setServiceFilter(e.target.value)}
                    className="w-full appearance-none bg-surface-container-lowest border border-outline-variant/30 text-on-surface p-4 pl-12 focus:border-primary focus:outline-none transition-colors"
                    >
                    <option value="All">All Services</option>
                    {SERVICES.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-50 pointer-events-none" size={16} />
                </div>
                <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-50" size={18} />
                    <select 
                    value={barberFilter}
                    onChange={(e) => setBarberFilter(e.target.value)}
                    className="w-full appearance-none bg-surface-container-lowest border border-outline-variant/30 text-on-surface p-4 pl-12 focus:border-primary focus:outline-none transition-colors"
                    >
                    <option value="All">All Barbers</option>
                    {BARBERS.map(b => (
                        <option key={b.id} value={b.name}>{b.name}</option>
                    ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-50 pointer-events-none" size={16} />
                </div>
                <div className="relative">
                    <ArrowUpDown className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-50" size={18} />
                    <select 
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
                    className="w-full appearance-none bg-surface-container-lowest border border-outline-variant/30 text-on-surface p-4 pl-12 focus:border-primary focus:outline-none transition-colors"
                    >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-50 pointer-events-none" size={16} />
                </div>
                {hasActiveFilters && (
                    <button 
                    onClick={clearAllFilters}
                    className="flex items-center justify-center gap-2 px-4 py-3 border border-outline-variant/30 text-on-surface-variant hover:text-primary hover:border-primary transition-all text-[10px] uppercase font-bold tracking-widest"
                    >
                    <X size={14} /> Clear Filters
                    </button>
                )}
                <div className="flex items-center justify-end">
                    <span className="text-[10px] uppercase tracking-widest text-outline font-bold">
                    {filteredBookings.length} of {bookings.length} records
                    </span>
                </div>
                </div>
            </div>
            <div className="bg-surface-container border border-outline-variant/10 overflow-hidden">
                {loading ? (
                    <div className="p-20 text-center flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <div className="space-y-2">
                          <p className="font-headline uppercase tracking-widest text-sm text-primary font-bold">Syncing Records...</p>
                          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant opacity-60">This may take a moment on slower connections</p>
                        </div>
                    </div>
                ) : filteredBookings.length === 0 ? (
                    <div className="p-20 text-center opacity-50">
                        <AlertCircle className="mx-auto mb-4" size={48} />
                        <p className="font-headline uppercase tracking-widest text-sm">No records found matching filters</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-surface-container-highest border-b border-outline-variant/20">
                                    <th className="p-6 font-headline uppercase text-[10px] tracking-widest">Date / Time</th>
                                    <th className="p-6 font-headline uppercase text-[10px] tracking-widest">Customer</th>
                                    <th className="p-6 font-headline uppercase text-[10px] tracking-widest">Service</th>
                                    <th className="p-6 font-headline uppercase text-[10px] tracking-widest">Barber</th>
                                    <th className="p-6 font-headline uppercase text-[10px] tracking-widest">Status</th>
                                    <th className="p-6 font-headline uppercase text-[10px] tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/10">
                                {filteredBookings.map((booking) => (
                                    <tr key={booking.id} className="hover:bg-surface-container-highest/50 transition-colors">
                                        <td className="p-6">
                                            <div className="font-body text-sm">{booking.date}</div>
                                            <div className="font-headline font-bold text-primary">{booking.time}</div>
                                        </td>
                                        <td className="p-6">
                                            <div className="font-headline font-bold uppercase">{booking.customerName || 'Guest'}</div>
                                            <div className="font-body text-xs text-on-surface-variant">{booking.customerEmail || 'No email provided'}</div>
                                        </td>
                                        <td className="p-6">
                                            <div className="font-headline text-sm uppercase">{getServiceLabel(booking.serviceId)}</div>
                                        </td>
                                        <td className="p-6">
                                            <div className="font-headline text-sm uppercase text-primary">{booking.barber || '—'}</div>
                                        </td>
                                        <td className="p-6">
                                            <span className={`px-3 py-1 border text-[10px] uppercase font-bold tracking-widest ${getStatusColor(booking.status)}`}>
                                                {booking.status}
                                            </span>
                                        </td>
                                        <td className="p-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <select 
                                                    value={booking.status}
                                                    onChange={(e) => handleStatusUpdate(booking.id!, e.target.value as Booking['status'])}
                                                    className="appearance-none bg-surface-container-lowest border border-outline-variant/30 text-on-surface px-3 py-2 text-xs font-headline uppercase tracking-widest focus:border-primary focus:outline-none cursor-pointer"
                                                >
                                                    <option value="Upcoming">Upcoming</option>
                                                    <option value="Completed">Completed</option>
                                                    <option value="No-Show">No-Show</option>
                                                    <option value="Cancelled">Cancelled</option>
                                                </select>
                                                <button 
                                                    onClick={() => handleDeleteBooking(booking.id!)} 
                                                    className="p-2 text-red-400 hover:bg-red-500/10 hover:text-red-500 rounded transition-colors" 
                                                    title="Delete Record"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
          </motion.div>
        ) : view === 'calendar' ? (
          <motion.div
            key="calendar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="bg-surface-container p-8 border border-outline-variant/10">
              <div className="flex justify-between items-center mb-8">
                <h2 className="font-headline text-2xl font-bold uppercase tracking-widest">{monthName}</h2>
                <div className="flex gap-2">
                  <button onClick={prevMonth} className="p-2 hover:bg-surface-container-highest"><ChevronLeft size={24} /></button>
                  <button onClick={nextMonth} className="p-2 hover:bg-surface-container-highest"><ChevronRight size={24} /></button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-px bg-outline-variant/10 border border-outline-variant/10">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="bg-surface-container-highest p-4 text-center font-headline text-[10px] uppercase tracking-[0.2em] opacity-60">{d}</div>
                ))}
                {calendarDays.map((dateObj, i) => {
                  const dayBookings = dateObj.dateStr ? (bookingsByDate[dateObj.dateStr] || []) : [];
                  const isToday = dateObj.dateStr === new Date().toISOString().split('T')[0];

                  return (
                    <div 
                      key={i} 
                      onClick={() => { if (dateObj.dateStr) { setDateFilter(dateObj.dateStr); setView('list'); } }}
                      className={`group min-h-[120px] p-2 bg-surface-container transition-all cursor-pointer hover:bg-surface-container-highest border-t-2 relative ${dateObj.currentMonth ? 'text-on-surface' : 'opacity-20 pointer-events-none'} ${isToday ? 'border-primary' : 'border-transparent'}`}
                    >
                      <div className={`font-headline text-sm mb-2 ${isToday ? 'text-primary font-bold' : ''}`}>{dateObj.day}</div>
                      <div className="space-y-1">
                        {dayBookings.slice(0, 3).map((b, bi) => (
                          <div key={bi} className="text-[9px] truncate bg-primary/10 text-primary px-1 py-0.5 font-headline uppercase font-bold border-l-2 border-primary">{b.time} - {b.customerName}</div>
                        ))}
                        {dayBookings.length > 3 && <div className="text-[9px] opacity-50 font-headline uppercase text-center py-1 bg-surface-container-highest/50">+ {dayBookings.length - 3} more</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ) : view === 'availability' ? (
          <motion.div
            key="availability"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="bg-surface-container p-8 border border-outline-variant/10">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                <div>
                  <h2 className="font-headline text-2xl font-bold uppercase tracking-widest mb-2">Shop Availability</h2>
                  <p className="text-on-surface-variant text-sm">Select a date to block or open specific time slots.</p>
                </div>
                <div className="flex items-center gap-4 bg-surface-container-highest p-4 border border-outline-variant/10">
                  <Calendar size={18} className="text-primary" />
                  <input type="date" value={availabilityDate} onChange={(e) => setAvailabilityDate(e.target.value)} className="bg-transparent text-on-surface focus:outline-none font-headline uppercase text-xs tracking-widest cursor-pointer" />
                </div>
              </div>

              {isManaging ? (
                <div className="py-20 text-center flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="font-headline uppercase tracking-widest text-sm">Loading Slots...</p>
                </div>
              ) : adminTimeSlots.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center gap-6 border-2 border-dashed border-outline-variant/10 bg-surface-container-highest/20">
                  <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center">
                    <Ban size={32} className="text-red-500" />
                  </div>
                  <div>
                    <h3 className="font-headline text-2xl font-bold uppercase tracking-tight text-red-500 mb-2">Shop Closed</h3>
                    <p className="text-on-surface-variant font-body text-sm max-w-sm mx-auto">This date is currently marked as closed in your business settings or by a special closure.</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {adminTimeSlots.map((time) => {
                    const isBlocked = blockedSlots.some(s => s.time === time);
                    const hasBooking = bookings.some(b => b.date === availabilityDate && b.time === time && b.status !== 'Cancelled');
                    return (
                      <button
                        key={time}
                        disabled={hasBooking}
                        onClick={() => handleToggleSlot(time)}
                        className={`p-4 border transition-all text-center group relative ${hasBooking ? 'bg-surface-container-lowest border-outline-variant/10 opacity-40 cursor-not-allowed' : isBlocked ? 'bg-red-500/10 border-red-500 text-red-500 hover:bg-red-500/20' : 'bg-surface-container border-outline-variant/20 hover:border-primary text-on-surface'}`}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-headline text-sm font-bold">{time.replace(':00', '')}</span>
                          <span className="text-[8px] uppercase tracking-tighter opacity-60">{hasBooking ? 'Booked' : isBlocked ? 'Blocked' : 'Available'}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              
              <div className="mt-12 pt-12 border-t border-outline-variant/10">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="font-headline text-xl font-bold uppercase tracking-widest mb-1">Manage Closures</h3>
                  <button onClick={() => setIsBlockingRange(true)} className="px-4 py-2 border border-primary text-primary text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-primary hover:text-on-primary">Add Range Closure</button>
                </div>
                <div className="space-y-3">
                  {blockedRanges.length === 0 ? <div className="p-12 text-center border border-dashed border-outline-variant/20 opacity-40 text-xs uppercase tracking-widest font-headline">No multi-day closures set</div> : blockedRanges.map(range => (
                    <div key={range.id} className="flex justify-between items-center p-6 bg-surface-container-highest/30 border border-outline-variant/10">
                      <div className="flex items-center gap-6">
                        <Calendar size={20} className="text-primary/60" />
                        <div>
                          <div className="font-headline text-sm font-bold uppercase">{new Date(range.startDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {new Date(range.endDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                          <div className="text-[10px] text-on-surface-variant tracking-wider opacity-60 italic">{range.reason || 'No reason provided'}</div>
                        </div>
                      </div>
                      <button 
                        onClick={() => setConfirmModal({
                          show: true,
                          title: 'Remove Closure',
                          message: 'Are you sure you want to re-open the shop for this date range?',
                          onConfirm: async () => {
                            await removeBlockedRange(range.id!);
                            fetchBlockedRanges();
                            setConfirmModal(prev => ({ ...prev, show: false }));
                          }
                        })} 
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded"
                        title="Delete Closure"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="clients"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="bg-surface-container p-6 border border-outline-variant/10 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="md:col-span-2 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-50" size={18} />
                  <input type="text" placeholder="Search by name, email, or phone..." value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant/30 text-on-surface p-4 pl-12 focus:border-primary focus:outline-none transition-colors" />
                </div>
                <div className="relative">
                  <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-50" size={18} />
                  <select 
                    value={clientStatusFilter}
                    onChange={(e) => setClientStatusFilter(e.target.value as 'All' | 'Active' | 'Suspended')}
                    className="w-full appearance-none bg-surface-container-lowest border border-outline-variant/30 text-on-surface p-4 pl-12 focus:border-primary focus:outline-none transition-colors"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-50 pointer-events-none" size={16} />
                </div>
                <div className="relative">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-50" size={18} />
                  <select 
                    value={clientTypeFilter}
                    onChange={(e) => setClientTypeFilter(e.target.value as 'All' | 'Registered' | 'Guest')}
                    className="w-full appearance-none bg-surface-container-lowest border border-outline-variant/30 text-on-surface p-4 pl-12 focus:border-primary focus:outline-none transition-colors"
                  >
                    <option value="All">All Types</option>
                    <option value="Registered">Registered</option>
                    <option value="Guest">Guest</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-50 pointer-events-none" size={16} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <ArrowUpDown className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-50" size={18} />
                  <select 
                    value={clientSortOrder}
                    onChange={(e) => setClientSortOrder(e.target.value as 'newest' | 'oldest' | 'az' | 'za')}
                    className="w-full appearance-none bg-surface-container-lowest border border-outline-variant/30 text-on-surface p-4 pl-12 focus:border-primary focus:outline-none transition-colors"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="az">Name A → Z</option>
                    <option value="za">Name Z → A</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-50 pointer-events-none" size={16} />
                </div>
                {hasActiveClientFilters && (
                  <button 
                    onClick={clearAllClientFilters}
                    className="flex items-center justify-center gap-2 px-4 py-3 border border-outline-variant/30 text-on-surface-variant hover:text-primary hover:border-primary transition-all text-[10px] uppercase font-bold tracking-widest"
                  >
                    <X size={14} /> Clear Filters
                  </button>
                )}
                <div className="md:col-start-4 flex items-center justify-end">
                  <span className="text-[10px] uppercase tracking-widest text-outline font-bold">
                    {filteredClients.length} of {clients.length} clients
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-surface-container border border-outline-variant/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-highest border-b border-outline-variant/20">
                      <th className="p-6 font-headline uppercase text-[10px] tracking-widest">Client Name</th>
                      <th className="p-6 font-headline uppercase text-[10px] tracking-widest">Contact Info</th>
                      <th className="p-6 font-headline uppercase text-[10px] tracking-widest">Status</th>
                      <th className="p-6 font-headline uppercase text-[10px] tracking-widest">Member Since</th>
                      <th className="p-6 font-headline uppercase text-[10px] tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10">
                    {filteredClients.map((client) => (
                      <tr key={client.uid} className={`hover:bg-surface-container-highest/50 transition-colors ${client.suspended ? 'opacity-60' : ''}`}>
                        <td className="p-6">
                          <div className="font-headline font-bold uppercase flex items-center gap-2">
                            {client.displayName}
                            {client.isGuest && <span className="text-[9px] bg-outline-variant/20 px-2 py-0.5 uppercase tracking-widest">Guest</span>}
                          </div>
                        </td>
                        <td className="p-6 font-body text-sm">
                          <div>{client.email}</div>
                          {client.phoneNumber && <div className="text-primary mt-1 font-bold">{client.phoneNumber}</div>}
                        </td>
                        <td className="p-6">
                          {client.suspended ? (
                            <span className="flex items-center gap-2 text-red-500 font-headline text-[10px] uppercase tracking-widest font-bold">
                              <Ban size={14} /> Suspended
                            </span>
                          ) : (
                            <span className="flex items-center gap-2 text-green-500 font-headline text-[10px] uppercase tracking-widest font-bold">
                              <ShieldCheck size={14} /> Active
                            </span>
                          )}
                          {(client.noShowCount ?? 0) > 0 && (
                            <div className="text-[9px] text-yellow-500 mt-1 tracking-widest uppercase font-bold">
                              {client.noShowCount} No-Show{(client.noShowCount ?? 0) > 1 ? 's' : ''}
                            </div>
                          )}
                        </td>
                        <td className="p-6 font-body text-sm opacity-60">{new Date(client.createdAt).toLocaleDateString()}</td>
                        <td className="p-6 text-right space-x-2">
                          <button 
                            onClick={() => { setSelectedClient(client); setIsEditingClient(true); }} 
                            className="p-2 border border-outline hover:bg-primary hover:text-on-primary transition-all text-[10px] uppercase font-bold tracking-widest px-4"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleSuspendClient(client, !!client.suspended)} 
                            className={`p-2 border transition-all text-[10px] uppercase font-bold tracking-widest px-4 ${client.suspended ? 'border-green-500 text-green-500 hover:bg-green-500/10' : 'border-yellow-500 text-yellow-500 hover:bg-yellow-500/10'}`}
                            title={client.suspended ? 'Unsuspend' : 'Suspend'}
                          >
                            {client.suspended ? 'Activate' : 'Suspend'}
                          </button>
                          <button 
                            onClick={() => handleDeleteClient(client.uid)} 
                            className="p-2 text-red-500 hover:bg-red-500/10 rounded" 
                            title="Delete Client"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredClients.length === 0 && <tr><td colSpan={5} className="p-12 text-center opacity-40 font-headline uppercase tracking-widest text-xs">No clients found matching your search</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {view === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-12 pb-24"
          >
            {/* Weekly Hours Section */}
            <div className="bg-surface-container-low/50 p-6 md:p-10 border border-outline-variant/10 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary/30 group-hover:bg-primary transition-colors"></div>
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 flex items-center justify-center bg-primary/10 border border-primary/20">
                  <Clock className="text-primary" size={24} />
                </div>
                <div>
                  <h3 className="font-headline text-3xl font-bold uppercase tracking-tight">Standard Weekly Hours</h3>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-[0.2em] font-bold">Base schedule for the studio</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {businessSettings && WEEKDAY_ORDER.map((day) => {
                  const hours = businessSettings.weeklyHours[day];
                  return (
                    <div key={day} className="flex flex-col p-6 bg-surface-container border border-outline-variant/10 transition-all hover:border-primary/30 group/card relative">
                      <div className="flex justify-between items-start mb-6">
                        <span className="font-headline font-bold uppercase text-sm tracking-widest text-on-surface">{day}</span>
                        <div className={`px-2 py-0.5 text-[8px] uppercase font-black tracking-[0.2em] ${hours.closed ? 'text-red-500 bg-red-500/10' : 'text-green-500 bg-green-500/10'}`}>
                          {hours.closed ? 'Closed' : 'Active'}
                        </div>
                      </div>
                      
                      <div className="flex-1 flex flex-col gap-4 mb-8">
                        {hours.closed ? (
                          <div className="flex items-center justify-center h-[72px] border border-dashed border-outline-variant/20 bg-surface-container-lowest/30">
                            <span className="text-[10px] uppercase text-on-surface-variant font-bold tracking-widest opacity-50">No Slots Available</span>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between group/input">
                              <span className="text-[9px] uppercase text-outline-variant font-bold tracking-widest">Opening</span>
                              <input 
                                type="time" 
                                value={hours.open}
                                onChange={(e) => handleUpdateWeeklyHours(day as keyof WeeklyHours, 'open', e.target.value)}
                                className="bg-surface-container-lowest border border-outline-variant/20 p-2 text-xs font-headline focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all w-28 text-center"
                              />
                            </div>
                            <div className="flex items-center justify-between group/input">
                              <span className="text-[9px] uppercase text-outline-variant font-bold tracking-widest">Closing</span>
                              <input 
                                type="time" 
                                value={hours.close}
                                onChange={(e) => handleUpdateWeeklyHours(day as keyof WeeklyHours, 'close', e.target.value)}
                                className="bg-surface-container-lowest border border-outline-variant/20 p-2 text-xs font-headline focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all w-28 text-center"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <button
                        onClick={() => handleUpdateWeeklyHours(day as keyof WeeklyHours, 'closed', !hours.closed)}
                        className={`w-full py-3 font-headline font-bold uppercase text-[10px] tracking-[0.2em] border transition-all ${
                          hours.closed 
                            ? 'bg-primary/5 border-primary/20 text-primary hover:bg-primary/10' 
                            : 'bg-surface-container-lowest border-outline-variant/30 text-on-surface-variant hover:text-red-500 hover:border-red-500/50'
                        }`}
                      >
                        {hours.closed ? 'Set as Open' : 'Mark as Closed'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Special Hours / Date Overrides */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <div className="bg-surface-container-low/50 p-6 md:p-10 border border-outline-variant/10 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary/30 group-hover:bg-primary transition-colors"></div>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 flex items-center justify-center bg-primary/10 border border-primary/20">
                    <Calendar className="text-primary" size={24} />
                  </div>
                  <div>
                    <h3 className="font-headline text-2xl font-bold uppercase tracking-tight">Special Date Hours</h3>
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-[0.2em] font-bold">Holidays and Event overrides</p>
                  </div>
                </div>
                
                <div className="space-y-6 mb-10 p-6 bg-surface-container border border-outline-variant/10">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="col-span-2">
                       <label className="block text-[10px] uppercase text-outline-variant mb-2 font-bold tracking-widest">Date</label>
                      <input 
                        type="date" 
                        value={newSpecialDate}
                        onChange={(e) => setNewSpecialDate(e.target.value)}
                        className="w-full bg-surface-container-lowest border border-outline-variant/30 p-4 text-sm font-headline focus:border-primary outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase text-outline-variant mb-2 font-bold tracking-widest">Open</label>
                      <input 
                        type="time" 
                        disabled={newSpecialClosed}
                        value={newSpecialOpen}
                        onChange={(e) => setNewSpecialOpen(e.target.value)}
                        className="w-full bg-surface-container-lowest border border-outline-variant/30 p-4 text-sm font-headline focus:border-primary outline-none disabled:opacity-20 transition-all text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase text-outline-variant mb-2 font-bold tracking-widest">Close</label>
                      <input 
                        type="time" 
                        disabled={newSpecialClosed}
                        value={newSpecialClose}
                        onChange={(e) => setNewSpecialClose(e.target.value)}
                        className="w-full bg-surface-container-lowest border border-outline-variant/30 p-4 text-sm font-headline focus:border-primary outline-none disabled:opacity-20 transition-all text-center"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] uppercase text-outline-variant mb-2 font-bold tracking-widest">Reason / Event Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Christmas Eve, Training..."
                        value={newSpecialReason}
                        onChange={(e) => setNewSpecialReason(e.target.value)}
                        className="w-full bg-surface-container-lowest border border-outline-variant/30 p-4 text-sm font-headline focus:border-primary outline-none placeholder:text-on-surface-variant/30"
                      />
                    </div>
                    <div className="col-span-2 flex items-center gap-4 py-2 border-y border-outline-variant/5">
                      <div className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center transition-colors">
                        <input 
                          type="checkbox" 
                          id="specialClosed"
                          checked={newSpecialClosed}
                          onChange={(e) => setNewSpecialClosed(e.target.checked)}
                          className="peer sr-only"
                        />
                        <label 
                          htmlFor="specialClosed"
                          className="block h-5 w-10 rounded-full bg-outline-variant/30 peer-checked:bg-primary transition-colors cursor-pointer after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-5"
                        />
                      </div>
                      <label htmlFor="specialClosed" className="text-[11px] font-headline uppercase tracking-[0.2em] font-bold cursor-pointer text-on-surface-variant select-none">Fully Closed on this date</label>
                    </div>
                    <button
                      onClick={handleAddSpecialHours}
                      disabled={!newSpecialDate || isSavingSettings}
                      className="col-span-2 gold-gradient py-5 font-headline font-bold uppercase tracking-[0.3em] text-[10px] active:scale-[0.98] transition-all disabled:opacity-30 disabled:grayscale shadow-lg hover:brightness-110"
                    >
                      {isSavingSettings ? 'Saving...' : 'Add Special Hours'}
                    </button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <p className="text-[10px] uppercase font-black tracking-[0.2em] text-on-surface/50 px-2">Active Overrides</p>
                  {businessSettings?.specialHours?.map((special) => (
                    <div key={special.id} className="flex justify-between items-center p-5 bg-surface-container border border-outline-variant/10 hover:border-primary/20 transition-all group/item shadow-sm">
                      <div className="flex items-center gap-6">
                        <div className="flex flex-col items-center justify-center w-14 py-2 bg-surface-container-lowest border border-outline-variant/10">
                          <span className="text-[9px] font-black uppercase text-primary leading-none">
                            {new Date(special.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}
                          </span>
                          <span className="text-xl font-headline font-bold text-on-surface">
                            {new Date(special.date + 'T00:00:00').toLocaleDateString('en-US', { day: 'numeric' })}
                          </span>
                        </div>
                        <div>
                          <div className="font-headline font-bold uppercase text-xs tracking-widest text-on-surface">
                            {special.reason || 'Special Hours'}
                          </div>
                          <div className="text-[9px] text-on-surface-variant uppercase tracking-[0.2em] font-medium mt-1.5 flex items-center gap-2">
                             {special.closed ? (
                               <span className="text-red-500 font-bold">STUDIO CLOSED</span>
                             ) : (
                               <>
                                 <span className="px-1.5 py-0.5 bg-surface-container-highest/50 border border-outline-variant/10">{formatTimeStr(special.open)}</span>
                                 <span className="opacity-30">—</span>
                                 <span className="px-1.5 py-0.5 bg-surface-container-highest/50 border border-outline-variant/10">{formatTimeStr(special.close)}</span>
                               </>
                             )}
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleRemoveSpecialHours(special.id!)}
                        className="p-3 text-on-surface-variant hover:text-red-500 hover:bg-red-500/5 transition-all opacity-0 group-hover/item:opacity-100"
                        title="Remove Override"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {(!businessSettings?.specialHours || businessSettings.specialHours.length === 0) && (
                    <div className="text-center py-12 bg-surface-container/30 border border-dashed border-outline-variant/20">
                      <p className="text-[10px] uppercase text-on-surface-variant/40 tracking-[0.3em] font-bold italic">
                        No overrides configured
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-surface-container-low/50 p-6 md:p-10 border border-outline-variant/10 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-red-500/30 group-hover:bg-red-500 transition-colors"></div>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 flex items-center justify-center bg-red-500/10 border border-red-500/20 text-red-500">
                    <ShieldOff size={24} />
                  </div>
                  <div>
                    <h3 className="font-headline text-2xl font-bold uppercase tracking-tight">Full Studio Closures</h3>
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-[0.2em] font-bold text-red-500/70">Extended Shutdowns</p>
                  </div>
                </div>
                
                <p className="text-on-surface-variant text-[11px] mb-8 leading-relaxed font-medium uppercase tracking-wider opacity-70">
                  These represent total studio shutdowns managed via the <span className="text-on-surface font-bold">Availability</span> tab, typically for maintenance or vacations.
                </p>

                <div className="space-y-4">
                  {blockedRanges.map((range) => (
                    <div key={range.id} className="p-5 bg-surface-container border border-outline-variant/10 border-l-2 border-red-500/50 flex justify-between items-center group/range hover:border-red-500/30 transition-all">
                      <div>
                        <div className="font-headline font-bold uppercase text-[10px] tracking-[0.2em] text-on-surface">
                           {new Date(range.startDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                           <span className="mx-3 opacity-20">—</span>
                           {new Date(range.endDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        {range.reason && <div className="text-[9px] text-red-500/70 uppercase tracking-[0.2em] font-bold mt-2">{range.reason}</div>}
                      </div>
                      <button 
                        onClick={() => handleDeleteBlockedRange(range.id!)}
                        className="p-3 text-on-surface-variant hover:text-red-500 hover:bg-red-500/5 transition-all opacity-0 group-hover/range:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {blockedRanges.length === 0 && (
                    <div className="text-center py-12 bg-surface-container/30 border border-dashed border-outline-variant/20 italic">
                      <p className="text-[10px] uppercase text-on-surface-variant/40 tracking-[0.3em] font-bold">No active closures</p>
                    </div>
                  )}
                </div>
                
                <button 
                  onClick={() => setIsBlockingRange(true)}
                  className="w-full mt-8 py-5 border border-outline-variant/20 border-dashed text-on-surface-variant font-headline uppercase font-bold text-[10px] tracking-[0.3em] hover:text-red-500 hover:border-red-500/30 transition-all bg-surface-container-highest/10"
                >
                  <Plus size={14} className="inline mr-2" /> Add Extended Closure
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showManualBooking && businessSettings && (
        <ManualBookingModal 
          onClose={() => setShowManualBooking(false)} 
          onSuccess={() => { fetchBookings(); setShowManualBooking(false); }} 
          businessSettings={businessSettings}
          blockedRanges={blockedRanges}
        />
      )}

      {isBlockingRange && <RangeBlockingModal onClose={() => setIsBlockingRange(false)} onSuccess={() => { fetchBlockedRanges(); setIsBlockingRange(false); }} />}
      {isEditingClient && selectedClient && <EditClientModal client={selectedClient} onClose={() => { setIsEditingClient(false); setSelectedClient(null); }} onSuccess={() => { fetchClients(); setIsEditingClient(false); setSelectedClient(null); }} />}
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

function ManualBookingModal({ 
  onClose, 
  onSuccess, 
  businessSettings,
  blockedRanges
}: { 
  onClose: () => void, 
  onSuccess: () => void, 
  businessSettings: BusinessSettings,
  blockedRanges: BlockedRange[]
}) {
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    serviceId: SERVICES[0].id, 
    date: new Date().toISOString().split('T')[0], 
    time: '', 
    barber: BARBERS[0].name 
  });
  const [submitting, setSubmitting] = useState(false);

  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    const fetchRealAvailability = async () => {
      setLoadingSlots(true);
      try {
        const hours = getShopHoursForDate(businessSettings, formData.date, blockedRanges);
        if (hours.closed) {
          setAvailableSlots([]);
          return;
        }

        const [dayBookings, blockedSlots] = await Promise.all([
          getBookingsByDate(formData.date),
          getBlockedSlots(formData.date)
        ]);

        const allPossibleSlots = generateTimeSlots(hours.open, hours.close);
        const service = SERVICES.find(s => s.id === formData.serviceId);
        const duration = service?.duration || 30;

        const filtered = allPossibleSlots.filter(slot => 
          isSlotAvailableForService(slot, duration, hours, dayBookings, blockedSlots)
        );

        setAvailableSlots(filtered);
      } catch (error) {
        console.error("Failed to fetch custom availability", error);
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchRealAvailability();
  }, [formData.date, formData.serviceId, businessSettings, blockedRanges]);

  // Set default time when slots change
  useEffect(() => {
    if (availableSlots.length > 0 && (!formData.time || !availableSlots.includes(formData.time))) {
      setFormData(prev => ({ ...prev, time: availableSlots[0] }));
    } else if (availableSlots.length === 0) {
      setFormData(prev => ({ ...prev, time: '' }));
    }
  }, [availableSlots]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (availableSlots.length === 0) {
      toast.error("Shop is closed on the selected date");
      return;
    }
    setSubmitting(true);
    try {
      await createBooking({ 
        userId: `manual-entry-${Date.now()}`, 
        customerName: formData.name, 
        customerEmail: formData.email, 
        serviceId: formData.serviceId, 
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
      <motion.div initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-2xl bg-surface-container border border-outline-variant/10 shadow-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        <div className="bg-surface-container-highest/20 p-8 border-b border-outline-variant/10 flex justify-between items-center">
          <div>
            <h2 className="font-headline text-3xl font-bold uppercase tracking-tight text-on-surface">Direct Booking</h2>
            <p className="text-[10px] text-primary uppercase tracking-[0.3em] font-bold mt-1">Manual Entry Subsystem</p>
          </div>
          <button onClick={onClose} className="w-12 h-12 flex items-center justify-center bg-surface-container-lowest border border-outline-variant/20 text-on-surface-variant hover:text-primary transition-all rounded-none"><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-outline-variant">Customer Identity</label>
              <input required type="text" placeholder="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-surface-container-lowest border border-outline-variant/20 p-5 font-headline text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all" />
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
                {SERVICES.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()} — {s.price}</option>)}
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
}

function RangeBlockingModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const [data, setData] = useState({ startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0], reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (new Date(data.endDate) < new Date(data.startDate)) { toast.error("End date cannot be before start date"); return; }
    setSubmitting(true);
    try { await addBlockedRange(data); toast.success("Range blocked"); onSuccess(); } catch (error) { toast.error("Failed to block range"); } finally { setSubmitting(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-stone-950/80 backdrop-blur-xl">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-xl bg-surface-container border border-outline-variant/10 shadow-3xl overflow-hidden">
         <div className="bg-red-500/10 p-8 border-b border-outline-variant/10 flex justify-between items-center">
          <div>
            <h2 className="font-headline text-3xl font-bold uppercase tracking-tight text-red-500/90">Block Schedule</h2>
            <p className="text-[10px] text-red-500/50 uppercase tracking-[0.3em] font-bold mt-1">Temporary Shutdown Range</p>
          </div>
          <button onClick={onClose} className="w-12 h-12 flex items-center justify-center bg-surface-container-lowest border border-outline-variant/20 text-on-surface-variant hover:text-red-500 transition-all"><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-outline-variant">Start Lockdown</label>
              <input type="date" required value={data.startDate} onChange={e => setData({...data, startDate: e.target.value})} className="w-full bg-surface-container-lowest border border-outline-variant/30 p-5 font-headline text-sm focus:border-red-500 outline-none" />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-outline-variant">End Lockdown</label>
              <input type="date" required min={data.startDate} value={data.endDate} onChange={e => setData({...data, endDate: e.target.value})} className="w-full bg-surface-container-lowest border border-outline-variant/30 p-5 font-headline text-sm focus:border-red-500 outline-none" />
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-outline-variant">Reason for Closure</label>
            <input type="text" value={data.reason} onChange={e => setData({...data, reason: e.target.value})} className="w-full bg-surface-container-lowest border border-outline-variant/30 p-5 font-headline text-sm focus:border-red-500 outline-none" placeholder="e.g. Studio Refurbishment" />
          </div>
          <div className="pt-4">
            <button disabled={submitting} className="w-full bg-red-600 text-white py-6 font-headline uppercase font-black text-[11px] tracking-[0.4em] shadow-xl hover:bg-red-700 transition-all disabled:opacity-50">
              {submitting ? 'ENFORCING CLOSURE...' : 'CONFIRM STUDIO SHUTDOWN'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function EditClientModal({ client, onClose, onSuccess }: { client: Client, onClose: () => void, onSuccess: () => void }) {
  const [formData, setFormData] = useState({ displayName: client.displayName, email: client.email, phoneNumber: client.phoneNumber || '' });
  const [submitting, setSubmitting] = useState(false);
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await updateClient(client.uid, formData);
      toast.success("Client profile updated");
      onSuccess();
    } catch (error) {
      toast.error("Failed to update client");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-stone-950/80 backdrop-blur-xl">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-xl bg-surface-container border border-outline-variant/10 shadow-3xl overflow-hidden">
         <div className="bg-surface-container-highest/20 p-8 border-b border-outline-variant/10 flex justify-between items-center">
          <div>
            <h2 className="font-headline text-3xl font-bold uppercase tracking-tight text-on-surface">Client Profile</h2>
            <p className="text-[10px] text-primary uppercase tracking-[0.3em] font-bold mt-1">Information Record Update</p>
          </div>
          <button onClick={onClose} className="w-12 h-12 flex items-center justify-center bg-surface-container-lowest border border-outline-variant/20 text-on-surface-variant hover:text-primary transition-all"><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="space-y-3">
            <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-outline-variant">Display Name</label>
            <input required type="text" value={formData.displayName} onChange={e => setFormData({...formData, displayName: e.target.value})} className="w-full bg-surface-container-lowest border border-outline-variant/20 p-5 font-headline text-sm focus:border-primary outline-none" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-outline-variant">Email Contact</label>
              <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-surface-container-lowest border border-outline-variant/20 p-5 font-headline text-sm focus:border-primary outline-none" />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-outline-variant">Phone Number</label>
              <input type="tel" value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} className="w-full bg-surface-container-lowest border border-outline-variant/20 p-5 font-headline text-sm focus:border-primary outline-none" />
            </div>
          </div>
          <div className="pt-4">
            <button disabled={submitting} className="w-full gold-gradient py-6 font-headline uppercase font-black text-[11px] tracking-[0.4em] shadow-xl hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50">
              {submitting ? 'SYNCHRONIZING...' : 'SAVE MODIFICATIONS'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
