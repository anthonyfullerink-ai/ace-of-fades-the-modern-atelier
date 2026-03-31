import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { SERVICES } from '../data/services';

export default function Services() {
  const navigate = useNavigate();

  const handleBook = (id: string) => {
    navigate(`/book?serviceId=${id}`);
  };

  return (
    <main className="pt-32 pb-24 px-6 max-w-5xl mx-auto">
      <section className="mb-20">
        <motion.h1 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="font-headline text-5xl md:text-8xl font-bold tracking-tighter text-primary uppercase"
        >
          SERVICES
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="text-on-surface-variant font-body mt-4 max-w-lg text-lg"
        >
          Curated grooming rituals designed for the modern gentleman. Precision requires preparation.
        </motion.p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {SERVICES.map((service, index) => (
          <motion.div
            key={service.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group relative bg-surface-container p-8 flex flex-col justify-between transition-all duration-500 hover:bg-surface-container-high border-l-4 border-transparent hover:border-primary"
          >
            <span className="absolute right-8 top-4 text-6xl font-headline font-black text-outline-variant/10 pointer-events-none group-hover:opacity-20 transition-opacity">
              {service.id}
            </span>
            <div className="mb-8">
              <h3 className="font-headline text-2xl font-bold tracking-tight uppercase text-on-surface mb-2">
                {service.name}
              </h3>
              <p className="text-on-surface-variant text-sm leading-relaxed mb-4">
                {service.desc}
              </p>
              <div className="flex items-center gap-4 text-[10px] tracking-widest uppercase text-outline">
                <span>{service.duration} min</span>
                <span className="w-1 h-1 bg-outline-variant rounded-full"></span>
                <span className="text-primary font-bold">{service.price}</span>
              </div>
            </div>
            <button 
              onClick={() => handleBook(service.id)}
              className="border border-outline-variant hover:border-primary text-primary font-headline text-xs tracking-widest py-4 px-6 transition-all duration-300 uppercase w-full"
            >
              Book Service
            </button>
          </motion.div>
        ))}
      </div>

      <section className="mt-24 p-12 bg-surface-container-high text-center">
        <h2 className="font-headline text-3xl font-bold uppercase mb-6">Need a custom package?</h2>
        <p className="text-on-surface-variant mb-8 max-w-xl mx-auto">
          We offer tailored grooming experiences for weddings, events, and private sessions. Contact us to discuss your requirements.
        </p>
        <Link to="#" className="text-primary font-headline text-sm tracking-[0.2em] uppercase border-b-2 border-primary pb-1 hover:text-primary-fixed transition-colors">
          Inquire Now
        </Link>
      </section>
    </main>
  );
}
