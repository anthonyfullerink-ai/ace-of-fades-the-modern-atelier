import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer id="footer" className="bg-surface-container-lowest w-full py-12 flex flex-col items-center gap-6 px-8 text-center border-t border-outline-variant/10">
      <div className="flex justify-center mb-2">
        <img src="/logo.png" alt="Ace of Fades Logo" className="h-16 object-contain" />
      </div>
      <div className="flex gap-8">
        <Link to="#" className="font-body text-xs tracking-widest uppercase text-on-surface-variant hover:text-primary transition-colors duration-300">
          PRIVACY
        </Link>
        <Link to="#" className="font-body text-xs tracking-widest uppercase text-on-surface-variant hover:text-primary transition-colors duration-300">
          TERMS
        </Link>
        <Link to="#" className="font-body text-xs tracking-widest uppercase text-on-surface-variant hover:text-primary transition-colors duration-300">
          CONTACT
        </Link>
      </div>
      <p className="text-on-surface-variant font-body text-[10px] tracking-widest uppercase opacity-60">
        © 2024 ACE OF FADES ATELIER. ALL RIGHTS RESERVED.
      </p>
      <p className="text-[8px] tracking-[0.5em] text-outline-variant uppercase opacity-30 mt-2">
        Eatontown, New Jersey — Exclusive Grooming Experience
      </p>
    </footer>
  );
}
