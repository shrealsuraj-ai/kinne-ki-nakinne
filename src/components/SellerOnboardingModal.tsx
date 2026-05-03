import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, ChevronLeft, CheckCircle2, UploadCloud, Store, ShieldCheck, Truck, CreditCard, ClipboardCheck } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

interface SellerOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SellerOnboardingModal({ isOpen, onClose, onSuccess }: SellerOnboardingModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // States
  const [fullName, setFullName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [businessType, setBusinessType] = useState('Individual');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [categories, setCategories] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [returnAddress, setReturnAddress] = useState('');

  const [panVatNumber, setPanVatNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  const [deliveryOptions, setDeliveryOptions] = useState('Standard');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');

  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
    }
  }, [user]);

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      // Save application
      await setDoc(doc(db, 'seller_applications', user.uid), {
        userId: user.uid,
        status: 'pending_verification',
        fullName,
        storeName,
        businessType,
        email,
        phone,
        categories,
        businessDescription,
        pickupAddress,
        returnAddress,
        panVatNumber,
        bankName,
        accountNumber,
        deliveryOptions,
        paymentMethod,
        appliedAt: new Date().toISOString()
      });
      // Temporarily we could auto-approve or leave it pending. 
      // The prompt says "user -> applicant -> pending verification -> approved seller".
      // Let's just make them pending and close.
      onSuccess();
    } catch (error) {
      console.error(error);
      alert('Failed to submit application.');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 1, title: 'Basic Details', icon: Store },
    { id: 2, title: 'Seller Profile', icon: ClipboardCheck },
    { id: 3, title: 'Verification', icon: ShieldCheck },
    { id: 4, title: 'Preferences', icon: Truck },
    { id: 5, title: 'Review', icon: CheckCircle2 }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-[60] pointer-events-auto flex items-center justify-center p-4"
            onClick={onClose}
          />
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute z-[70] w-full max-w-lg max-h-[90vh] flex flex-col bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl pointer-events-auto"
          >
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-800 bg-slate-900/50">
              <div>
                <h2 className="text-xl font-bold text-white">Join Seller Portal</h2>
                <p className="text-xs text-slate-400 mt-1">Step {step} of 5: {steps[step-1].title}</p>
              </div>
              <button onClick={onClose} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="h-1.5 w-full bg-slate-800 flex">
               <div 
                 className="h-full bg-emerald-500 transition-all duration-300"
                 style={{ width: `${(step / 5) * 100}%` }}
               />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 hide-scrollbar">
              <form id="onboarding-form" onSubmit={step === 5 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }} className="space-y-4">
                
                {step === 1 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Full Name</label>
                        <input required type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white text-sm focus:border-emerald-500 transition" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Store Name</label>
                        <input required type="text" value={storeName} onChange={e => setStoreName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white text-sm focus:border-emerald-500 transition" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Business Type</label>
                        <select required value={businessType} onChange={e => setBusinessType(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white text-sm focus:border-emerald-500 transition appearance-none">
                          <option>Individual</option>
                          <option>Company</option>
                          <option>Wholesale</option>
                          <option>Manufacturer</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Phone Number</label>
                        <input required type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white text-sm focus:border-emerald-500 transition" />
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <div className="space-y-4">
                      <div>
                         <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Store Logo / Banner Upload</label>
                         <div className="border-2 border-dashed border-slate-700 bg-slate-800/50 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-800 transition">
                            <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                            <span className="text-sm font-medium text-slate-300">Tap to upload</span>
                         </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Product Categories (comma separated)</label>
                        <input required type="text" value={categories} onChange={e => setCategories(e.target.value)} placeholder="Electronics, Fashion..." className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white text-sm focus:border-emerald-500 transition" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Business Description</label>
                        <textarea required rows={3} value={businessDescription} onChange={e => setBusinessDescription(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white text-sm focus:border-emerald-500 transition resize-none"></textarea>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Pickup Address</label>
                        <input required type="text" value={pickupAddress} onChange={e => setPickupAddress(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white text-sm focus:border-emerald-500 transition" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Return Address</label>
                        <input required type="text" value={returnAddress} onChange={e => setReturnAddress(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white text-sm focus:border-emerald-500 transition" />
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <div className="space-y-4">
                      <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex gap-3 text-amber-400 text-sm">
                        <ShieldCheck className="w-5 h-5 shrink-0" />
                        <p>We need to verify your identity to ensure a safe marketplace.</p>
                      </div>
                      <div>
                         <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">National ID / Passport Upload</label>
                         <div className="border-2 border-dashed border-slate-700 bg-slate-800/50 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-800 transition">
                            <UploadCloud className="w-6 h-6 text-slate-400 mb-2" />
                            <span className="text-xs font-medium text-slate-300">Upload Document</span>
                         </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">PAN / VAT Number</label>
                        <input required type="text" value={panVatNumber} onChange={e => setPanVatNumber(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white text-sm focus:border-emerald-500 transition" />
                      </div>
                      <div className="h-px bg-slate-800 my-4"></div>
                      <h3 className="text-sm font-bold text-white mb-2">Banking Details</h3>
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Bank Name</label>
                        <input required type="text" value={bankName} onChange={e => setBankName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white text-sm focus:border-emerald-500 transition" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Account Number</label>
                        <input required type="text" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white text-sm focus:border-emerald-500 transition" />
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 4 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <div className="space-y-6">
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-3 block">Delivery Options</label>
                        <div className="grid grid-cols-2 gap-3">
                           {['Standard', 'Express', 'Local Pickup', 'Self-Shipping'].map(opt => (
                              <button 
                                type="button" 
                                key={opt}
                                onClick={() => setDeliveryOptions(opt)}
                                className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${deliveryOptions === opt ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'}`}
                              >
                                {opt}
                              </button>
                           ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-3 block">Payment Settlement</label>
                        <div className="grid grid-cols-2 gap-3">
                           {['Bank Transfer', 'Mobile Wallet'].map(opt => (
                              <button 
                                type="button" 
                                key={opt}
                                onClick={() => setPaymentMethod(opt)}
                                className={`p-4 rounded-xl border flex gap-2 items-center justify-center transition-all ${paymentMethod === opt ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'}`}
                              >
                                <CreditCard className="w-4 h-4" /> {opt}
                              </button>
                           ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 5 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <div className="space-y-4">
                       <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl text-center flex flex-col items-center">
                          <ClipboardCheck className="w-12 h-12 text-emerald-400 mb-3" />
                          <h3 className="text-lg font-bold text-white mb-1">Ready to Submit</h3>
                          <p className="text-sm text-slate-400">Please review your data before submitting. Applications are usually reviewed within 24-48 hours.</p>
                       </div>
                       
                       <div className="bg-slate-800 rounded-xl p-4 space-y-2 text-sm">
                          <div className="flex justify-between"><span className="text-slate-400">Store Name</span> <span className="text-white font-medium">{storeName}</span></div>
                          <div className="flex justify-between"><span className="text-slate-400">Business Type</span> <span className="text-white font-medium">{businessType}</span></div>
                          <div className="flex justify-between"><span className="text-slate-400">Contact</span> <span className="text-white font-medium">{phone}</span></div>
                          <div className="flex justify-between"><span className="text-slate-400">Categories</span> <span className="text-white font-medium">{categories || 'Not specified'}</span></div>
                          <div className="flex justify-between"><span className="text-slate-400">Settlement</span> <span className="text-white font-medium">{paymentMethod}</span></div>
                       </div>
                    </div>
                  </motion.div>
                )}
              </form>
            </div>

            {/* Footer Buttons */}
            <div className="p-6 border-t border-slate-800 bg-slate-900 flex justify-between gap-4">
               {step > 1 ? (
                 <button 
                   type="button"
                   onClick={handleBack}
                   className="px-6 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition"
                 >
                   Back
                 </button>
               ) : (
                 <div />
               )}
               <button 
                 form="onboarding-form"
                 type="submit"
                 disabled={loading}
                 className="px-8 py-3 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition disabled:opacity-50 flex items-center gap-2"
               >
                 {step === 5 ? (loading ? 'Submitting...' : 'Submit Application') : 'Continue'}
                 {step < 5 && <ChevronRight className="w-4 h-4" />}
               </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
