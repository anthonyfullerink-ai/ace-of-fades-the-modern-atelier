import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../config/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  onAuthStateChanged
} from 'firebase/auth';
import toast from 'react-hot-toast';
import { Mail, Lock, ChevronRight, Loader2 } from 'lucide-react';
import { initClientDoc, logLogin } from '../services/api';

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(true);

  // Email state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Redirect if already logged in
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      }
    });
    return () => unsubscribe();
  }, [navigate, location]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { user } = await signInWithEmailAndPassword(auth, email, password);
        await initClientDoc(user);
        await logLogin(user);
        toast.success("Welcome back!");
      } else {
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        await initClientDoc(user);
        await logLogin(user);
        toast.success("Account created successfully!");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to authenticate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="pt-32 pb-24 px-6 max-w-lg mx-auto min-h-screen flex flex-col justify-center">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="bg-surface-container/40 backdrop-blur-xl p-10 md:p-16 border border-outline-variant/10 shadow-3xl relative overflow-hidden group"
      >
        {/* Artistic details */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-bl-full pointer-events-none -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-1000" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-tr-full pointer-events-none -ml-8 -mb-8 group-hover:scale-110 transition-transform duration-1000" />
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-1 h-32 bg-primary/20 pointer-events-none" />

        <div className="mb-12 text-center relative z-10">
           <span className="font-headline text-[10px] tracking-[0.5em] text-primary uppercase font-black mb-4 block">Portal Access</span>
           <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tighter text-on-surface uppercase leading-none">
             {isLogin ? 'Welcome' : 'Join the'}<br/>
             <span className="text-primary">{isLogin ? 'Back' : 'Ace Of Fades'}</span>
           </h1>
           <div className="w-12 h-px bg-outline-variant/30 mx-auto mt-8"></div>
        </div>

        <AnimatePresence mode="wait">
          <motion.form 
            key={isLogin ? 'login' : 'signup'}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            onSubmit={handleEmailAuth}
            className="space-y-8 relative z-10"
          >
            <div className="space-y-6">
              <div className="group/field">
                <label className="block text-[10px] uppercase tracking-[0.4em] text-primary/60 font-black mb-3">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-40 group-focus-within/field:text-primary group-focus-within/field:opacity-100 transition-all" size={18} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-surface-container-lowest/50 backdrop-blur-sm border border-outline-variant/20 text-on-surface px-16 py-5 focus:border-primary focus:bg-surface-container-lowest focus:outline-none transition-all font-body text-sm tracking-wide"
                    placeholder="name@example.com"
                  />
                </div>
              </div>
              
              <div className="group/field">
                <label className="block text-[10px] uppercase tracking-[0.4em] text-primary/60 font-black mb-3">Password</label>
                <div className="relative">
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-40 group-focus-within/field:text-primary group-focus-within/field:opacity-100 transition-all" size={18} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-surface-container-lowest/50 backdrop-blur-sm border border-outline-variant/20 text-on-surface px-16 py-5 focus:border-primary focus:bg-surface-container-lowest focus:outline-none transition-all font-body text-sm tracking-wide"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={loading}
                className="gold-gradient w-full py-6 flex justify-center items-center gap-4 text-on-primary font-headline font-black tracking-[0.4em] uppercase shadow-2xl hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center gap-3"><Loader2 className="animate-spin" size={20} /> Verifying...</span>
                ) : (
                  <>{isLogin ? 'Authenticate' : 'Establish Access'} <ChevronRight size={18} /></>
                )} 
              </button>
            </div>

            <div className="text-center pt-8 border-t border-outline-variant/10">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-on-surface-variant hover:text-primary transition-all text-[10px] font-headline uppercase tracking-[0.3em] font-black group/link"
              >
                {isLogin ? (
                  <>Don't have access? <span className="text-primary underline-offset-4 group-hover/link:underline">Register</span></>
                ) : (
                  <>Existing Member? <span className="text-primary underline-offset-4 group-hover/link:underline">Sign In</span></>
                )}
              </button>
            </div>
          </motion.form>
        </AnimatePresence>
      </motion.div>
    </main>
  );
}
