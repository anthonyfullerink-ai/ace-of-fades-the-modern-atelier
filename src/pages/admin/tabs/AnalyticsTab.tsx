import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  DollarSign, 
  BarChart3, 
  ArrowUpRight, 
  ArrowDownRight,
  Activity,
  UserCheck,
  UserMinus,
  Briefcase
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  BarChart, 
  Bar, 
  Cell, 
  PieChart, 
  Pie 
} from 'recharts';
import { Booking, Client, Service, getTrafficStats, DailyStats } from '../../../services/api';

interface AnalyticsTabProps {
  bookings: Booking[];
  clients: Client[];
  services: Service[];
}

const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ bookings, clients, services }) => {
  // --- Data Calculations ---

  const [rawTrafficData, setRawTrafficData] = useState<DailyStats[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      const data = await getTrafficStats(7);
      setRawTrafficData(data);
    };
    fetchStats();
  }, []);

  // 1. Revenue & Booking Stats
  const stats = useMemo(() => {
    const completedBookings = bookings.filter(b => b.status === 'Completed');
    const cancelledBookings = bookings.filter(b => b.status === 'Cancelled');
    
    // Estimate revenue based on completed bookings and service prices
    const totalRevenue = completedBookings.reduce((acc, b) => {
      const service = services.find(s => s.id === b.serviceId);
      const price = service ? parseFloat(service.price.replace(/[^0-9.]/g, '')) : 0;
      return acc + price;
    }, 0);

    const totalVisits = rawTrafficData.reduce((acc, d) => acc + d.visits, 0);
    const conversionRate = totalVisits > 0 
      ? ((bookings.length / totalVisits) * 100).toFixed(1) 
      : '0';

    return {
      revenue: totalRevenue,
      total: bookings.length,
      completed: completedBookings.length,
      cancelled: cancelledBookings.length,
      conversion: conversionRate
    };
  }, [bookings, services, rawTrafficData]);

  // 2. Traffic Area Chart Data (Real data)
  const trafficData = useMemo(() => {
    return rawTrafficData.map(d => ({
      name: new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }),
      visits: d.visits,
      bookings: d.bookings || 0,
    }));
  }, [rawTrafficData]);

  // 3. Service Popularity (Real data)
  const servicePopularity = useMemo(() => {
    const counts: Record<string, number> = {};
    bookings.forEach(b => {
      const service = services.find(s => s.id === b.serviceId);
      const name = service ? service.name : 'Unknown';
      counts[name] = (counts[name] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [bookings, services]);

  // 4. Demographics (Registered vs Guests)
  const clientTypeData = useMemo(() => {
    const registered = clients.filter(c => !c.isGuest).length;
    const guests = clients.filter(c => c.isGuest).length;
    return [
      { name: 'Registered', value: registered, color: '#f2ca50' },
      { name: 'Guests', value: guests, color: '#a3a3a3' }
    ];
  }, [clients]);

  // 5. Booking Heatmap (By day of week and hour)
  const heatMapData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const hours = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
    
    // Create a 2D map: dayIndex -> hour -> count
    const map: number[][] = Array(7).fill(0).map(() => Array(hours.length).fill(0));

    bookings.forEach(b => {
      const date = new Date(b.date);
      const day = date.getDay();
      
      // Simple hour matching
      const time = b.time.split(' ')[0]; // Convert HH:MM AM/PM to HH:MM if needed, but b.time is "09:00 AM" etc.
      // Actually b.time is "09:00 AM" depending on how it's stored. 
      // Let's find the hour index.
      const hourPart = b.time.split(':')[0];
      const amPm = b.time.toLowerCase().includes('pm') ? 'PM' : 'AM';
      let hour24 = parseInt(hourPart);
      if (amPm === 'PM' && hour24 !== 12) hour24 += 12;
      if (amPm === 'AM' && hour24 === 12) hour24 = 0;

      const hourIndex = hour24 - 9; // Range 9am - 6pm (index 0 to 9)
      if (hourIndex >= 0 && hourIndex < hours.length) {
        map[day][hourIndex]++;
      }
    });

    return { days, hours, data: map };
  }, [bookings]);

  const COLORS = ['#f2ca50', '#c8a43d', '#9e812b', '#755f1a', '#4d3d0a'];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="space-y-8"
    >
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-surface-container p-6 border border-outline-variant/10 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-primary/10 text-primary">
              <DollarSign size={24} />
            </div>
            <div className="flex items-center gap-1 text-success text-xs font-bold bg-success/10 px-2 py-1 rounded-full">
              <ArrowUpRight size={14} /> +12.5%
            </div>
          </div>
          <p className="text-[10px] uppercase tracking-widest text-outline mb-1 font-bold">Est. Monthly Revenue</p>
          <h3 className="font-headline text-3xl font-bold text-on-surface">${stats.revenue.toLocaleString()}</h3>
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/10 transition-colors"></div>
        </div>

        <div className="bg-surface-container p-6 border border-outline-variant/10 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-secondary/10 text-secondary">
              <Activity size={24} />
            </div>
            <div className="flex items-center gap-1 text-success text-xs font-bold bg-success/10 px-2 py-1 rounded-full">
              <TrendingUp size={14} /> +8.2%
            </div>
          </div>
          <p className="text-[10px] uppercase tracking-widest text-outline mb-1 font-bold">Total Appointments</p>
          <h3 className="font-headline text-3xl font-bold text-on-surface">{stats.total}</h3>
          <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-secondary/10 transition-colors"></div>
        </div>

        <div className="bg-surface-container p-6 border border-outline-variant/10 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-tertiary/10 text-tertiary">
              <Users size={24} />
            </div>
            <div className="flex items-center gap-1 text-success text-xs font-bold bg-success/10 px-2 py-1 rounded-full">
              <UserCheck size={14} /> 94%
            </div>
          </div>
          <p className="text-[10px] uppercase tracking-widest text-outline mb-1 font-bold">Client Satisfaction</p>
          <h3 className="font-headline text-3xl font-bold text-on-surface">{stats.conversion}%</h3>
          <div className="absolute top-0 right-0 w-32 h-32 bg-tertiary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-tertiary/10 transition-colors"></div>
        </div>

        <div className="bg-surface-container p-6 border border-outline-variant/10 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-error/10 text-error">
              <UserMinus size={24} />
            </div>
            <div className="flex items-center gap-1 text-error text-xs font-bold bg-error/10 px-2 py-1 rounded-full">
              <ArrowDownRight size={14} /> -2.1%
            </div>
          </div>
          <p className="text-[10px] uppercase tracking-widest text-outline mb-1 font-bold">Cancellation Rate</p>
          <h3 className="font-headline text-3xl font-bold text-on-surface">
            {bookings.length > 0 ? ((stats.cancelled / bookings.length) * 100).toFixed(1) : 0}%
          </h3>
          <div className="absolute top-0 right-0 w-32 h-32 bg-error/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-error/10 transition-colors"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Traffic Chart */}
        <div className="lg:col-span-2 bg-surface-container p-8 border border-outline-variant/10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h4 className="font-headline text-xl font-bold mb-1">Website Traffic & Conversions</h4>
              <p className="text-xs text-on-surface-variant font-medium">Daily visitor trends over the last week</p>
            </div>
            <BarChart3 className="text-primary opacity-50" size={20} />
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficData}>
                <defs>
                  <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f2ca50" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f2ca50" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '0' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="visits" stroke="#f2ca50" strokeWidth={2} fillOpacity={1} fill="url(#colorVisits)" />
                <Area type="monotone" dataKey="bookings" stroke="#a3a3a3" strokeWidth={2} fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Client Demographics */}
        <div className="bg-surface-container p-8 border border-outline-variant/10">
          <h4 className="font-headline text-xl font-bold mb-8 text-center italic">Client Community</h4>
          <div className="h-[250px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={clientTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {clientTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                  itemStyle={{ fontSize: '12px', color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <p className="text-[10px] uppercase text-outline font-bold">Total</p>
              <p className="text-2xl font-bold">{clients.length}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-8">
            {clientTypeData.map((item, i) => (
              <div key={i} className="flex flex-col items-center p-3 bg-surface-container-lowest border border-outline-variant/10">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-outline">{item.name}</span>
                </div>
                <span className="text-lg font-bold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Services */}
        <div className="bg-surface-container p-8 border border-outline-variant/10">
          <div className="flex items-center gap-3 mb-8">
            <Briefcase className="text-primary" size={20} />
            <h4 className="font-headline text-xl font-bold">Top Performing Rituals</h4>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={servicePopularity} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#333" />
                <XAxis type="number" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="#fff" fontSize={10} width={120} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {servicePopularity.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Heat Map Style - Booking Hotspots */}
        <div className="bg-surface-container p-8 border border-outline-variant/10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Calendar className="text-primary" size={20} />
              <h4 className="font-headline text-xl font-bold">Booking Hotspots</h4>
            </div>
            <div className="flex items-center gap-2 bg-surface-container-lowest px-3 py-1 text-[10px] font-bold uppercase tracking-widest border border-outline-variant/10">
              <div className="w-2 h-2 bg-primary/20"></div>
              <span>Low</span>
              <div className="w-2 h-2 bg-primary"></div>
              <span>Peak</span>
            </div>
          </div>
          
          <div className="grid grid-cols-11 gap-1">
            <div className="col-span-1"></div>
            {heatMapData.hours.map((h, i) => (
              <div key={i} className="text-[9px] text-center text-outline font-bold uppercase rotate-45 h-8 flex items-end justify-center mb-2">
                {h.split(' ')[0]}
              </div>
            ))}

            {heatMapData.days.map((day, dayIdx) => (
              <React.Fragment key={day}>
                <div className="text-[10px] text-left text-on-surface font-bold uppercase flex items-center pr-2">
                  {day}
                </div>
                {heatMapData.hours.map((_, hrIdx) => {
                  const count = heatMapData.data[dayIdx][hrIdx];
                  const intensity = Math.min(count * 20 + 5, 90);
                  return (
                    <motion.div 
                      key={`${dayIdx}-${hrIdx}`}
                      whileHover={{ scale: 1.1, zIndex: 10 }}
                      className="aspect-square bg-primary transition-colors cursor-help"
                      style={{ 
                        opacity: count === 0 ? 0.05 : intensity / 100,
                        backgroundColor: count === 0 ? '#666' : '#f2ca50'
                      }}
                      title={`${day}: ${heatMapData.hours[hrIdx]} - ${count} Bookings`}
                    />
                  );
                })}
              </React.Fragment>
            ))}
          </div>
          <p className="mt-8 text-[10px] text-on-surface-variant italic text-center font-medium">Insights are based on current database appointments and historical ritual demand.</p>
        </div>
      </div>
    </motion.div>
  );
};

export default AnalyticsTab;
