import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  ChevronDown, 
  ShieldOff, 
  ShieldCheck, 
  Trash2,
  X
} from 'lucide-react';
import { Client } from '../../../services/api';

interface ClientsTabProps {
  clients: Client[];
  clientSearch: string;
  setClientSearch: (val: string) => void;
  clientStatusFilter: 'All' | 'Active' | 'Suspended';
  setClientStatusFilter: (val: 'All' | 'Active' | 'Suspended') => void;
  clientTypeFilter: 'All' | 'Registered' | 'Guest';
  setClientTypeFilter: (val: 'All' | 'Registered' | 'Guest') => void;
  clientSortOrder: 'newest' | 'oldest' | 'az' | 'za';
  setClientSortOrder: (val: 'newest' | 'oldest' | 'az' | 'za') => void;
  onSuspendClient: (client: Client, currentlySuspended: boolean) => void;
  onDeleteClient: (uid: string) => void;
}

const ClientsTab: React.FC<ClientsTabProps> = ({
  clients,
  clientSearch,
  setClientSearch,
  clientStatusFilter,
  setClientStatusFilter,
  clientTypeFilter,
  setClientTypeFilter,
  clientSortOrder,
  setClientSortOrder,
  onSuspendClient,
  onDeleteClient
}) => {
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
              placeholder="Search clients..."
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
                <th className="p-6 font-headline uppercase text-[10px] tracking-widest">Client</th>
                <th className="p-6 font-headline uppercase text-[10px] tracking-widest text-center">No-Shows</th>
                <th className="p-6 font-headline uppercase text-[10px] tracking-widest text-center">Type</th>
                <th className="p-6 font-headline uppercase text-[10px] tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {filteredClients.map((client) => (
                <tr key={client.uid} className={`hover:bg-surface-container-highest/50 transition-colors ${client.suspended ? 'opacity-50' : ''}`}>
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-headline text-lg font-bold ${client.suspended ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'}`}>
                        {client.displayName?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-headline font-bold uppercase flex items-center gap-2">
                          {client.displayName}
                          {client.suspended && <span className="bg-red-500 text-white text-[8px] px-1 rounded">SUSPENDED</span>}
                        </div>
                        <div className="font-body text-xs text-on-surface-variant">{client.email}</div>
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
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => onSuspendClient(client, !!client.suspended)}
                        className={`p-2 rounded transition-colors ${client.suspended ? 'text-green-500 hover:bg-green-500/10' : 'text-yellow-500 hover:bg-yellow-500/10'}`}
                        title={client.suspended ? "Unsuspend Client" : "Suspend Client"}
                      >
                        {client.suspended ? <ShieldCheck size={18} /> : <ShieldOff size={18} />}
                      </button>
                      <button 
                        onClick={() => onDeleteClient(client.uid)}
                        className="p-2 text-red-400 hover:bg-red-500/10 hover:text-red-500 rounded transition-colors"
                        title="Delete Client"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default ClientsTab;
