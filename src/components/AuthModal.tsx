import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, Mail, ChevronRight, User, ShoppingBag } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'casual' | 'seller'>('casual');
  
  // Casual user specific fields
  const [name, setName] = useState('');
  const [sex, setSex] = useState('Male');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const months = [
    { value: '1', label: 'January' }, { value: '2', label: 'February' },
    { value: '3', label: 'March' }, { value: '4', label: 'April' },
    { value: '5', label: 'May' }, { value: '6', label: 'June' },
    { value: '7', label: 'July' }, { value: '8', label: 'August' },
    { value: '9', label: 'September' }, { value: '10', label: 'October' },
    { value: '11', label: 'November' }, { value: '12', label: 'December' }
  ];
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      const result = await signInWithPopup(auth, provider);
      
      const uid = result.user.uid;
      const adminDoc = await getDoc(doc(db, 'admins', uid));
      const sellerDoc = await getDoc(doc(db, 'sellers', uid));
      const casualDoc = await getDoc(doc(db, 'casual_users', uid));
      const oldUserDoc = await getDoc(doc(db, 'users', uid));
      
      if (!adminDoc.exists() && !sellerDoc.exists() && !casualDoc.exists() && !oldUserDoc.exists()) {
         const collectionName = role === 'seller' ? 'sellers' : 'casual_users';
         await setDoc(doc(db, collectionName, uid), {
           email: result.user.email,
           role: role,
           name: result.user.displayName || '',
           createdAt: new Date().toISOString()
         });
      }
      onClose();
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'An error occurred during Google Sign-In.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isLogin && role === 'casual') {
      if (!birthMonth || !birthDay || !birthYear) {
        setError('Please select a complete Date of Birth');
        return;
      }
    }

    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const collectionName = role === 'seller' ? 'sellers' : 'casual_users';
        
        const baseData = {
          email: userCredential.user.email,
          role: role,
          createdAt: new Date().toISOString()
        };

        const casualData = role === 'casual' ? {
          name,
          sex,
          dateOfBirth: `${birthYear}-${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}`,
          phoneNumber,
          address
        } : {};

        await setDoc(doc(db, collectionName, userCredential.user.uid), {
          ...baseData,
          ...casualData
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-50 pointer-events-auto flex items-center justify-center p-4"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: 50, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[340px] max-h-[90vh] overflow-y-auto hide-scrollbar bg-slate-900 border border-slate-700 rounded-[32px] p-6 z-50 shadow-[0_10px_40px_rgba(0,0,0,0.8)] pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </h2>
              <button 
                onClick={onClose} 
                className="bg-slate-800 p-2 rounded-full border border-slate-700 hover:bg-slate-700 text-slate-300 transition-colors shrink-0 ml-4"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="bg-rose-500/20 border border-rose-500/50 text-rose-400 text-xs p-3 rounded-xl mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-2 block">Account Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole('casual')}
                      className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border ${role === 'casual' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750 transition-colors'}`}
                    >
                      <User className="w-5 h-5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Casual User</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('seller')}
                      className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border ${role === 'seller' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750 transition-colors'}`}
                    >
                      <ShoppingBag className="w-5 h-5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Seller Portal</span>
                    </button>
                  </div>
                </div>
              )}

              {!isLogin && role === 'casual' && (
                <>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-1 block">Full Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                      placeholder="Alex Rivera"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-1 block">Sex</label>
                    <select
                      required
                      value={sex}
                      onChange={(e) => setSex(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors appearance-none"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-1 block">Date of Birth</label>
                    <div className="grid grid-cols-3 gap-2">
                      <select required value={birthMonth} onChange={(e) => setBirthMonth(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors appearance-none">
                        <option value="" disabled>MM</option>
                        {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                      </select>
                      <select required value={birthDay} onChange={(e) => setBirthDay(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors appearance-none">
                        <option value="" disabled>DD</option>
                        {days.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <select required value={birthYear} onChange={(e) => setBirthYear(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors appearance-none">
                        <option value="" disabled>YYYY</option>
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-1 block">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-1 block">Address</label>
                    <textarea
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                      placeholder="123 Main St, City, Country"
                      rows={2}
                    ></textarea>
                  </div>
                </>
              )}

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-1 block">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="w-4 h-4 text-slate-500" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                    placeholder="alex@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-1 block">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4 text-slate-500" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loading ? 'Processing...' : (isLogin ? 'SIGN IN' : 'SIGN UP')}
                {!loading && <ChevronRight className="w-4 h-4" />}
              </button>
            </form>

            <div className="mt-4 mb-4 relative flex items-center">
              <div className="flex-grow border-t border-slate-700"></div>
              <span className="flex-shrink-0 mx-4 text-slate-500 text-xs">or</span>
              <div className="flex-grow border-t border-slate-700"></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-slate-800 text-white border border-slate-700 font-bold py-3.5 rounded-xl flex items-center justify-center gap-3 hover:bg-slate-750 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
                }}
                className="text-slate-400 text-xs hover:text-white transition-colors"
              >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
            
            <p className="text-center text-[10px] text-slate-500 mt-6 leading-relaxed tracking-wide">
              Remember to enable Email/Password provider in the Firebase Console and ensure your app url is added to authorized domains.
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
