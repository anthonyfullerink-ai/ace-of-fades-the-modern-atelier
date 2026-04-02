import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Mail, 
  Phone, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  ChevronDown,
  Tag
} from 'lucide-react';
import { Inquiry } from '../../../services/api';

interface InquiriesTabProps {
  inquiries: Inquiry[];
  loading: boolean;
}

const InquiriesTab: React.FC<InquiriesTabProps> = ({ inquiries, loading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'pending' | 'reviewed' | 'responded'>('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredInquiries = useMemo(() => {
    return inquiries.filter(inquiry => {
      const matchesSearch = 
        inquiry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inquiry.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inquiry.eventType.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'All' || inquiry.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [inquiries, searchTerm, statusFilter]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-outline">Loading Inquiries...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="font-headline text-3xl font-bold uppercase tracking-tighter text-on-surface">Bespoke Inquiries</h2>
          <p className="text-outline text-xs mt-1">Manage private event requests and executive packages</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative group">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors" />
            <input 
              type="text"
              placeholder="Search inquiries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-surface-container border border-outline-variant/20 py-3 pl-12 pr-6 text-sm text-on-surface focus:outline-none focus:border-primary/50 transition-all w-full md:w-64"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-surface-container border border-outline-variant/20 py-3 pl-12 pr-10 text-sm text-on-surface focus:outline-none focus:border-primary/50 transition-all appearance-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="responded">Responded</option>
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Inquiry List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredInquiries.length === 0 ? (
          <div className="bg-surface-container/30 border border-dashed border-outline-variant/30 rounded-lg p-20 text-center">
            <MessageSquare size={48} className="mx-auto text-outline/30 mb-4" />
            <p className="text-on-surface-variant font-medium">No inquiries found matching your criteria</p>
          </div>
        ) : (
          filteredInquiries.map((inquiry) => (
            <div 
              key={inquiry.id}
              className={`bg-surface-container border transition-all duration-300 overflow-hidden ${
                expandedId === inquiry.id 
                  ? 'border-primary/50 ring-1 ring-primary/20' 
                  : 'border-outline-variant/10 hover:border-outline-variant/30'
              }`}
            >
              {/* Summary View */}
              <div 
                className="p-6 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-6"
                onClick={() => setExpandedId(expandedId === inquiry.id ? null : inquiry.id!)}
              >
                <div className="flex items-center gap-6">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                    inquiry.status === 'pending' ? 'bg-primary/10 text-primary' :
                    inquiry.status === 'reviewed' ? 'bg-blue-500/10 text-blue-400' :
                    'bg-green-500/10 text-green-400'
                  }`}>
                    {inquiry.status === 'pending' ? <Clock size={20} /> :
                     inquiry.status === 'reviewed' ? <CheckCircle2 size={20} /> :
                     <CheckCircle2 size={20} className="fill-current" />}
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-headline font-bold text-lg text-on-surface">{inquiry.name}</h3>
                      <span className={`text-[8px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full ${
                        inquiry.status === 'pending' ? 'bg-primary/10 text-primary border border-primary/20' :
                        inquiry.status === 'reviewed' ? 'bg-blue-500/10 text-blue-400 border border-blue-400/20' :
                        'bg-green-500/10 text-green-400 border border-green-400/20'
                      }`}>
                        {inquiry.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-on-surface-variant">
                      <span className="flex items-center gap-1.5"><Tag size={12} className="text-primary" /> {inquiry.eventType}</span>
                      <span className="flex items-center gap-1.5"><Calendar size={12} className="text-primary" /> {inquiry.eventDate}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8 text-xs text-outline">
                  <div className="hidden lg:block text-right">
                    <p className="font-bold text-on-surface">Received</p>
                    <p>{new Date(inquiry.createdAt).toLocaleDateString()}</p>
                  </div>
                  <ChevronDown className={`transition-transform duration-300 ${expandedId === inquiry.id ? 'rotate-180 text-primary' : ''}`} size={20} />
                </div>
              </div>

              {/* Detailed View */}
              <AnimatePresence>
                {expandedId === inquiry.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-outline-variant/10 bg-surface-container-high/30"
                  >
                    <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-12">
                      {/* Left: Contact Info */}
                      <div className="space-y-6">
                        <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary">Contact Details</h4>
                        <div className="space-y-4">
                          <a href={`mailto:${inquiry.email}`} className="flex items-center gap-3 text-sm text-on-surface hover:text-primary transition-colors group">
                            <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                              <Mail size={14} />
                            </div>
                            {inquiry.email}
                          </a>
                          <a href={`tel:${inquiry.phoneNumber}`} className="flex items-center gap-3 text-sm text-on-surface hover:text-primary transition-colors group">
                            <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                              <Phone size={14} />
                            </div>
                            {inquiry.phoneNumber}
                          </a>
                        </div>
                      </div>

                      {/* Center: Message */}
                      <div className="lg:col-span-2 space-y-4">
                        <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary">Requirement Description</h4>
                        <div className="bg-surface p-6 rounded-sm border border-outline-variant/5 text-sm leading-relaxed text-on-surface-variant">
                          {inquiry.description}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 mt-8">
                          <button className="gold-gradient px-6 py-3 text-on-primary text-[10px] uppercase font-bold tracking-widest hover:brightness-110 active:scale-95 transition-all">
                            Mark as Responded
                          </button>
                          <button className="border border-outline-variant/30 px-6 py-3 text-on-surface text-[10px] uppercase font-bold tracking-widest hover:bg-white/5 transition-all flex items-center gap-2">
                            Send Email <ExternalLink size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
};

export default InquiriesTab;
