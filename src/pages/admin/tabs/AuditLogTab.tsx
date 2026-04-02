import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldCheck, 
  History, 
  User as UserIcon, 
  Monitor, 
  Search,
  ArrowUpDown,
  Filter,
  RefreshCw,
  Clock,
  Mail,
  Smartphone
} from 'lucide-react';
import { LoginLog, getLoginLogs } from '../../../services/api';
import toast from 'react-hot-toast';

export default function AuditLogTab() {
  const [logs, setLogs] = useState<LoginLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'client'>('all');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const fetchedLogs = await getLoginLogs(500);
      setLogs(fetchedLogs);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs
    .filter(log => {
      const matchesSearch = 
        log.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.userId?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || log.role === roleFilter;
      
      return matchesSearch && matchesRole;
    })
    .sort((a, b) => {
      return sortOrder === 'newest' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp;
    });

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(new Date(timestamp));
  };

  const getDeviceIcon = (userAgent: string) => {
    if (/mobile/i.test(userAgent)) return <Smartphone size={14} />;
    return <Monitor size={14} />;
  };

  const getBriefUserAgent = (userAgent: string) => {
    if (/chrome/i.test(userAgent)) return 'Chrome';
    if (/safari/i.test(userAgent)) return 'Safari';
    if (/firefox/i.test(userAgent)) return 'Firefox';
    if (/edg/i.test(userAgent)) return 'Edge';
    return 'Other';
  };

  return (
    <div className="space-y-8">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-container/30 backdrop-blur-md p-6 border border-outline-variant/10 shadow-xl"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 flex items-center justify-center text-primary">
              <History size={24} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold">Total Logins</p>
              <p className="text-2xl font-headline font-bold text-on-surface">{logs.length}</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-surface-container/30 backdrop-blur-md p-6 border border-outline-variant/10 shadow-xl"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 flex items-center justify-center text-primary">
              <ShieldCheck size={24} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold">Admin Sessions</p>
              <p className="text-2xl font-headline font-bold text-on-surface">
                {logs.filter(l => l.role === 'admin').length}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-surface-container/30 backdrop-blur-md p-6 border border-outline-variant/10 shadow-xl"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 flex items-center justify-center text-primary">
              <UserIcon size={24} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold">Member Logins</p>
              <p className="text-2xl font-headline font-bold text-on-surface">
                {logs.filter(l => l.role === 'client').length}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col xl:flex-row gap-4 items-center justify-between bg-surface-container-lowest/50 p-4 border border-outline-variant/5">
        <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40" size={18} />
            <input 
              type="text"
              placeholder="Search by email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-surface-container p-3 pl-12 border border-outline-variant/20 focus:border-primary outline-none transition-all text-sm text-on-surface"
            />
          </div>

          <div className="flex items-center gap-2 bg-surface-container p-1 border border-outline-variant/20">
            <button 
              onClick={() => setRoleFilter('all')}
              className={`px-4 py-2 text-[10px] uppercase font-bold tracking-widest transition-all ${roleFilter === 'all' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
            >All</button>
            <button 
              onClick={() => setRoleFilter('admin')}
              className={`px-4 py-2 text-[10px] uppercase font-bold tracking-widest transition-all ${roleFilter === 'admin' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
            >Admins Only</button>
            <button 
              onClick={() => setRoleFilter('client')}
              className={`px-4 py-2 text-[10px] uppercase font-bold tracking-widest transition-all ${roleFilter === 'client' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
            >Members Only</button>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full xl:w-auto overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
            className="flex items-center gap-2 px-4 py-3 bg-surface-container border border-outline-variant/20 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:text-primary transition-all whitespace-nowrap"
          >
            <ArrowUpDown size={14} /> {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
          </button>
          
          <button 
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-3 bg-surface-container border border-outline-variant/20 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:text-primary transition-all whitespace-nowrap disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-surface-container-lowest/30 border border-outline-variant/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container/50 border-b border-outline-variant/10">
                <th className="px-6 py-5 text-[10px] uppercase tracking-[0.2em] font-black text-primary/70">identity</th>
                <th className="px-6 py-5 text-[10px] uppercase tracking-[0.2em] font-black text-primary/70 text-right">session details</th>
                <th className="px-6 py-5 text-[10px] uppercase tracking-[0.2em] font-black text-primary/70 text-right">date & time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={3} className="px-6 py-8 h-20">
                      <div className="h-4 bg-surface-container-high/40 rounded w-full"></div>
                    </td>
                  </tr>
                ))
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="group hover:bg-white/[0.02] transition-all">
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 flex items-center justify-center rounded-none border ${log.role === 'admin' ? 'border-primary/30 text-primary bg-primary/5' : 'border-outline-variant/20 text-on-surface-variant'}`}>
                          {log.role === 'admin' ? <ShieldCheck size={18} /> : <UserIcon size={18} />}
                        </div>
                        <div>
                          <p className="font-headline font-bold text-on-surface tracking-tight leading-none mb-1 uppercase text-xs">
                            {log.displayName || 'Unnamed Member'}
                          </p>
                          <div className="flex items-center gap-2 text-on-surface-variant/60 text-[10px] font-bold tracking-tight uppercase">
                            <Mail size={10} />
                            {log.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-right">
                       <div className="flex flex-col items-end gap-1.5">
                         <span className="flex items-center gap-2 text-on-surface font-body text-xs">
                            {getBriefUserAgent(log.userAgent)} {getDeviceIcon(log.userAgent)}
                         </span>
                         <span className="text-[10px] text-on-surface-variant/40 font-mono tracking-tighter max-w-[200px] truncate">
                           {log.userAgent}
                         </span>
                       </div>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-on-surface font-headline font-bold text-xs tabular-nums uppercase leading-none">
                          {formatDate(log.timestamp).split(',')[0]}
                        </span>
                        <span className="text-[10px] text-primary font-black uppercase tracking-widest flex items-center gap-2 justify-end mt-1">
                          <Clock size={10} strokeWidth={3} />
                          {formatDate(log.timestamp).split(',')[1]}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-24 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-surface-container rounded-full mb-6 text-on-surface-variant/20">
                      <History size={32} />
                    </div>
                    <p className="text-on-surface-variant font-headline uppercase text-xs tracking-widest font-black">No login events captured yet</p>
                    <p className="text-on-surface-variant/40 text-[10px] mt-2 tracking-wide">Login attempts will be logged automatically starting now.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
