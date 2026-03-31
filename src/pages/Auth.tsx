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
import { Mail, Lock, ChevronRight } from 'lucide-react';
import { initClientDoc } from '../services/api';

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
        toast.success("Welcome back!");
      } else {
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        await initClientDoc(user);
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
      <div className="bg-surface-container p-8 md:p-12 border border-outline-variant/10 shadow-2xl relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full pointer-events-none" />
        <div className="absolute -left-2 top-12 w-1 h-24 bg-primary pointer-events-none" />

        <div className="mb-10 text-center">
          <h1 className="font-headline text-4xl font-bold tracking-tighter text-on-surface uppercase border-b-2 border-primary pb-2 inline-block">
            {isLogin ? 'Sign In' : 'Create Account'}
          </h1>
          <p className="text-on-surface-variant font-body mt-4 text-sm">
            Access your appointments and manage your profile.
          </p>
        </div>

        <AnimatePresence mode="wait">
          <motion.form 
            key="email-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onSubmit={handleEmailAuth}
            className="space-y-6"
          >
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-outline mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-50" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant/30 text-on-surface px-12 py-4 focus:border-primary focus:outline-none transition-colors"
                  placeholder="Enter your email"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-outline mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-50" size={18} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant/30 text-on-surface px-12 py-4 focus:border-primary focus:outline-none transition-colors"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="gold-gradient w-full py-5 flex justify-center items-center gap-2 text-on-primary font-headline font-bold tracking-[0.2em] uppercase active:scale-[0.98] transition-transform disabled:opacity-70 mt-4"
            >
              {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')} 
              {!loading && <ChevronRight size={18} />}
            </button>

            <div className="text-center mt-6">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-on-surface-variant hover:text-primary transition-colors text-xs font-headline uppercase tracking-widest border-b border-transparent hover:border-primary pb-1"
              >
                {isLogin ? "Need an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
          </motion.form>
        </AnimatePresence>
      </div>
    </main>
  );
}
