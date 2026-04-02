import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, User, Menu, X, LogOut, LogIn } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, isAdmin } from '../config/firebase';
import { signOut } from 'firebase/auth';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [user, loading] = useAuthState(auth);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Services', path: '/services' },
    ...(user ? [{ name: 'Manage', path: '/dashboard' }] : []),
    ...(user && isAdmin(user) ? [{ name: 'Admin', path: '/admin' }] : []),
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleAuthAction = async () => {
    if (user) {
      await signOut(auth);
      navigate('/');
    } else {
      navigate('/auth');
    }
  };

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      id="navbar" 
      className={`fixed top-0 z-50 w-full transition-all duration-500 px-6 py-4 ${
        isScrolled 
          ? 'bg-surface/80 backdrop-blur-lg border-b border-outline-variant/10 shadow-lg py-3' 
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-12">
          <Link to="/" className="flex items-center group">
            <img src="/logo.png" alt="Ace of Fades Logo" className="h-10 object-contain transition-transform duration-500 group-hover:scale-110" />
          </Link>
          <nav className="hidden md:flex gap-10">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`font-headline text-xs tracking-[0.3em] uppercase transition-all duration-300 relative group/link ${
                  isActive(link.path)
                    ? 'text-primary font-bold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {link.name}
                <span className={`absolute -bottom-2 left-0 h-0.5 bg-primary transition-all duration-500 ${
                  isActive(link.path) ? 'w-full' : 'w-0 group-hover/link:w-full'
                }`}></span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {!loading && user && (
            <Link to="/dashboard" className="text-primary hover:bg-primary/5 p-2 transition-colors duration-300 md:block hidden rounded-full">
              <Bell size={18} />
            </Link>
          )}
          
          <button 
            onClick={handleAuthAction}
            className={`transition-all duration-500 md:flex hidden items-center gap-2 font-headline uppercase text-[10px] tracking-[0.3em] font-bold py-2.5 px-6 border ${
              user 
                ? 'border-outline-variant/30 text-on-surface-variant hover:text-primary hover:border-primary' 
                : 'bg-primary text-on-primary border-primary hover:brightness-110 shadow-lg shadow-primary/20'
            }`}
          >
            {user ? (
              <><LogOut size={16} /> Logout</>
            ) : (
              <><LogIn size={16} /> Client Portal</>
            )}
          </button>
          
          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden text-primary p-2 hover:bg-primary/5 rounded-full transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed inset-0 top-[72px] bg-surface h-[calc(100vh-72px)] z-40 md:hidden"
          >
            <nav className="flex flex-col p-10 gap-8">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.path}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link
                    to={link.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`font-headline text-4xl tracking-tighter uppercase font-bold leading-none ${
                      isActive(link.path) ? 'text-primary' : 'text-on-surface-variant'
                    }`}
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}
              
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-auto border-t border-outline-variant/10 pt-10"
              >
                <button 
                  onClick={() => {
                    handleAuthAction();
                    setIsMenuOpen(false);
                  }}
                  className="w-full gold-gradient py-5 text-on-primary font-headline uppercase font-bold tracking-widest flex items-center justify-center gap-3"
                >
                  {user ? (
                    <><LogOut size={20} /> Logout</>
                  ) : (
                    <><LogIn size={20} /> Client Portal</>
                  )}
                </button>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
