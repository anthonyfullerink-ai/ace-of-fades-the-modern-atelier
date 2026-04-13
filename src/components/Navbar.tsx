import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, User, Menu, X, LogOut, LogIn, Instagram } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, isAdmin } from '../config/firebase';
import { signOut } from 'firebase/auth';
import { subscribeToNotifications, markNotificationRead, Notification } from '../services/api';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [user, loading] = useAuthState(auth);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

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

  useEffect(() => {
    if (user && isAdmin(user)) {
      const unsubscribe = subscribeToNotifications(user.uid, (newNotifications) => {
        setNotifications(newNotifications);
      });
      return () => unsubscribe();
    } else {
      setNotifications([]);
    }
  }, [user]);

  // Close notifications on click outside or navigation
  useEffect(() => {
    setShowNotifications(false);
  }, [location.pathname]);

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
            <img src="/logo.png" alt="Ace of Fades Logo" className="h-10 object-contain transition-transform duration-500 group-hover:scale-110 mix-blend-screen" />
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
          {!loading && user && isAdmin(user) && (
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2 transition-all duration-300 rounded-full relative ${
                  showNotifications ? 'bg-primary/20 text-primary' : 'text-primary hover:bg-primary/5'
                }`}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-surface shadow-sm animate-pulse" />
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowNotifications(false)} 
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-4 w-80 md:w-96 bg-surface-container border border-outline-variant/20 shadow-2xl z-50 overflow-hidden"
                    >
                      <div className="p-4 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-high/50">
                        <span className="font-headline text-[10px] uppercase tracking-[0.2em] font-bold text-on-surface">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="bg-primary/10 text-primary text-[8px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">
                            {unreadCount} New
                          </span>
                        )}
                      </div>

                      <div className="max-h-[70vh] overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-12 text-center text-on-surface-variant italic text-xs">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div 
                              key={n.id}
                              onClick={async () => {
                                if (!n.read) await markNotificationRead(n.id!);
                                if (n.link) {
                                  navigate(n.link);
                                  setShowNotifications(false);
                                }
                              }}
                              className={`p-5 border-b border-outline-variant/5 cursor-pointer transition-all hover:bg-white/5 relative group ${
                                !n.read ? 'bg-primary/5' : ''
                              }`}
                            >
                              {!n.read && (
                                <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-full opacity-50" />
                              )}
                              <div className="flex justify-between items-start mb-1">
                                <h4 className={`text-sm font-bold tracking-tight ${!n.read ? 'text-primary' : 'text-on-surface'}`}>
                                  {n.title}
                                </h4>
                                <span className="text-[10px] text-outline whitespace-nowrap">
                                  {new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                              <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2">
                                {n.message}
                              </p>
                              <div className="mt-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-[9px] uppercase tracking-[0.1em] font-bold text-primary">View Details</span>
                                {!n.read && (
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markNotificationRead(n.id!);
                                    }}
                                    className="text-[9px] uppercase tracking-[0.1em] font-bold text-outline hover:text-on-surface"
                                  >
                                    Mark as read
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      
                      <button 
                        onClick={() => navigate('/admin')}
                        className="w-full p-4 text-center border-t border-outline-variant/10 font-headline text-[9px] uppercase tracking-[0.2em] font-bold text-on-surface-variant hover:text-primary hover:bg-white/5 transition-all"
                      >
                        Go to Admin Dashboard
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
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

                <div className="flex gap-6 justify-center mt-12 bg-surface-container/30 p-6 rounded-3xl border border-outline-variant/10">
                  <a 
                    href="https://www.instagram.com/aceoffadesbarberstudionj/?hl=en" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors"
                  >
                    <Instagram size={20} />
                    <span className="font-headline text-[10px] tracking-[0.3em] uppercase font-bold">Instagram</span>
                  </a>
                </div>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
