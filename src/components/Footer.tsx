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
    <footer id="footer" className="bg-surface-container-lowest w-full pt-24 pb-12 flex flex-col items-center gap-16 px-8 text-center border-t border-outline-variant/10">
      <div className="max-w-7xl w-full grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-8 items-start">
        
        {/* Brand & Info */}
        <div className="flex flex-col items-center md:items-start gap-6 text-left">
          <img src="/logo.png" alt="Ace of Fades Logo" className="h-16 w-auto object-contain brightness-0 invert opacity-90 mx-auto md:mx-0" />
          <p className="font-body text-sm text-on-surface-variant max-w-sm leading-relaxed text-center md:text-left opacity-70 italic tracking-wide">
            Precision grooming for the modern gentleman. Elevating the art of the fade in an exclusive setting.
          </p>
          <div className="flex justify-center md:justify-start gap-4 mt-2 w-full">
            <a href="#" className="w-10 h-10 rounded-full border border-outline-variant/20 flex items-center justify-center hover:bg-primary/10 hover:border-primary/40 transition-all duration-300">
              <Instagram size={18} className="text-on-surface-variant group-hover:text-primary" />
            </a>
            <a href="#" className="w-10 h-10 rounded-full border border-outline-variant/20 flex items-center justify-center hover:bg-primary/10 hover:border-primary/40 transition-all duration-300">
              <Facebook size={18} className="text-on-surface-variant group-hover:text-primary" />
            </a>
          </div>
        </div>

        {/* Contact & Links */}
        <div className="flex flex-col items-center md:items-end gap-8 text-center md:text-right">
          <div className="flex flex-col items-center md:items-end gap-3">
             <h4 className="font-headline text-primary text-[10px] tracking-[0.4em] uppercase font-bold">Contact</h4>
             <div className="flex items-center gap-3 text-on-surface-variant text-[10px] tracking-widest uppercase hover:text-primary transition-colors cursor-pointer group">
               <span>Eatontown, New Jersey</span>
               <MapPin size={12} className="opacity-40 group-hover:opacity-100" />
             </div>
             <a href="tel:7325972374" className="flex items-center gap-3 text-on-surface-variant text-[10px] tracking-widest uppercase hover:text-primary transition-colors cursor-pointer group">
               <span>732-597-2374</span>
               <Phone size={12} className="opacity-40 group-hover:opacity-100" />
             </a>
          </div>
          
          <div className="flex justify-center md:justify-end gap-6 mt-4 w-full">
            <Link to="/admin" className="font-headline text-[9px] tracking-[0.3em] uppercase text-outline hover:text-primary transition-colors py-2 border-b border-transparent hover:border-primary/20">Admin</Link>
            <Link to="#" className="font-headline text-[9px] tracking-[0.3em] uppercase text-outline hover:text-primary transition-colors py-2 border-b border-transparent hover:border-primary/20">Privacy</Link>
            <Link to="#" className="font-headline text-[9px] tracking-[0.3em] uppercase text-outline hover:text-primary transition-colors py-2 border-b border-transparent hover:border-primary/20">Terms</Link>
          </div>
        </div>
      </div>

      <div className="w-full pt-12 border-t border-outline-variant/5 flex flex-col items-center gap-4">
        <p className="text-on-surface-highlight font-headline text-[8px] tracking-[0.6em] uppercase opacity-40">
          © {new Date().getFullYear()} ACE OF FADES ATELIER. ALL RIGHTS RESERVED.
        </p>
      </div>
    </footer>
  );
}
