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
  X
} from 'lucide-react';
import { 
  getAllBookings, 
  updateBookingStatus, 
  Booking, 
  getBlockedSlots, 
  addBlockedSlot, 
  removeBlockedSlot, 
  BlockedSlot,
  getBlockedRanges,
  addBlockedRange,
  removeBlockedRange,
  BlockedRange,
  createBooking,
  getAllClients,
  updateClient,
  deleteClient,
  deleteBooking,
  suspendClient,
  Client
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
  const [view, setView] = useState<'list' | 'calendar' | 'availability' | 'clients'>('list');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Availability State
  const [availabilityDate, setAvailabilityDate] = useState(new Date().toISOString().split('T')[0]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [isManaging, setIsManaging] = useState(false);
  const [showManualBooking, setShowManualBooking] = useState(false);
  const [isBlockingRange, setIsBlockingRange] = useState(false);
  const [blockedRanges, setBlockedRanges] = useState<BlockedRange[]>([]);

  // Clients State
  const [clients, setClients] = useState<Client[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [clientStatusFilter, setClientStatusFilter] = useState<'All' | 'Active' | 'Suspended'>('All');
  const [clientTypeFilter, setClientTypeFilter] = useState<'All' | 'Registered' | 'Guest'>('All');
  const [clientSortOrder, setClientSortOrder] = useState<'newest' | 'oldest' | 'az' | 'za'>('newest');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isEditingClient, setIsEditingClient] = useState(false);

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
      console.error("Failed to load blocked ranges");
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
    fetchClients();
  }, []);

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
    const slots = [];
    let current = new Date();
    current.setHours(9, 0, 0, 0);
    const end = new Date();
    end.setHours(18, 0, 0, 0);

    while (current < end) {
      slots.push(current.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      }));
      current.setMinutes(current.getMinutes() + 15);
    }
    return slots;
  }, []);

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
    try {
      await deleteBooking(id);
      toast.success("Record deleted");
      fetchBookings();
    } catch (error) {
      console.error('Delete booking error:', error);
      toast.error("Failed to delete record");
    }
  };

  const handleDeleteClient = async (uid: string) => {
    try {
      await deleteClient(uid);
      toast.success("Client deleted");
      fetchClients();
    } catch (error) {
      console.error('Delete client error:', error);
      toast.error("Failed to delete client");
    }
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
    <main className="pt-32 pb-24 px-6 md:px-12 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="font-headline text-4xl md:text-6xl font-bold tracking-tighter text-primary uppercase">
            Admin Portal
          </h1>
          <p className="text-on-surface-variant font-body">Manage appointments and shop operations.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-surface-container p-1 border border-outline-variant/20 rounded-none">
            <button
              onClick={() => setView('list')}
              className={`p-2 transition-all ${view === 'list' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-primary'}`}
              title="List View"
            >
              <LayoutList size={20} />
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`p-2 transition-all ${view === 'calendar' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-primary'}`}
              title="Calendar View"
            >
              <CalendarDays size={20} />
            </button>
            <button
              onClick={() => setView('availability')}
              className={`p-2 transition-all ${view === 'availability' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-primary'}`}
              title="Availability Management"
            >
              <Clock size={20} />
            </button>
            <button
              onClick={() => setView('clients')}
              className={`p-2 transition-all ${view === 'clients' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-primary'}`}
              title="Client Management"
            >
              <Users size={20} />
            </button>
          </div>
          <button 
            onClick={() => setShowManualBooking(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary font-headline uppercase text-xs tracking-widest hover:bg-primary/90 transition-all shadow-lg"
          >
            Add Appointment
          </button>
          <button 
            onClick={fetchBookings}
            className="flex items-center gap-2 px-6 py-3 border border-outline text-on-surface font-headline uppercase text-xs tracking-widest hover:bg-surface-container transition-all"
          >
            Refresh
          </button>
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
                          <div className="font-headline text-sm font-bold uppercase">{new Date(range.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {new Date(range.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                          <div className="text-[10px] text-on-surface-variant tracking-wider opacity-60 italic">{range.reason || 'No reason provided'}</div>
                        </div>
                      </div>
                      <button onClick={async () => { if (window.confirm("Remove this closure?")) { await removeBlockedRange(range.id!); fetchBlockedRanges(); } }} className="p-2 text-red-500 hover:bg-red-500/10 rounded"><XSquare size={18} /></button>
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
      </AnimatePresence>

      {showManualBooking && <ManualBookingModal onClose={() => setShowManualBooking(false)} onSuccess={() => { fetchBookings(); setShowManualBooking(false); }} timeSlots={adminTimeSlots} />}
      {isBlockingRange && <RangeBlockingModal onClose={() => setIsBlockingRange(false)} onSuccess={() => { fetchBlockedRanges(); setIsBlockingRange(false); }} />}
      {isEditingClient && selectedClient && <EditClientModal client={selectedClient} onClose={() => { setIsEditingClient(false); setSelectedClient(null); }} onSuccess={() => { fetchClients(); setIsEditingClient(false); setSelectedClient(null); }} />}
    </main>
  );
}

function ManualBookingModal({ onClose, onSuccess, timeSlots }: { onClose: () => void, onSuccess: () => void, timeSlots: string[] }) {
  const [formData, setFormData] = useState({ name: '', email: '', serviceId: SERVICES[0].id, date: new Date().toISOString().split('T')[0], time: timeSlots[0], barber: BARBERS[0].name });
  const [submitting, setSubmitting] = useState(false);
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createBooking({ userId: `manual-entry-${Date.now()}`, customerName: formData.name, customerEmail: formData.email, serviceId: formData.serviceId, date: formData.date, time: formData.time, status: 'Upcoming', barber: formData.barber });
      toast.success("Booking created");
      onSuccess();
    } catch (error) { toast.error("Failed to create booking"); } finally { setSubmitting(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-surface/80 backdrop-blur-md">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-xl bg-surface-container p-8 border border-outline-variant/20 shadow-2xl">
        <div className="flex justify-between items-center mb-8">
          <h2 className="font-headline text-2xl font-bold uppercase tracking-widest">Manual Appointment</h2>
          <button onClick={onClose} className="p-2 hover:bg-surface-container-highest"><XSquare size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold opacity-60">Customer Name</label>
              <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-surface-container-lowest border border-outline-variant/30 p-4 focus:border-primary focus:outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold opacity-60">Email Address (Optional)</label>
              <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-surface-container-lowest border border-outline-variant/30 p-4 focus:border-primary focus:outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold opacity-60">Service</label>
              <select value={formData.serviceId} onChange={e => setFormData({...formData, serviceId: e.target.value})} className="w-full bg-surface-container-lowest border border-outline-variant/30 p-4 focus:border-primary focus:outline-none">
                {SERVICES.map(s => <option key={s.id} value={s.id}>{s.name} - {s.price}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold opacity-60">Barber</label>
              <select value={formData.barber} onChange={e => setFormData({...formData, barber: e.target.value})} className="w-full bg-surface-container-lowest border border-outline-variant/30 p-4 focus:border-primary focus:outline-none">
                {BARBERS.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold opacity-60">Date</label>
              <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-surface-container-lowest border border-outline-variant/30 p-4 focus:border-primary focus:outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold opacity-60">Time</label>
              <select value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="w-full bg-surface-container-lowest border border-outline-variant/30 p-4 focus:border-primary focus:outline-none">
                {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="pt-6"><button disabled={submitting} className="w-full bg-primary text-on-primary p-6 font-headline uppercase font-bold tracking-[0.2em] shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50">{submitting ? 'Creating...' : 'Confirm Appointment'}</button></div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-surface/80 backdrop-blur-md">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg bg-surface-container p-8 border border-outline-variant/20 shadow-2xl">
        <div className="flex justify-between items-center mb-8">
          <h2 className="font-headline text-2xl font-bold uppercase tracking-widest">Shop Closure</h2>
          <button onClick={onClose} className="p-2 hover:bg-surface-container-highest"><XSquare size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold opacity-60">Start Date</label>
              <input type="date" required value={data.startDate} onChange={e => setData({...data, startDate: e.target.value})} className="w-full bg-surface-container-lowest border border-outline-variant/30 p-4 focus:border-primary focus:outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold opacity-60">End Date</label>
              <input type="date" required min={data.startDate} value={data.endDate} onChange={e => setData({...data, endDate: e.target.value})} className="w-full bg-surface-container-lowest border border-outline-variant/30 p-4 focus:border-primary focus:outline-none" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold opacity-60">Reason (Optional)</label>
            <input type="text" value={data.reason} onChange={e => setData({...data, reason: e.target.value})} className="w-full bg-surface-container-lowest border border-outline-variant/30 p-4 focus:border-primary focus:outline-none" placeholder="e.g. Renovation" />
          </div>
          <div className="pt-6"><button disabled={submitting} className="w-full bg-red-600 text-white p-6 font-headline uppercase font-bold tracking-[0.2em] shadow-lg hover:shadow-red-500/20 transition-all disabled:opacity-50">{submitting ? 'Blocking...' : 'Confirm Closure'}</button></div>
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
    try { await updateClient(client.uid, formData); toast.success("Client profile updated"); onSuccess(); } catch (error) { toast.error("Failed to update client"); } finally { setSubmitting(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-surface/80 backdrop-blur-md">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg bg-surface-container p-8 border border-outline-variant/20 shadow-2xl">
        <div className="flex justify-between items-center mb-8">
          <h2 className="font-headline text-2xl font-bold uppercase tracking-widest">Edit Client Profile</h2>
          <button onClick={onClose} className="p-2 hover:bg-surface-container-highest"><XSquare size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold opacity-60">Full Name</label>
            <input required type="text" value={formData.displayName} onChange={e => setFormData({...formData, displayName: e.target.value})} className="w-full bg-surface-container-lowest border border-outline-variant/30 p-4 focus:border-primary focus:outline-none" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold opacity-60">Email Address</label>
            <input 
              required 
              type="email" 
              value={formData.email} 
              onChange={e => setFormData({...formData, email: e.target.value})}
              className="w-full bg-surface-container-lowest border border-outline-variant/30 p-4 focus:border-primary focus:outline-none transition-colors" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold opacity-60">Phone Number</label>
            <input type="tel" value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} className="w-full bg-surface-container-lowest border border-outline-variant/30 p-4 focus:border-primary focus:outline-none" placeholder="(XXX) XXX-XXXX" />
          </div>
          <div className="pt-6"><button disabled={submitting} className="w-full bg-primary text-on-primary p-6 font-headline uppercase font-bold tracking-[0.2em] shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50">{submitting ? 'Saving...' : 'Update Profile'}</button></div>
        </form>
      </motion.div>
    </div>
  );
}
