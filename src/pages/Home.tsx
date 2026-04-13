import { motion } from 'motion/react';
import { Calendar, Scissors, MapPin, Verified, Star, Phone, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getBusinessSettings, BusinessSettings, isShopOpen, getBlockedRanges, DayHours, getServices, Service } from '../services/api';

const reviews = [
  {
    id: 1,
    name: 'Barry S.',
    date: 'Nov 2024',
    rating: 5,
    comment: 'Great state of the art facility. Mo is excellent at his craft — highly recommend setting an appointment. Been going to Mo for years and you won\'t be disappointed!',
  },
  {
    id: 2,
    name: 'Dylan A.',
    date: 'Apr 2022',
    rating: 5,
    comment: 'Yo, if you ever need a great fade, shape up, and a good vibe, you gotta go to Ace of Fades. Mo is professional, friendly, and the best in the business.',
  },
  {
    id: 3,
    name: 'Kevin D.',
    date: 'Apr 2022',
    rating: 5,
    comment: 'Never had a more professional & easy-going haircut in my life. Superb business. True master at his craft.',
  },
];

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} size={14} className="text-primary fill-primary" />
      ))}
    </div>
  );
}

export default function Home() {
  const [services, setServices] = useState<Service[]>([]);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [shopStatus, setShopStatus] = useState<{ isOpen: boolean; message: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [settingsData, rangesData, servicesData] = await Promise.all([
          getBusinessSettings(),
          getBlockedRanges(),
          getServices()
        ]);
        setSettings(settingsData);
        setShopStatus(isShopOpen(settingsData, rangesData));
        // Filter out hidden services and take the first 4
        setServices(servicesData.filter(s => !s.isHidden).slice(0, 4));
      } catch (error) {
        console.error("Data fetch error", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <main className="pt-16">
      {/* Hero Section */}
      <section id="hero" className="relative h-[80vh] flex items-end px-6 pb-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            className="w-full h-full object-cover opacity-70 scale-105"
            src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1920&q=90&auto=format"
            alt="Luxury Barbershop Interior"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent"></div>
        </div>
        <div className="relative z-10 w-full max-w-4xl mx-auto">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-headline text-primary tracking-[0.3em] text-xs font-bold mb-4 uppercase"
          >
            Ace Of Fades · Est. 2022 · Eatontown, NJ
          </motion.p>
          
          {shopStatus && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-3 mb-6"
            >
              <span className={`w-2 h-2 rounded-full animate-pulse ${shopStatus.isOpen ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span className="font-headline text-[10px] tracking-[0.2em] uppercase font-bold text-on-surface/80">
                {shopStatus.message}
              </span>
            </motion.div>
          )}

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-headline text-6xl md:text-8xl font-bold leading-[0.9] tracking-tighter text-on-surface mb-8 uppercase"
          >
            ACE<br/>OF<br/>FADES
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Link to={services.length > 0 ? `/book?serviceId=${services[0].id}` : '/services'} className="gold-gradient inline-block px-12 py-5 text-on-primary font-headline font-bold tracking-widest uppercase active:scale-[0.98] transition-transform">
              Book Appointment
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Services Preview */}
      <section id="services-preview" className="px-6 py-24 bg-surface-container-lowest">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-end mb-16">
            <div>
              <span className="font-headline text-outline-variant text-4xl font-black opacity-20 select-none">01</span>
              <h3 className="font-headline text-4xl font-bold tracking-tight uppercase">Services</h3>
            </div>
            <Link to="/services" className="font-body text-primary text-xs tracking-widest uppercase border-b border-primary pb-1 hover:text-primary-fixed transition-colors">
              View Full Menu
            </Link>
          </div>
          
          {loading ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {services.map((service, index) => (
                <Link 
                  key={service.id} 
                  to={`/book?serviceId=${service.id}`}
                  className="group relative bg-surface-container p-8 flex justify-between items-center transition-all hover:bg-surface-container-high border-l-2 border-transparent hover:border-primary active:scale-[0.99] cursor-pointer"
                >
                  <span className="absolute -left-2 text-7xl font-headline font-black text-outline-variant/10 pointer-events-none group-hover:opacity-20 transition-opacity">{(index + 1).toString().padStart(2, '0')}</span>
                  <div className="relative z-10 pr-4">
                    <h4 className="font-headline text-xl font-bold tracking-tight uppercase text-on-surface group-hover:text-primary transition-colors">{service.name}</h4>
                    <p className="text-on-surface-variant text-sm mt-1">{service.desc}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="font-headline text-primary font-bold text-2xl">{service.price}</span>
                    <span className="text-[10px] tracking-widest uppercase text-outline font-black group-hover:text-primary transition-colors">Select Ritual</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="bg-surface py-24 px-6 overflow-hidden">
        <div className="max-w-4xl mx-auto relative">
          <div className="absolute -top-10 -right-10 opacity-5 pointer-events-none">
            <span className="font-headline text-[180px] font-black uppercase text-on-surface">MO</span>
          </div>
          <div className="mb-16">
            <span className="font-headline text-outline-variant text-4xl font-black opacity-20 select-none">02</span>
            <h3 className="font-headline text-4xl font-bold tracking-tight uppercase">The Artisan</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="aspect-[4/5] bg-surface-container-low overflow-hidden">
              <img
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDl2JDm-1yyljKFPVgcB57Mu3kWfM5HY3chvC0ob5XS8wV3Ij6IjPsL2zNE8O0HIxA4vrl3pXEQfx_mToBppxmdMIm0CPUsM-W0Rn04QOK9iLlmB8svpyEOI6kT1ejELaGcWGVmRu3ddCyRhQblCI79-bTCpPR9JTpBCKbueIOgcmnaXKsFwbYl1HEiHcrApjEQs1xukkrt_OTiRDlt7Tp26HoG1VR3D7eSpp6L-vPI2OPGVITBlub3IDEXf2BQNypO4eBHsxJ7xYE"
                alt="Mo the Barber"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="space-y-8">
              <h4 className="font-headline text-5xl font-bold tracking-tighter uppercase leading-none">Mo the Barber</h4>
              <p className="text-on-surface-variant text-lg leading-relaxed font-light">
                Since 2009, Mesut "MO" Ozelmas has been masterfully blending technique with style. Specializing in fades, clipper over comb, hot towel shaves, hair designs, children's haircuts, shear cuts, beards, and eyebrows — every detail is deliberate.
              </p>
              
              <div className="space-y-4">
                <p className="text-on-surface-variant text-sm leading-relaxed italic border-l-2 border-primary pl-4">
                  "I look forward to seeing you!"
                  <span className="block mt-1 not-italic font-headline text-primary text-xs tracking-widest uppercase">— Owner, Mesut "MO" Ozelmas</span>
                </p>
                
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-4">
                    <MapPin className="text-primary" size={20} />
                    <div className="flex flex-col">
                      <span className="font-headline text-xs tracking-widest uppercase font-bold text-on-surface">Ace of Fades · Est. 2022</span>
                      <span className="text-on-surface-variant text-sm leading-tight">315 Rt 35 Eatontown NJ Suite 112 <br/> (Inside Haven Salon Studios)</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="text-primary" size={18} />
                <a href="tel:7325972374" className="font-headline text-sm tracking-widest uppercase text-on-surface-variant hover:text-primary transition-colors">
                  732-597-2374
                </a>
              </div>
              <div className="pt-4 flex flex-wrap gap-x-6 gap-y-3">
                {['WiFi', 'Beer & Wine', 'TV', 'Kid Friendly'].map((amenity) => (
                  <span key={amenity} className="text-[10px] tracking-widest uppercase text-outline flex items-center gap-2">
                    <span className="w-1 h-1 bg-primary rounded-full"></span>
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lookbook Section */}
      <section id="lookbook" className="bg-surface py-24 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
            <div>
              <span className="font-headline text-outline-variant text-4xl font-black opacity-20 select-none">03</span>
              <h3 className="font-headline text-4xl md:text-6xl font-bold tracking-tight uppercase">The Lookbook</h3>
              <p className="text-on-surface-variant font-body mt-4 max-w-md">Precision meets contemporary style. A curated selection of our signature grooming work.</p>
            </div>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
               <div className="h-px w-20 bg-primary/30 hidden md:block"></div>
               <span className="font-headline text-xs tracking-[0.3em] uppercase text-primary font-bold">Curated Styles · 2024</span>
               <a 
                 href="https://www.instagram.com/aceoffadesbarberstudionj/?hl=en" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="flex items-center gap-2 px-6 py-2 border border-primary/20 text-primary hover:bg-primary hover:text-on-primary transition-all duration-500 font-headline text-[10px] uppercase tracking-widest font-black"
               >
                 Explore Full Gallery
               </a>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="group relative aspect-[3/4] overflow-hidden bg-surface-container"
            >
              <img src="/images/lookbook-1.png" alt="Signature Skin Fade" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-surface/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-8">
                <p className="font-headline text-xs tracking-widest text-primary uppercase font-bold mb-2">Technique</p>
                <h4 className="font-headline text-2xl font-bold uppercase text-on-surface">Signature Skin Fade</h4>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="group relative aspect-[3/4] overflow-hidden bg-surface-container md:translate-y-12"
            >
              <img src="/images/lookbook-2.png" alt="Modern Beard Sculpting" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-surface/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-8">
                <p className="font-headline text-xs tracking-widest text-primary uppercase font-bold mb-2">Precision</p>
                <h4 className="font-headline text-2xl font-bold uppercase text-on-surface">Beard Sculpting</h4>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="group relative aspect-[3/4] overflow-hidden bg-surface-container"
            >
              <img src="/images/lookbook-3.png" alt="Classic Scissor Work" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-surface/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-8">
                <p className="font-headline text-xs tracking-widest text-primary uppercase font-bold mb-2">Artisan</p>
                <h4 className="font-headline text-2xl font-bold uppercase text-on-surface">Master Shear Work</h4>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section id="reviews" className="bg-surface-container-lowest py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-end mb-16">
            <div>
              <span className="font-headline text-outline-variant text-4xl font-black opacity-20 select-none">04</span>
              <h3 className="font-headline text-4xl font-bold tracking-tight uppercase">Client Voices</h3>
            </div>
            <div className="flex items-center gap-2">
              <StarRating count={5} />
              <span className="font-headline text-xs tracking-widest text-on-surface-variant uppercase">All 5-Star Reviews</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map((review, i) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-surface-container p-8 border-t-2 border-primary/30 hover:border-primary transition-all duration-500 hover:-translate-y-2 group"
              >
                <div className="mb-6 opacity-40 group-hover:opacity-100 transition-opacity">
                  <StarRating count={review.rating} />
                </div>
                <p className="text-on-surface-variant text-sm leading-relaxed mb-8 italic relative">
                  <span className="absolute -top-4 -left-2 text-4xl font-serif text-primary/10">"</span>
                  {review.comment}
                </p>
                <div className="flex justify-between items-center border-t border-outline-variant/10 pt-6">
                  <span className="font-headline font-bold text-xs uppercase tracking-widest text-on-surface">{review.name}</span>
                  <span className="text-[10px] text-outline tracking-widest uppercase font-bold">{review.date}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Location & Hours */}
      <section id="location" className="bg-surface-container-low py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-16">
            <span className="font-headline text-outline-variant text-4xl font-black opacity-20 select-none">04</span>
            <h3 className="font-headline text-4xl font-bold tracking-tight uppercase">Ace Of Fades Access</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="aspect-video bg-surface overflow-hidden relative group">
              <img
                className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-1000"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCdPmnGIuugYPpCElSeHeqAFkF-n8gzVhUlk8vGn_DTvUsiiuHq2hiLKGJb53QG4kTE1dB8vi0c3okefwIeva31QL27dsd89IzVf_-UloM8M6ARLhTnkgEzuKmwiPctEhNVTr1-r9CsKYEQ50IcOztuZBV7j8L7jjXbLFXjen1tVXdaXuPXdWe8UH8aIMyFh4adu0Gcm4oaLwMdRxaYxENpzxze6iPlyMO29QxaMbCsJxcuXZXjxjabN_gviAfSHcsB6Y2r2PQF5U4"
                alt="Map – Eatontown NJ"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-primary flex items-center justify-center animate-pulse">
                  <MapPin className="text-on-primary" size={24} />
                </div>
              </div>
              <div className="absolute bottom-4 left-4 glass-panel px-6 py-3 border-l-4 border-primary">
                <p className="font-headline text-xs tracking-widest text-primary font-bold uppercase">Eatontown, NJ</p>
                <p className="text-sm text-on-surface mt-1 uppercase">315 Rt 35, Suite 112</p>
                <p className="text-xs text-on-surface-variant mt-0.5">Inside Haven Salon Studios</p>
              </div>
            </div>
            <div className="bg-surface-container p-10 space-y-6">
              <h5 className="font-headline text-sm tracking-[0.3em] uppercase text-outline mb-8">Business Hours</h5>
              
              {settings ? (
                Object.entries(settings.weeklyHours).map(([day, hoursData]) => {
                  const hours = hoursData as DayHours;
                  return (
                    <div key={day} className="flex justify-between border-b border-outline-variant/20 pb-3">
                      <span className="text-on-surface-variant uppercase text-sm">{day}</span>
                      <span className={`font-headline font-bold text-sm uppercase ${hours.closed ? 'text-primary opacity-50' : 'text-on-surface'}`}>
                        {hours.closed ? 'Closed' : `${hours.open} — ${hours.close}`}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="space-y-6">
                  {/* Fallback skeleton or default view if needed */}
                  <div className="h-4 bg-outline-variant/10 animate-pulse w-full"></div>
                  <div className="h-4 bg-outline-variant/10 animate-pulse w-full"></div>
                  <div className="h-4 bg-outline-variant/10 animate-pulse w-full"></div>
                </div>
              )}

              <div className="pt-4 space-y-2">
                <p className="text-xs text-outline uppercase tracking-widest font-headline">Important Notice</p>
                <p className="text-on-surface-variant text-xs leading-relaxed">
                  Clients arriving more than 5 minutes late will be considered a no-show. Please arrive 5–10 minutes before your appointment.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
