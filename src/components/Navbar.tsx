import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, User, Menu, X, LogOut, LogIn } from 'lucide-react';
import { useState } from 'react';
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

  return (
    <header id="navbar" className="bg-surface fixed top-0 z-50 w-full flex justify-between items-center px-6 py-4 border-b border-outline-variant/10">
      <div className="flex items-center gap-8">
        <Link to="/" className="flex items-center">
          <img src="/logo.png" alt="Ace of Fades Logo" className="h-10 object-contain" />
        </Link>
        <nav className="hidden md:flex gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`font-headline tracking-tighter uppercase transition-colors duration-300 ${
                isActive(link.path)
                  ? 'text-primary border-b-2 border-primary pb-1'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <button className="text-primary hover:bg-surface-container p-2 transition-colors duration-300 md:block hidden">
            <Bell size={20} />
          </button>
        )}
        
        <button 
          onClick={handleAuthAction}
          className="text-primary hover:bg-surface-container p-2 transition-colors duration-300 md:flex hidden items-center gap-2 font-headline uppercase text-sm tracking-widest"
        >
          {user ? (
            <><LogOut size={20} /> Logout</>
          ) : (
            <><LogIn size={20} /> Login</>
          )}
        </button>
        
        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden text-primary p-2"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 w-full bg-surface-container border-b border-outline-variant/20 md:hidden"
          >
            <nav className="flex flex-col p-6 gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`font-headline text-lg tracking-tighter uppercase ${
                    isActive(link.path) ? 'text-primary' : 'text-on-surface-variant'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <div className="flex gap-4 mt-4 pt-4 border-t border-outline-variant/20 flex-col">
                {user && (
                  <button className="text-primary flex items-center gap-2">
                    <Bell size={20} /> <span className="font-headline uppercase text-sm">Notifications</span>
                  </button>
                )}
                <button 
                  onClick={() => {
                    handleAuthAction();
                    setIsMenuOpen(false);
                  }}
                  className="text-primary flex items-center gap-2"
                >
                  {user ? (
                    <><LogOut size={20} /> <span className="font-headline uppercase text-sm">Logout</span></>
                  ) : (
                    <><LogIn size={20} /> <span className="font-headline uppercase text-sm">Login</span></>
                  )}
                </button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
