import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User as UserIcon, Save, Edit3, X, Store, ArrowRight, Clock } from 'lucide-react';
import SellerOnboardingModal from './SellerOnboardingModal';

interface CasualProfileTabProps {
  user: User;
  onViewOrders: () => void;
}

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

export default function CasualProfileTab({ user, onViewOrders }: CasualProfileTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [name, setName] = useState('');
  const [sex, setSex] = useState('Male');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');

  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function fetchUserData() {
      try {
        const docRef = doc(db, 'casual_users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && active) {
          const data = docSnap.data();
          setName(data.name || '');
          setSex(data.sex || 'Male');
          if (data.dateOfBirth) {
             const [y, m, d] = data.dateOfBirth.split('-');
             setBirthYear(String(Number(y)));
             setBirthMonth(String(Number(m)));
             setBirthDay(String(Number(d)));
          }
          setPhoneNumber(data.phoneNumber || '');
          setAddress(data.address || '');
        }

        // Check verification application
        const appRef = doc(db, 'seller_applications', user.uid);
        const appSnap = await getDoc(appRef);
        if (appSnap.exists() && active) {
          setApplicationStatus(appSnap.data().status);
        }
      } catch (error) {
        console.error("Error fetching user data", error);
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchUserData();
    return () => { active = false; };
  }, [user.uid]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!birthMonth || !birthDay || !birthYear) {
      alert("Please select a complete Date of Birth");
      return;
    }
    setSaving(true);
    try {
      const docRef = doc(db, 'casual_users', user.uid);
      await setDoc(docRef, {
        name,
        sex,
        dateOfBirth: `${birthYear}-${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}`,
        phoneNumber,
        address
      }, { merge: true });
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving profile", error);
      alert("Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto p-6 space-y-4 hide-scrollbar flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isEditing) {
    return (
      <div className="flex-1 overflow-y-auto p-6 space-y-4 hide-scrollbar">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col">
           <div className="flex justify-between items-start mb-6">
             <div className="flex items-center gap-3">
               <div className="bg-slate-800 p-3 rounded-full">
                 <UserIcon className="w-6 h-6 text-emerald-400" />
               </div>
               <div>
                 <h3 className="text-white font-bold text-lg">{name || 'Unnamed User'}</h3>
                 <p className="text-slate-400 text-sm">Casual Account</p>
               </div>
             </div>
             <button 
               onClick={() => setIsEditing(true)}
               className="bg-slate-800 p-2 rounded-xl text-slate-300 hover:text-white transition"
               title="Edit Profile"
             >
               <Edit3 className="w-4 h-4" />
             </button>
           </div>
           
           <div className="space-y-4">
             <div>
               <p className="text-xs text-slate-500 font-bold uppercase mb-1">Sex</p>
               <p className="text-slate-300 text-sm">{sex}</p>
             </div>
             <div>
               <p className="text-xs text-slate-500 font-bold uppercase mb-1">Date of Birth</p>
               <p className="text-slate-300 text-sm">{birthMonth && birthDay && birthYear ? `${birthMonth}/${birthDay}/${birthYear}` : '--'}</p>
             </div>
             <div>
               <p className="text-xs text-slate-500 font-bold uppercase mb-1">Phone Number</p>
               <p className="text-slate-300 text-sm">{phoneNumber || '--'}</p>
             </div>
             <div>
               <p className="text-xs text-slate-500 font-bold uppercase mb-1">Address</p>
               <p className="text-slate-300 text-sm leading-relaxed">{address || '--'}</p>
             </div>
           </div>
        </div>
        <button 
          onClick={onViewOrders}
          className="w-full bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-3.5 rounded-xl border border-slate-700 transition"
        >
           View My Orders
        </button>

        {/* Sell CTA Section */}
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl">
          <div className="flex items-start gap-4">
            <div className="bg-emerald-500/20 p-3 rounded-xl shrink-0">
               <Store className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="flex-1">
               <h4 className="text-white font-bold mb-1">Seller Portal</h4>
               {applicationStatus === 'pending_verification' ? (
                 <>
                   <p className="text-sm text-slate-400 mb-3">Your seller application is currently being reviewed. We will notify you once approved.</p>
                   <div className="flex items-center gap-2 text-amber-400 text-xs font-bold bg-amber-500/10 px-3 py-1.5 rounded-lg w-fit">
                     <Clock className="w-3.5 h-3.5" /> Pending Verification
                   </div>
                 </>
               ) : (
                 <>
                   <p className="text-sm text-slate-400 mb-3">Want to reach millions of customers? Join our seller portal today and start growing your business.</p>
                   <button 
                     onClick={() => setIsOnboardingOpen(true)}
                     className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors"
                   >
                     Join Seller Portal <ArrowRight className="w-4 h-4" />
                   </button>
                 </>
               )}
            </div>
          </div>
        </div>

        <SellerOnboardingModal 
          isOpen={isOnboardingOpen} 
          onClose={() => setIsOnboardingOpen(false)} 
          onSuccess={() => {
            setIsOnboardingOpen(false);
            setApplicationStatus('pending_verification');
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4 hide-scrollbar">
      <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-white font-bold text-lg">Edit Profile</h3>
          <button 
             type="button"
             onClick={() => setIsEditing(false)}
             className="text-slate-400 hover:text-white transition p-1"
          >
             <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-1 block">Full Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-1 block">Sex</label>
          <select
            required
            value={sex}
            onChange={(e) => setSex(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors appearance-none"
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-1 block">Date of Birth</label>
          <div className="grid grid-cols-3 gap-2">
            <select required value={birthMonth} onChange={(e) => setBirthMonth(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors appearance-none">
              <option value="" disabled>MM</option>
              {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <select required value={birthDay} onChange={(e) => setBirthDay(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors appearance-none">
              <option value="" disabled>DD</option>
              {days.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select required value={birthYear} onChange={(e) => setBirthYear(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors appearance-none">
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
             className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
           />
        </div>

        <div>
           <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-1 block">Address</label>
           <textarea
             required
             value={address}
             onChange={(e) => setAddress(e.target.value)}
             className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors resize-none"
             rows={2}
           ></textarea>
        </div>

        <button 
           type="submit"
           disabled={saving}
           className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
        >
          {saving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Profile</>}
        </button>
      </form>
    </div>
  );
}
