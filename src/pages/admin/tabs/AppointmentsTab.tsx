import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Search, 
  Filter, 
  Calendar, 
  Scissors, 
  User, 
  ArrowUpDown, 
  X, 
  ChevronDown, 
  AlertCircle, 
  Trash2, 
  Clock 
} from 'lucide-react';
import { Booking, Service } from '../../../services/api';
import { Barber } from '../../../data/barbers';

interface AppointmentsTabProps {
  bookings: Booking[];
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  timelineFilter: string;
  setTimelineFilter: (val: string) => void;
  dateFilter: string;
  setDateFilter: (val: string) => void;
  serviceFilter: string;
  setServiceFilter: (val: string) => void;
  barberFilter: string;
  setBarberFilter: (val: string) => void;
  sortOrder: 'newest' | 'oldest';
  setSortOrder: (val: 'newest' | 'oldest') => void;
  services: Service[];
  barbers: Barber[];
  onStatusUpdate: (id: string, status: Booking['status']) => void;
  onDeleteBooking: (id: string) => void;
}

const AppointmentsTab: React.FC<AppointmentsTabProps> = ({
  bookings,
  loading,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  timelineFilter,
  setTimelineFilter,
  dateFilter,
  setDateFilter,
  serviceFilter,
  setServiceFilter,
  barberFilter,
  setBarberFilter,
  sortOrder,
  setSortOrder,
  services,
  barbers,
  onStatusUpdate,
  onDeleteBooking
}) => {
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const filteredBookings = useMemo(() => {
    const filtered = bookings.filter(b => {
      const matchesSearch = 
        (b.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
         b.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         (b.serviceId?.toLowerCase().includes(searchTerm.toLowerCase()) || ''));
      
      const matchesStatus = statusFilter === 'All' || b.status === statusFilter;
      const matchesDate = !dateFilter || b.date === dateFilter;
      const matchesService = serviceFilter === 'All' || b.serviceId === serviceFilter;
      const matchesBarber = barberFilter === 'All' || b.barber === barberFilter;

      let matchesTimeline = true;
      if (timelineFilter === 'Past') {
        matchesTimeline = b.date < todayStr;
      } else if (timelineFilter === 'Today') {
        matchesTimeline = b.date === todayStr;
      } else if (timelineFilter === 'Future') {
        matchesTimeline = b.date > todayStr;
      }

      return matchesSearch && matchesStatus && matchesDate && matchesService && matchesBarber && matchesTimeline;
    });

    filtered.sort((a, b) => {
      const dateTimeA = new Date(`${a.date}T${a.time || '00:00'}`).getTime();
      const dateTimeB = new Date(`${b.date}T${b.time || '00:00'}`).getTime();
      if (sortOrder === 'newest') {
        return dateTimeB - dateTimeA;
      } else {
        return dateTimeA - dateTimeB;
      }
    });

    return filtered;
  }, [bookings, searchTerm, statusFilter, timelineFilter, dateFilter, serviceFilter, barberFilter, sortOrder, todayStr]);

  const hasActiveFilters = searchTerm || statusFilter !== 'All' || timelineFilter !== 'All' || dateFilter || serviceFilter !== 'All' || barberFilter !== 'All' || sortOrder !== 'newest';

  const clearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setTimelineFilter('All');
    setDateFilter('');
    setServiceFilter('All');
    setBarberFilter('All');
    setSortOrder('newest');
  };

  const getServiceLabel = (id: string) => {
    return services.find(s => s.id === id)?.name || 'Custom Service';
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="bg-surface-container p-6 border border-outline-variant/10 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-50" size={18} />
            <input 
              type="text"
              placeholder="Search by Client Identity or Email..."
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
            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-50" size={18} />
            <select 
              value={timelineFilter}
              onChange={(e) => setTimelineFilter(e.target.value)}
              className="w-full appearance-none bg-surface-container-lowest border border-outline-variant/30 text-on-surface p-4 pl-12 focus:border-primary focus:outline-none transition-colors"
            >
              <option value="All">All Timeline</option>
              <option value="Past">Past Appointments</option>
              <option value="Today">Today</option>
              <option value="Future">Future Appointments</option>
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
              {services.map(s => (
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
              {barbers.map(b => (
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
                  <th className="p-6 font-headline uppercase text-[10px] tracking-widest">Client Ritual</th>
                  <th className="p-6 font-headline uppercase text-[10px] tracking-widest">Client Identity</th>
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
                      <div className="font-headline font-bold uppercase">{booking.customerName || 'Guest Client'}</div>
                      <div className="font-body text-xs text-on-surface-variant mb-2">{booking.customerEmail || 'No email provided'}</div>
                      {booking.specialInstructions && (
                        <div className="bg-primary/5 border-l-2 border-primary p-2 mt-1 max-w-[200px]">
                          <p className="text-[9px] uppercase tracking-widest text-primary font-bold mb-0.5">Special Instructions</p>
                          <p className="text-[10px] text-on-surface leading-tight italic line-clamp-2" title={booking.specialInstructions}>
                            "{booking.specialInstructions}"
                          </p>
                        </div>
                      )}
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
                          onChange={(e) => onStatusUpdate(booking.id!, e.target.value as Booking['status'])}
                          className="appearance-none bg-surface-container-lowest border border-outline-variant/30 text-on-surface px-3 py-2 text-xs font-headline uppercase tracking-widest focus:border-primary focus:outline-none cursor-pointer"
                        >
                          <option value="Upcoming">Upcoming</option>
                          <option value="Completed">Completed</option>
                          <option value="No-Show">No-Show</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                        <button 
                          onClick={() => onDeleteBooking(booking.id!)} 
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
  );
};

export default AppointmentsTab;
