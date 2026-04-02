import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { getServices, Service } from '../services/api';
import toast from 'react-hot-toast';

export default function Services() {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const svs = await getServices();
        setServices(svs);
      } catch (error) {
        toast.error("Failed to load services");
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  const handleBook = (id: string) => {
    navigate(`/book?serviceId=${id}`);
  };

  if (loading) return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-6">
      <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <div className="font-headline uppercase tracking-[0.4em] text-xs text-primary animate-pulse">Loading Services</div>
    </div>
  );

  return (
    <main className="pt-32 pb-24 px-6 max-w-6xl mx-auto min-h-screen">
      <section className="mb-24 relative">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
        <motion.div
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           className="relative z-10"
        >
          <span className="font-headline text-xs tracking-[0.4em] text-primary uppercase font-bold mb-4 block">Grooming Rituals</span>
          <h1 className="font-headline text-6xl md:text-9xl font-bold tracking-tighter text-on-surface uppercase leading-[0.8]">
            THE<br/>MENU
          </h1>
          <p className="text-on-surface-variant font-body mt-8 max-w-xl text-lg leading-relaxed">
            Curated grooming experiences designed for Ace Of Fades. Every service is a deliberate ritual of precision and style.
          </p>
        </motion.div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {services.map((service, index) => (
          <motion.div
            key={service.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group relative bg-surface-container/40 backdrop-blur-sm p-10 flex flex-col justify-between transition-all duration-700 hover:bg-surface-container-high border border-outline-variant/10 hover:border-primary/30 shadow-2xl"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-20 transition-opacity duration-700">
               <span className="font-headline text-8xl font-black uppercase select-none">{(index + 1).toString().padStart(2, '0')}</span>
            </div>

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-headline text-3xl font-bold tracking-tight uppercase text-on-surface">
                    {service.name}
                  </h3>
                  <div className="h-1 w-12 bg-primary mt-2 transition-all duration-500 group-hover:w-24"></div>
                </div>
                <span className="font-headline text-2xl text-primary font-bold">{service.price}</span>
              </div>
              
              <p className="text-on-surface-variant text-base leading-relaxed mb-10 max-w-md">
                {service.desc}
              </p>

              <div className="flex items-center gap-6 mb-12">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-outline font-bold mb-1">Duration</span>
                  <span className="font-headline text-sm uppercase tracking-widest text-on-surface">{service.duration} Minutes</span>
                </div>
                <div className="w-px h-8 bg-outline-variant/30"></div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-outline font-bold mb-1">Includes</span>
                  <span className="font-headline text-sm uppercase tracking-widest text-on-surface">Consultation</span>
                </div>
              </div>
            </div>

            <button 
              onClick={() => handleBook(service.id)}
              className="relative overflow-hidden gold-gradient group/btn py-5 px-8 text-on-primary font-headline text-xs font-black tracking-[0.3em] uppercase transition-all duration-500 active:scale-[0.98] shadow-lg"
            >
              <span className="relative z-10">Secure Appointment</span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500"></div>
            </button>
          </motion.div>
        ))}
      </div>

      <section className="mt-32 p-16 bg-surface-container-highest/30 backdrop-blur-md border border-outline-variant/10 text-center relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-1000"></div>
        <h2 className="font-headline text-4xl font-bold uppercase mb-6 tracking-tight relative z-10">Bespoke Grooming Package?</h2>
        <p className="text-on-surface-variant mb-10 max-w-2xl mx-auto text-lg leading-relaxed relative z-10">
          From wedding parties to private executive sessions, we offer tailored experiences beyond the standard menu. Let's craft your ritual.
        </p>
        <div className="relative z-10">
          <Link to="#" className="inline-block gold-gradient px-12 py-5 text-on-primary font-headline font-bold tracking-widest uppercase hover:brightness-110 transition-all">
            Inquire Privately
          </Link>
        </div>
      </section>
    </main>
  );
}
