import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  ChevronDown, 
  ShieldOff, 
  ShieldCheck, 
  Trash2,
  X,
  History,
  Calendar,
  Clock,
  Scissors
} from 'lucide-react';
import { Client, Booking, Service } from '../../../services/api';

interface ClientsTabProps {
  clients: Client[];
  bookings: Booking[];
  services: Service[];
  clientSearch: string;
  setClientSearch: (val: string) => void;
  clientStatusFilter: 'All' | 'Active' | 'Suspended';
  setClientStatusFilter: (val: 'All' | 'Active' | 'Suspended') => void;
  clientTypeFilter: 'All' | 'Registered' | 'Guest';
  setClientTypeFilter: (val: 'All' | 'Registered' | 'Guest') => void;
  clientSortOrder: 'newest' | 'oldest' | 'az' | 'za';
  setClientSortOrder: (val: 'newest' | 'oldest' | 'az' | 'za') => void;
  onSuspendClient: (client: Client, currentlySuspended: boolean) => void;
  onDeleteClient: (uid: string, email?: string) => void;
  onUpdateClient: (uid: string, data: Partial<Client>) => Promise<boolean>;
}

const ClientsTab: React.FC<ClientsTabProps> = ({
  clients = [],
  bookings = [],
  services = [],
  clientSearch = '',
  setClientSearch,
  clientStatusFilter = 'All',
  setClientStatusFilter,
  clientTypeFilter = 'All',
  setClientTypeFilter,
  clientSortOrder = 'newest',
  setClientSortOrder,
  onSuspendClient,
  onDeleteClient,
  onUpdateClient
}) => {
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);

  const filteredClients = useMemo(() => {
    if (!clients || !Array.isArray(clients)) return [];
    
    const filtered = (clients || []).filter(c => {
      const name = c?.displayName || '';
      const email = c?.email || '';
      const phone = c?.phoneNumber || '';
      const searchTerm = (clientSearch || '').toLowerCase();
      
      const matchesSearch = 
        name.toLowerCase().includes(searchTerm) ||
        email.toLowerCase().includes(searchTerm) ||
        phone.includes(clientSearch || '');
      
      const matchesStatus = 
        clientStatusFilter === 'All' ||
        (clientStatusFilter === 'Suspended' && c?.suspended) ||
        (clientStatusFilter === 'Active' && !c?.suspended);

      const matchesType =
        clientTypeFilter === 'All' ||
        (clientTypeFilter === 'Guest' && c?.isGuest) ||
        (clientTypeFilter === 'Registered' && !c?.isGuest);

      return matchesSearch && matchesStatus && matchesType;
    });

    filtered.sort((a, b) => {
      switch (clientSortOrder) {
        case 'newest': return (b.createdAt || 0) - (a.createdAt || 0);
        case 'oldest': return (a.createdAt || 0) - (b.createdAt || 0);
        case 'az': return (a.displayName || '').localeCompare(b.displayName || '');
        case 'za': return (b.displayName || '').localeCompare(a.displayName || '');
        default: return 0;
      }
    });

    return filtered;
  }, [clients, clientSearch, clientStatusFilter, clientTypeFilter, clientSortOrder]);

  const getClientRituals = (client: Client) => {
    return (bookings || []).filter(b => 
      (b?.userId && b.userId === client?.uid) || 
      (b?.customerEmail && b.customerEmail.toLowerCase() === (client?.email || '').toLowerCase())
    ).sort((a, b) => {
      const dateA = a && a.date && a.time ? new Date(`${a.date}T${a.time}`).getTime() : 0;
      const dateB = b && b.date && b.time ? new Date(`${b.date}T${b.time}`).getTime() : 0;
      return dateB - dateA;
    });
  };

  const getServiceLabel = (id: string) => {
    return services.find(s => s.id === id)?.name || 'Custom Ritual';
  };

  const getStatusColor = (status: Booking['status']) => {
    switch(status) {
      case 'Upcoming': return 'text-primary border-primary';
      case 'Completed': return 'text-green-500 border-green-500';
      case 'Cancelled': return 'text-red-500 border-red-500';
      case 'No-Show': return 'text-yellow-500 border-yellow-500';
      default: return 'text-outline border-outline';
    }
  };

  const hasActiveFilters = clientSearch || clientStatusFilter !== 'All' || clientTypeFilter !== 'All' || clientSortOrder !== 'newest';

  const clearAllFilters = () => {
    setClientSearch('');
    setClientStatusFilter('All');
    setClientTypeFilter('All');
    setClientSortOrder('newest');
  };

  return (
    <motion.div
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
              placeholder="Search clients by name, email, or phone..."
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant/30 text-on-surface p-4 pl-12 focus:border-primary focus:outline-none transition-colors"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-50" size={18} />
            <select 
              value={clientStatusFilter}
              onChange={(e) => setClientStatusFilter(e.target.value as any)}
              className="w-full appearance-none bg-surface-container-lowest border border-outline-variant/30 text-on-surface p-4 pl-12 focus:border-primary focus:outline-none transition-colors"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active Only</option>
              <option value="Suspended">Suspended Only</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-50 pointer-events-none" size={16} />
          </div>
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-50" size={18} />
            <select 
              value={clientTypeFilter}
              onChange={(e) => setClientTypeFilter(e.target.value as any)}
              className="w-full appearance-none bg-surface-container-lowest border border-outline-variant/30 text-on-surface p-4 pl-12 focus:border-primary focus:outline-none transition-colors"
            >
              <option value="All">All Types</option>
              <option value="Registered">Registered Users</option>
              <option value="Guest">Guests</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-50 pointer-events-none" size={16} />
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative min-w-[200px]">
            <ArrowUpDown className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-50" size={18} />
            <select 
              value={clientSortOrder}
              onChange={(e) => setClientSortOrder(e.target.value as any)}
              className="w-full appearance-none bg-surface-container-lowest border border-outline-variant/30 text-on-surface p-4 pl-12 focus:border-primary focus:outline-none transition-colors"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="az">Name (A-Z)</option>
              <option value="za">Name (Z-A)</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-50 pointer-events-none" size={16} />
          </div>
          
          <div className="flex items-center gap-4">
            {hasActiveFilters && (
              <button 
                onClick={clearAllFilters}
                className="flex items-center gap-2 px-4 py-3 border border-outline-variant/30 text-on-surface-variant hover:text-primary transition-all text-[10px] uppercase font-bold tracking-widest"
              >
                <X size={14} /> Clear Filters
              </button>
            )}
            <span className="text-[10px] uppercase tracking-widest text-outline font-bold">
              {filteredClients.length} clients found
            </span>
          </div>
        </div>
      </div>

      <div className="bg-surface-container border border-outline-variant/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-highest border-b border-outline-variant/20">
                <th className="p-6 font-headline uppercase text-[10px] tracking-widest">Client Identity</th>
                <th className="p-6 font-headline uppercase text-[10px] tracking-widest text-center">No-Shows</th>
                <th className="p-6 font-headline uppercase text-[10px] tracking-widest text-center">Type</th>
                <th className="p-6 font-headline uppercase text-[10px] tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {filteredClients.map((client) => {
                const rituals = getClientRituals(client);
                const isExpanded = expandedClientId === client.uid;
                
                return (
                  <React.Fragment key={client.uid}>
                    <tr 
                      className={`hover:bg-surface-container-highest/50 transition-colors cursor-pointer ${client.suspended ? 'opacity-50' : ''} ${isExpanded ? 'bg-surface-container-highest/30' : ''}`}
                      onClick={() => setExpandedClientId(isExpanded ? null : client.uid)}
                    >
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-headline text-lg font-bold shrink-0 transition-transform ${isExpanded ? 'scale-110' : ''} ${client.suspended ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary uppercase'}`}>
                            {client.displayName?.charAt(0) || '?'}
                          </div>
                          <div>
                            <div className="font-headline font-bold uppercase flex items-center gap-2">
                              {client.displayName}
                              {client.suspended && <span className="bg-red-500 text-white text-[8px] px-1 rounded">SUSPENDED</span>}
                            </div>
                            <div className="font-body text-xs text-on-surface-variant flex items-center gap-2">
                              {client.email}
                              <span className="w-1 h-1 bg-outline-variant rounded-full"></span>
                              <span className="text-[10px] uppercase font-bold tracking-widest text-primary flex items-center gap-1">
                                <History size={10} /> {rituals.length} Rituals
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-6 text-center">
                        <span className={`font-headline font-bold text-lg ${client.noShowCount && client.noShowCount > 0 ? 'text-red-500' : 'text-on-surface-variant'}`}>
                          {client.noShowCount || 0}
                        </span>
                      </td>
                      <td className="p-6 text-center">
                        <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded ${client.isGuest ? 'bg-surface-container-lowest text-outline' : 'bg-primary/10 text-primary border border-primary/20'}`}>
                          {client.isGuest ? 'Guest' : 'Registered'}
                        </span>
                      </td>
                      <td className="p-6 text-right">
                        <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                          <button 
                            onClick={() => onSuspendClient(client, !!client.suspended)}
                            className={`p-2 rounded transition-colors ${client.suspended ? 'text-green-500 hover:bg-green-500/10' : 'text-yellow-500 hover:bg-yellow-500/10'}`}
                            title={client.suspended ? "Unsuspend Client" : "Suspend Client"}
                          >
                            {client.suspended ? <ShieldCheck size={18} /> : <ShieldOff size={18} />}
                          </button>
                          <button 
                            onClick={() => onDeleteClient(client.uid, client.email)}
                            className="p-2 text-red-400 hover:bg-red-500/10 hover:text-red-500 rounded transition-colors"
                            title="Delete Client"
                          >
                            <Trash2 size={18} />
                          </button>
                          <ChevronDown size={20} className={`text-on-surface-variant transition-transform duration-300 ml-2 ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                      </td>
                    </tr>
                    <AnimatePresence>
                      {isExpanded && (
                        <tr>
                          <td colSpan={4} className="p-0 bg-surface-container-lowest/50">
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="p-8 border-l-4 border-primary">
                                <ClientNotesSection 
                                  client={client} 
                                  onUpdate={onUpdateClient} 
                                />

                                <div className="flex items-center gap-2 mb-6 mt-12">
                                  <History className="text-primary" size={18} />
                                  <h5 className="font-headline font-bold uppercase tracking-widest text-xs">Ritual History</h5>
                                </div>
                                
                                {rituals.length === 0 ? (
                                  <div className="bg-surface-container p-6 text-center italic text-on-surface-variant text-sm border border-outline-variant/10">
                                    No past rituals found for this client.
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-1 gap-3">
                                    {rituals.map(ritual => (
                                      <div key={ritual.id} className="bg-surface-container p-4 border border-outline-variant/10 flex flex-wrap justify-between items-center gap-4 group">
                                        <div className="flex items-center gap-6">
                                          <div className="flex flex-col">
                                            <div className="flex items-center gap-2 text-on-surface-variant mb-1">
                                              <Calendar size={12} />
                                              <span className="text-[10px] uppercase font-bold tracking-widest">{ritual.date}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-primary">
                                              <Clock size={12} />
                                              <span className="font-headline font-bold">{ritual.time}</span>
                                            </div>
                                          </div>
                                          <div className="h-8 w-px bg-outline-variant/30"></div>
                                          <div className="flex flex-col">
                                            <div className="flex items-center gap-2 text-on-surface-variant mb-1">
                                              <Scissors size={12} />
                                              <span className="text-[10px] uppercase font-bold tracking-widest">Technique</span>
                                            </div>
                                            <span className="font-headline font-black uppercase text-sm">{getServiceLabel(ritual.serviceId)}</span>
                                          </div>
                                          <div className="h-8 w-px bg-outline-variant/30"></div>
                                          <div className="flex flex-col">
                                            <div className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant mb-1">Barber</div>
                                            <span className="font-headline font-bold text-xs uppercase">{ritual.barber || '—'}</span>
                                          </div>
                                        </div>
                                        <div className={`px-4 py-2 border text-[10px] font-black uppercase tracking-[0.2em] ${getStatusColor(ritual.status)}`}>
                                          {ritual.status}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

const ClientNotesSection: React.FC<{ 
  client: Client; 
  onUpdate: (uid: string, data: Partial<Client>) => Promise<boolean>;
}> = ({ client, onUpdate }) => {
  const [notes, setNotes] = useState(client.notes || '');
  const [isSaving, setIsSaving] = useState(false);
  const hasChanges = notes !== (client.notes || '');

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate(client.uid, { notes: notes.trim() });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="text-primary/60" size={16} />
          <h5 className="font-headline font-bold uppercase tracking-widest text-[10px] text-primary/60">Ritual Notes</h5>
        </div>
        {hasChanges && (
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="text-[10px] uppercase font-bold tracking-widest bg-primary text-on-primary px-3 py-1.5 hover:brightness-110 transition-all disabled:opacity-50"
          >
            {isSaving ? 'Processing...' : 'Save Ritual Notes'}
          </button>
        )}
      </div>
      <textarea 
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Internal notes about style preferences, techniques, or profile details..."
        className="w-full bg-surface-container border border-outline-variant/10 p-4 font-body text-sm text-on-surface focus:border-primary/30 focus:outline-none transition-all min-h-[100px] resize-none"
      />
    </div>
  );
};

export default ClientsTab;
