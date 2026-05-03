import React, { useState, useEffect } from 'react';
import { User as AuthUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ShieldCheck, Edit3, Save, X, Truck, CreditCard, Building2, Store } from 'lucide-react';
import { motion } from 'motion/react';

interface SellerProfileTabProps {
  user: AuthUser;
}

export default function SellerProfileTab({ user }: SellerProfileTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [data, setData] = useState({
    storeName: '',
    businessType: '',
    phone: '',
    pickupAddress: '',
    returnAddress: '',
    bankName: '',
    accountNumber: '',
    deliveryOptions: '',
    paymentMethod: ''
  });

  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    let active = true;
    async function fetchUserData() {
      try {
        const docRef = doc(db, 'sellers', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && active) {
          const fetched = docSnap.data();
          setData({
            storeName: fetched.storeName || '',
            businessType: fetched.businessType || '',
            phone: fetched.phone || '',
            pickupAddress: fetched.pickupAddress || '',
            returnAddress: fetched.returnAddress || '',
            bankName: fetched.bankName || '',
            accountNumber: fetched.accountNumber || '',
            deliveryOptions: fetched.deliveryOptions || '',
            paymentMethod: fetched.paymentMethod || ''
          });
          setIsVerified(fetched.isVerified || false);
        }
      } catch (error) {
        console.error("Error fetching seller data", error);
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchUserData();
    return () => { active = false; };
  }, [user.uid]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const docRef = doc(db, 'sellers', user.uid);
      await setDoc(docRef, data, { merge: true });
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4 hide-scrollbar flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isEditing) {
    return (
      <div className="space-y-4 pb-10">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
           <div className="flex justify-between items-start mb-6">
             <div className="flex items-center gap-3">
               <div className="bg-slate-800 p-3 rounded-xl shrink-0">
                 <Store className="w-6 h-6 text-emerald-400" />
               </div>
               <div>
                 <h3 className="text-white font-bold text-lg">{data.storeName || 'My Store'}</h3>
                 <p className="text-slate-400 text-sm">Seller Account</p>
               </div>
             </div>
             <button 
               onClick={() => setIsEditing(true)}
               className="bg-slate-800 p-2 rounded-xl text-slate-300 hover:text-white transition"
             >
               <Edit3 className="w-4 h-4" />
             </button>
           </div>
           
           <div className="space-y-4">
             <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg">
               <div>
                 <p className="text-xs text-slate-500 font-bold uppercase">KYC Status</p>
                 <p className={`text-sm font-bold ${isVerified ? 'text-emerald-400' : 'text-amber-400'}`}>
                   {isVerified ? 'Verified' : 'Pending Verification'}
                 </p>
               </div>
               <ShieldCheck className={`w-6 h-6 ${isVerified ? 'text-emerald-400' : 'text-amber-400'}`} />
             </div>

             <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase mb-1">Business Type</p>
                  <p className="text-slate-300 text-sm">{data.businessType || '--'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase mb-1">Phone</p>
                  <p className="text-slate-300 text-sm">{data.phone || '--'}</p>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase mb-1 flex items-center gap-1"><Truck className="w-3 h-3" /> Delivery</p>
                  <p className="text-slate-300 text-sm">{data.deliveryOptions || '--'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase mb-1 flex items-center gap-1"><CreditCard className="w-3 h-3" /> Payment</p>
                  <p className="text-slate-300 text-sm">{data.paymentMethod || '--'}</p>
                </div>
             </div>

             <div>
               <p className="text-xs text-slate-500 font-bold uppercase mb-1 flex items-center gap-1"><Building2 className="w-3 h-3"/> Bank Details</p>
               <p className="text-slate-300 text-sm bg-slate-800 px-3 py-2 rounded-lg">
                 {data.bankName ? `${data.bankName} - ${data.accountNumber.slice(-4).padStart(data.accountNumber.length, '*')}` : '--'}
               </p>
             </div>
             
             <div>
               <p className="text-xs text-slate-500 font-bold uppercase mb-1">Pickup Address</p>
               <p className="text-slate-300 text-sm leading-relaxed">{data.pickupAddress || '--'}</p>
             </div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 mb-10">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-white font-bold text-lg">Update Profile</h3>
        <button 
           type="button"
           onClick={() => setIsEditing(false)}
           className="text-slate-400 hover:text-white transition p-1"
        >
           <X className="w-5 h-5" />
        </button>
      </div>

      <div>
        <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-1 block">Store Name</label>
        <input required type="text" name="storeName" value={data.storeName} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 px-4 text-white text-sm focus:border-emerald-500" />
      </div>

      <div>
        <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-1 block">Business Type</label>
        <select required name="businessType" value={data.businessType} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 px-4 text-white text-sm focus:border-emerald-500 appearance-none">
          <option>Individual</option>
          <option>Company</option>
          <option>Wholesale</option>
          <option>Manufacturer</option>
        </select>
      </div>

      <div>
         <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-1 block">Phone</label>
         <input required type="tel" name="phone" value={data.phone} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 px-4 text-white text-sm focus:border-emerald-500" />
      </div>

      <div className="h-px bg-slate-800 my-4" />

      <div>
         <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-1 block">Bank Name</label>
         <input required type="text" name="bankName" value={data.bankName} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 px-4 text-white text-sm focus:border-emerald-500" />
      </div>
      <div>
         <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-1 block">Account Number</label>
         <input required type="text" name="accountNumber" value={data.accountNumber} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 px-4 text-white text-sm focus:border-emerald-500" />
      </div>

      <div className="h-px bg-slate-800 my-4" />

      <div>
         <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-1 block">Pickup Address</label>
         <textarea required name="pickupAddress" value={data.pickupAddress} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 px-4 text-white text-sm focus:border-emerald-500 resize-none" rows={2} />
      </div>
      <div>
         <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-1 block">Return Address</label>
         <textarea required name="returnAddress" value={data.returnAddress} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 px-4 text-white text-sm focus:border-emerald-500 resize-none" rows={2} />
      </div>

      <button 
         type="submit"
         disabled={saving}
         className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
      >
        {saving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Profile</>}
      </button>
    </form>
  );
}
