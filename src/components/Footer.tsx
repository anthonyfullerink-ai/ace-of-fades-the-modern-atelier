import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getBusinessSettings, BusinessSettings, WEEKDAY_ORDER, formatTimeStr } from '../services/api';
import { Instagram, Facebook, MapPin, Phone } from 'lucide-react';

export default function Footer() {
  const [settings, setSettings] = useState<BusinessSettings | null>(null);

  useEffect(() => {
    getBusinessSettings().then(setSettings).catch(console.error);
  }, []);

  return (
    <footer id="footer" className="bg-surface-container-lowest w-full pt-32 pb-16 flex flex-col items-center px-8 border-t border-outline-variant/10 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
      
      <div className="max-w-7xl w-full grid grid-cols-1 md:grid-cols-3 gap-20 mb-24">
        {/* Brand Column */}
        <div className="flex flex-col items-center md:items-start gap-8">
          <img src="/logo.png" alt="Ace of Fades Logo" className="h-14 w-auto object-contain brightness-0 invert opacity-100" />
          <p className="font-body text-sm text-on-surface-variant max-w-xs leading-relaxed text-center md:text-left opacity-80 italic tracking-wide">
            Precision grooming for the modern gentleman. Elevating the art of the fade in an exclusive, high-end Ace Of Fades setting.
          </p>
          <div className="flex gap-4">
            <a href="#" className="w-10 h-10 rounded-full border border-outline-variant/20 flex items-center justify-center hover:bg-primary hover:border-primary transition-all duration-500 group">
              <Instagram size={18} className="text-on-surface-variant group-hover:text-on-primary transition-colors" />
            </a>
            <a href="#" className="w-10 h-10 rounded-full border border-outline-variant/20 flex items-center justify-center hover:bg-primary hover:border-primary transition-all duration-500 group">
              <Facebook size={18} className="text-on-surface-variant group-hover:text-on-primary transition-colors" />
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div className="flex flex-col items-center md:items-start gap-8">
           <h4 className="font-headline text-primary text-[10px] tracking-[0.5em] uppercase font-black">Experience</h4>
           <nav className="flex flex-col items-center md:items-start gap-4">
             <Link to="/services" className="font-headline text-xs tracking-[0.2em] uppercase text-on-surface-variant hover:text-primary transition-colors">Services Menu</Link>
             <Link to="/book" className="font-headline text-xs tracking-[0.2em] uppercase text-on-surface-variant hover:text-primary transition-colors">Client Portal</Link>
             <Link to="/dashboard" className="font-headline text-xs tracking-[0.2em] uppercase text-on-surface-variant hover:text-primary transition-colors">Manage Bookings</Link>
             <Link to="/auth" className="font-headline text-xs tracking-[0.2em] uppercase text-on-surface-variant hover:text-primary transition-colors">Member Access</Link>
           </nav>
        </div>

        {/* Contact info */}
        <div className="flex flex-col items-center md:items-end gap-8 text-center md:text-right">
           <h4 className="font-headline text-primary text-[10px] tracking-[0.5em] uppercase font-black">Ace Of Fades</h4>
           <div className="flex flex-col gap-4">
             <div className="flex flex-col gap-1 items-center md:items-end">
               <span className="text-outline text-[10px] uppercase tracking-[0.2em] mb-1">Location</span>
               <div className="flex items-center gap-2 text-on-surface font-headline text-xs uppercase tracking-widest">
                 <span>Eatontown, New Jersey</span>
                 <MapPin size={12} className="text-primary" />
               </div>
             </div>
             <div className="flex flex-col gap-1 items-center md:items-end">
               <span className="text-outline text-[10px] uppercase tracking-[0.2em] mb-1">Connect</span>
               <a href="tel:7325972374" className="flex items-center gap-2 text-on-surface font-headline text-xs uppercase tracking-widest hover:text-primary transition-colors">
                 <span>732-597-2374</span>
                 <Phone size={12} className="text-primary" />
               </a>
             </div>
           </div>
        </div>
      </div>

      <div className="w-full pt-16 border-t border-outline-variant/10 flex flex-col md:flex-row justify-between items-center gap-8">
        <p className="text-outline font-headline text-[9px] tracking-[0.4em] uppercase opacity-60">
          © {new Date().getFullYear()} ACE OF FADES.
        </p>
        <div className="flex gap-8">
           <Link to="/admin" className="font-headline text-[9px] tracking-[0.4em] uppercase text-outline hover:text-primary transition-colors">Admin</Link>
           <Link to="#" className="font-headline text-[9px] tracking-[0.4em] uppercase text-outline hover:text-primary transition-colors">Privacy Policy</Link>
           <Link to="#" className="font-headline text-[9px] tracking-[0.4em] uppercase text-outline hover:text-primary transition-colors">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
}
