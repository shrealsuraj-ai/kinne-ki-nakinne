import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, UploadCloud, Video, AlertCircle, ChevronRight, ChevronLeft, Sparkles, CheckCircle2, Camera } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import CameraCapture from './CameraCapture';

import { useDomains } from '../contexts/DomainContext';
import { DOMAINS, TRANSACTION_TYPES } from '../lib/domains';

interface ProductUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeDomainId: string;
}

export default function ProductUploadModal({ isOpen, onClose, activeDomainId }: ProductUploadModalProps) {
  const { user, activeProfile } = useAuth();
  const { commissions } = useDomains();
  
  const [step, setStep] = useState(1);
  const totalSteps = 5;

  // Form State
  const [selectedDomainId, setSelectedDomainId] = useState<string>(activeDomainId);
  const activeDomain = useMemo(() => DOMAINS.find(d => d.id === selectedDomainId) || DOMAINS[0], [selectedDomainId]);
  const [segment, setSegment] = useState<string>(activeDomain.segments[0].id);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  
  // Basic Info
  const [title, setTitle] = useState('');
  const [shortHeadline, setShortHeadline] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [tags, setTags] = useState('');

  const activeCategories = useMemo(() => {
    return activeDomain?.segments.find(s => s.id === segment)?.categories || [];
  }, [activeDomain, segment]);

  const activeSubcategories = useMemo(() => {
    return activeCategories.find((c: any) => c.id === category || c.label === category)?.subcategories || [];
  }, [activeCategories, category]);

  // Description & Specs
  const [description, setDescription] = useState('');
  const [keyFeatures, setKeyFeatures] = useState('');
  const [specifications, setSpecifications] = useState<Record<string, string>>({});
  
  // Sales & Shipping
  const [transactionType, setTransactionType] = useState('buy');
  const [priceModel, setPriceModel] = useState('one_time');
  const [durationRequired, setDurationRequired] = useState(false);
  const [depositRequired, setDepositRequired] = useState(false);
  const [price, setPrice] = useState('');
  const [discount, setDiscount] = useState('');
  const [stock, setStock] = useState('1');
  const [minOrderQuantity, setMinOrderQuantity] = useState('1');
  const [discountTiersInput, setDiscountTiersInput] = useState('10:5, 50:10');
  const [minPledgeCount, setMinPledgeCount] = useState('10');
  const [pricePerPersonAtMin, setPricePerPersonAtMin] = useState('');
  const [expiryDays, setExpiryDays] = useState('7');
  const [processingTime, setProcessingTime] = useState('');
  const [deliveryCoverage, setDeliveryCoverage] = useState('');
  const [returnPolicy, setReturnPolicy] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const domainLabels = useMemo(() => {
    switch (selectedDomainId) {
      case 'padhne':
        return {
          title: 'Course/Program/School Name *',
          category: 'Grade Level / Type *',
          brand: 'Institution / Board Name',
          description: 'Syllabus / Details *',
          price: 'Tuition / Fee (NPR) *',
          stock: 'Available Seats / Intake *',
        };
      case 'khane':
        return {
          title: 'Item / Dish / Restaurant Name *',
          category: 'Cuisine / Meal Type *',
          brand: 'Chef / Restaurant Brand',
          description: 'Ingredients / Menu Details *',
          price: 'Price (NPR) *',
          stock: 'Daily Availability *',
        };
      case 'garne':
        return {
          title: 'Job / Project / Concept Title *',
          category: 'Industry / Sector *',
          brand: 'Company / Organization Name',
          description: 'Job Description / Proposal *',
          price: 'Salary / Funding Goal (NPR) *',
          stock: 'Openings / Available Positions *',
        };
      case 'jane':
        return {
          title: 'Destination / Tour / Hotel Name *',
          category: 'Travel Type / Accommodation *',
          brand: 'Travel Agency / Host Name',
          description: 'Itinerary / Amenities Details *',
          price: 'Package Price (NPR) *',
          stock: 'Available Slots / Rooms *',
        };
      case 'line':
        return {
          title: 'Property / Service Name *',
          category: 'Property Type / Service Type *',
          brand: 'Agency / Provider Name',
          description: 'Details / Inclusions *',
          price: 'Price / Rent (NPR) *',
          stock: 'Available Units / Availability *',
        };
      case 'lagaune':
        return {
          title: 'Apparel / Accessory Name *',
          category: 'Wearable Category *',
          brand: 'Brand',
          description: 'Material & Fit Details *',
          price: 'Price (NPR) *',
          stock: 'Stock Quantity *',
        };
      case 'khelne':
        return {
          title: 'Game / Event / Venue Name *',
          category: 'Sport / Genre *',
          brand: 'Developer / Organizer',
          description: 'Rules / Event Details *',
          price: 'Ticket / Entry Fee (NPR) *',
          stock: 'Available Tickets / Slots *',
        };
      case 'herne':
        return {
          title: 'Content / Series / Movie Title *',
          category: 'Genre / Format *',
          brand: 'Studio / Production House',
          description: 'Synopsis / Plot *',
          price: 'Rental / Subscription (NPR) *',
          stock: 'Available Licenses (1 for unlim) *',
        };
      default:
        return {
          title: 'Title / Item Name *',
          category: 'Category *',
          brand: 'Brand',
          description: 'Long Description *',
          price: 'Price (NPR) *',
          stock: 'Stock Quantity *',
          delivery: 'Delivery Coverage',
        };
    }
  }, [selectedDomainId]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const listingQualityScore = useMemo(() => {
    let score = 0;
    if (title.length > 5) score += 10;
    if (shortHeadline.length > 5) score += 10;
    if (brand) score += 5;
    if (category) score += 10;
    if (tags.length > 5) score += 5;
    if (description.length > 20) score += 15;
    if (keyFeatures.length > 10) score += 10;
    if (Object.keys(specifications).length > 0) score += 10;
    if (price && parseFloat(price) > 0) score += 10;
    if (stock && parseInt(stock) > 0) score += 5;
    if (returnPolicy) score += 10;
    return Math.min(100, score);
  }, [title, shortHeadline, brand, category, tags, description, keyFeatures, specifications, price, stock, returnPolicy]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter(file => {
      if (!file.type.startsWith('video/') && !file.type.startsWith('image/')) return false;
      if (file.type.startsWith('video/') && file.size > 50 * 1024 * 1024) return false;
      return true;
    });

    if (validFiles.length !== newFiles.length) {
      setError('Some files were rejected. Only videos (max 50MB) and images are allowed.');
    } else {
      setError(null);
    }
    
    setMediaFiles(prev => {
      const combined = [...prev, ...validFiles];
      if (combined.length > 5) {
        setError('Maximum 5 media files allowed.');
        return combined.slice(0, 5);
      }
      return combined;
    });
  };

  const removeFile = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleSpecChange = (key: string, value: string) => {
    setSpecifications(prev => ({ ...prev, [key]: value }));
  };

  const handleAIAssist = () => {
    if (!title && !category) {
      setError('Please enter a title and category first for AI assist.');
      return;
    }
    setError(null);
    setShortHeadline(`Premium ${title || 'Product'} - Unmatched Quality`);
    setDescription(`Discover the exceptional ${title || 'item'}, crafted for those who value quality and performance. Our product integrates modern design with durable materials, ensuring it stands the test of time.`);
    setKeyFeatures(`- High durability\n- Premium materials\n- Sleek modern design\n- 100% Authentic warranty`);
    setTags(`${category.toLowerCase() || 'general'}, premium, trending`);
  };

  const nextStep = () => {
    if (step === 1 && mediaFiles.length === 0 && segment !== 'arena') {
        setError("Please upload at least one video or image to continue.");
        return;
    }
    setError(null);
    setStep(prev => Math.min(prev + 1, totalSteps));
  };
  
  const prevStep = () => {
    setError(null);
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step !== totalSteps) {
        nextStep();
        return;
    }

    if (!user || (activeProfile !== 'seller' && activeProfile !== 'admin')) {
      setError('Only sellers or admins can upload products. Please switch to your seller profile.');
      return;
    }
    
    if ((segment !== 'arena' && mediaFiles.length === 0) || !title || !price) {
      setError('Please fill all required fields and select at least one media file.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const hasVideo = mediaFiles.some(f => f.type.startsWith('video/'));
      const productType = hasVideo ? 'video' : (mediaFiles.length > 1 ? 'slideshow' : 'image');

      // 1. Create product doc stub
      const productRef = await addDoc(collection(db, 'products'), {
        sellerId: user.uid,
        seller: user.email?.split('@')[0] || 'Seller',
        title,
        shortHeadline,
        brand,
        category,
        subcategory,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        description,
        longDescription: description,
        keyFeatures: keyFeatures.split('\n').filter(Boolean),
        specifications,
        seoTags: tags.split(',').map(t => t.trim()).filter(Boolean),
        benefits: [], // Can be populated later or from keyFeatures
        shippingInfo: {
          processingTime,
          deliveryCoverage
        },
        returnPolicy,
        searchMetadata: {
          keywords: tags.split(',').map(t => t.trim()).filter(Boolean),
          brand,
          category
        },
        basePrice: parseFloat(price),
        commissionRate: (() => {
           let rate = commissions[segment] || 0;
           if (category) {
              const catId = category.toLowerCase().replace(/[^a-z0-9]/g, '-');
              if (commissions[`cat_${catId}`] !== undefined) rate = commissions[`cat_${catId}`];
              if (subcategory && commissions[`subcat_${catId}_${subcategory}`] !== undefined) {
                 rate = commissions[`subcat_${catId}_${subcategory}`];
              }
           }
           return rate;
        })(),
        price: parseFloat((parseFloat(price) * (1 + ((() => {
           let rate = commissions[segment] || 0;
           if (category) {
              const catId = category.toLowerCase().replace(/[^a-z0-9]/g, '-');
              if (commissions[`cat_${catId}`] !== undefined) rate = commissions[`cat_${catId}`];
              if (subcategory && commissions[`subcat_${catId}_${subcategory}`] !== undefined) rate = commissions[`subcat_${catId}_${subcategory}`];
           }
           return rate;
        })() / 100))).toFixed(2)),
        discount: parseFloat(discount) || 0,
        stock: parseInt(stock) || 1,
        minOrderQuantity: segment === 'wholesale' ? parseInt(minOrderQuantity) || 1 : undefined,
        bulkDiscountTiers: segment === 'wholesale' ? discountTiersInput.split(',').reduce((acc, pair) => {
          const [qty, pct] = pair.split(':');
          if (qty && pct) acc[qty.trim()] = parseFloat(pct.trim());
          return acc;
        }, {} as Record<string, number>) : undefined,
        minPledgeCount: segment === 'group-purchase' ? parseInt(minPledgeCount) || 10 : undefined,
        currentPledgeCount: segment === 'group-purchase' ? 0 : undefined,
        basePricePerPersonAtMin: segment === 'group-purchase' ? parseFloat(pricePerPersonAtMin) || 0 : undefined,
        pricePerPersonAtMin: segment === 'group-purchase' ? parseFloat(((parseFloat(pricePerPersonAtMin) || 0) * (1 + ((() => {
           let rate = commissions[segment] || 0;
           if (category) {
              const catId = category.toLowerCase().replace(/[^a-z0-9]/g, '-');
              if (commissions[`cat_${catId}`] !== undefined) rate = commissions[`cat_${catId}`];
              if (subcategory && commissions[`subcat_${catId}_${subcategory}`] !== undefined) rate = commissions[`subcat_${catId}_${subcategory}`];
           }
           return rate;
        })() / 100))).toFixed(2)) : undefined,
        expiryDate: segment === 'group-purchase' ? new Date(Date.now() + 86400000 * (parseInt(expiryDays) || 7)).toISOString() : undefined,
        transactionType,
        priceModel,
        durationRequired,
        depositRequired,
        listingQualityScore,
        segment,
        uploadStatus: 'uploading',
        createdAt: serverTimestamp(),
        likes: 0,
        comments: 0,
        type: productType,
        isVerified: true,
        moderationStatus: 'approved' // Automatically auto-approve for now
      });

      // 2. Simulate Uploading Multiple Files
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += 5;
        setProgress(Math.min(currentProgress, 100));
      }, 100);

      setTimeout(async () => {
        clearInterval(interval);
        setProgress(100);
        
        // Use Cloudinary for upload if env variables exist, else fallback to mock/compression
        const env = (import.meta as any).env;
        const cloudName = env.VITE_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = env.VITE_CLOUDINARY_UPLOAD_PRESET;

        const uploadToCloudinary = async (file: File): Promise<string> => {
          if (!cloudName || !uploadPreset) {
            console.warn("Cloudinary not configured. Falling back to base64/object URL mock.");
            throw new Error("Missing Cloudinary Config");
          }
          const formData = new FormData();
          formData.append('file', file);
          formData.append('upload_preset', uploadPreset);

          const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
            method: 'POST',
            body: formData
          });
          const data = await res.json();
          if (data.secure_url) {
            return data.secure_url; // Real URL returned by Cloudinary (video or image)
          } else {
            throw new Error("Cloudinary upload failed: " + JSON.stringify(data));
          }
        };

        const compressImage = (file: File): Promise<string> => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
              const img = new Image();
              img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const maxDim = 600;
                if (width > maxDim || height > maxDim) {
                  if (width > height) {
                    height = Math.round((height * maxDim) / width);
                    width = maxDim;
                  } else {
                    width = Math.round((width * maxDim) / height);
                    height = maxDim;
                  }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.7));
              };
              img.onerror = (e) => reject(e);
              img.src = event.target?.result as string;
            };
            reader.onerror = (e) => reject(e);
            reader.readAsDataURL(file);
          });
        };

        const generatedUrls = await Promise.all(mediaFiles.map(async f => {
          try {
             // Attempt real upload
             return await uploadToCloudinary(f);
          } catch (cloudErr) {
             // Fallbacks if Cloudinary isn't configured
             if (f.type.startsWith('video/')) {
               return URL.createObjectURL(f);
             } else {
               try {
                 return await compressImage(f);
               } catch (e) {
                 return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
               }
             }
          }
        }));

        try {
          const updateData: any = {
            mediaUrls: generatedUrls, // Support slideshow
            uploadStatus: 'completed'
          };
          if (generatedUrls.length > 0) {
             updateData.url = generatedUrls[0];
          }
          await updateDoc(doc(db, 'products', productRef.id), updateData);

          setLoading(false);
          // Reset form
          setStep(1);
          setTitle(''); setShortHeadline(''); setBrand(''); setCategory(''); setTags('');
          setDescription(''); setKeyFeatures(''); setSpecifications({});
          setPrice(''); setDiscount(''); setStock('1'); setMinOrderQuantity('1'); setProcessingTime(''); setDeliveryCoverage(''); setReturnPolicy('');
          setTransactionType('buy'); setPriceModel('one_time'); setDurationRequired(false); setDepositRequired(false);
          setSegment(DOMAINS.find(d => d.id === activeDomainId)?.segments[0]?.id || DOMAINS[0].segments[0].id); setMediaFiles([]); setProgress(0);
          onClose();
        } catch (err) {
          console.error(err);
          setError('Failed to update product URL.');
          setLoading(false);
        }
      }, 2000);

    } catch (err) {
      console.error(err);
      setError('An error occurred during submission.');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  if (activeProfile !== 'seller' && activeProfile !== 'admin') {
    return (
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center max-w-sm w-full relative">
            <button onClick={onClose} className="absolute right-4 top-4 p-2 bg-slate-800 rounded-full text-slate-400">
              <X className="w-4 h-4" />
            </button>
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Seller Profile Required</h3>
            <p className="text-slate-400 text-sm mb-6">You need to be viewing your seller profile to upload and sell products using videos. Switch profiles in the Dashboard to proceed.</p>
            <button onClick={onClose} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition">
              Close
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">1. Product Media *</label>
              <input type="file" accept="video/*,image/*" multiple ref={fileInputRef} className="hidden" onChange={handleFileChange} />
              <input type="file" accept="video/*,image/*" capture="environment" ref={cameraInputRef} className="hidden" onChange={handleFileChange} />
              
              <div 
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition relative group ${
                  isDragging ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-700 bg-slate-800/30 hover:border-emerald-500/50 hover:bg-slate-800/50'
                }`}
                onDragOver={segment !== 'arena' ? handleDragOver : undefined}
                onDragLeave={segment !== 'arena' ? handleDragLeave : undefined}
                onDrop={segment !== 'arena' ? handleDrop : undefined}
              >
                {mediaFiles.length === 0 ? (
                   <div className="flex flex-col items-center w-full">
                     {segment !== 'arena' && (
                       <>
                         <div 
                            className="flex flex-col items-center cursor-pointer w-full py-4 mb-2 hover:bg-slate-800/50 rounded-xl transition"
                            onClick={() => fileInputRef.current?.click()}
                         >
                           <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition">
                             <UploadCloud className="w-6 h-6 text-emerald-400" />
                           </div>
                           <p className="text-sm font-bold text-white mb-1">Upload Media from File</p>
                           <p className="text-xs text-slate-500">Drag & drop or click to browse files</p>
                         </div>
                         
                         <div className="flex items-center w-full my-2">
                           <div className="flex-1 border-t border-slate-700"></div>
                           <span className="px-3 text-xs text-slate-500 font-bold uppercase">OR</span>
                           <div className="flex-1 border-t border-slate-700"></div>
                         </div>
                       </>
                     )}

                     <div 
                        className="flex flex-col items-center cursor-pointer w-full py-4 mt-2 hover:bg-slate-800/50 rounded-xl transition"
                        onClick={(e) => { e.stopPropagation(); setIsCameraOpen(true); }}
                     >
                       <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition">
                         <Camera className="w-6 h-6 text-blue-400" />
                       </div>
                       <p className="text-sm font-bold text-white mb-1">{segment === 'arena' ? 'Start Live Camera' : 'Open Camera'}</p>
                       <p className="text-xs text-slate-500">Take a photo or record video</p>
                     </div>
                   </div>
                ) : (
                   <div className="w-full">
                     <div className="grid grid-cols-3 gap-2 mb-4">
                       {mediaFiles.map((file, idx) => (
                         <div key={idx} className="relative rounded-xl overflow-hidden border border-slate-700 bg-black aspect-square w-full shadow-lg">
                           {file.type.startsWith('video/') ? (
                             <video src={URL.createObjectURL(file)} className="w-full h-full object-cover" muted loop playsInline />
                           ) : (
                             <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="" />
                           )}
                           <button type="button" onClick={(e) => { e.stopPropagation(); removeFile(idx); }} className="absolute top-1 right-1 bg-black/60 p-1 rounded-full backdrop-blur text-white hover:bg-rose-500 transition">
                             <X className="w-3 h-3" />
                           </button>
                           <div className="absolute bottom-1 left-1 bg-black/60 backdrop-blur px-1.5 py-0.5 rounded text-[9px] font-bold text-white flex items-center gap-1">
                             {file.type.startsWith('video/') ? <Video className="w-2.5 h-2.5 text-emerald-400" /> : <UploadCloud className="w-2.5 h-2.5 text-emerald-400" />} 
                           </div>
                         </div>
                       ))}
                       {mediaFiles.length < 5 && (
                         <div className="flex flex-col gap-2 w-full aspect-square">
                           <div onClick={() => fileInputRef.current?.click()} title="Upload from file" className="rounded-xl border border-dashed border-slate-600 bg-slate-800/50 flex-1 flex items-center justify-center cursor-pointer hover:bg-slate-700 transition">
                             <UploadCloud className="w-5 h-5 text-slate-400" />
                           </div>
                           <div onClick={() => setIsCameraOpen(true)} title="Open camera" className="rounded-xl border border-dashed border-slate-600 bg-slate-800/50 flex-1 flex items-center justify-center cursor-pointer hover:bg-slate-700 transition">
                             <Camera className="w-5 h-5 text-slate-400" />
                           </div>
                         </div>
                       )}
                     </div>
                     <div className="flex justify-between items-center text-xs text-slate-400">
                       <span>{mediaFiles.length} file(s) selected</span>
                       <button type="button" onClick={() => setMediaFiles([])} className="text-rose-400 hover:text-rose-300">Clear all</button>
                     </div>
                   </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">2. Primary Domain *</label>
                <select value={selectedDomainId} onChange={e => {
                  const domain = DOMAINS.find(d => d.id === e.target.value) || DOMAINS[0];
                  const newSegment = domain.segments[0];
                  setSelectedDomainId(e.target.value);
                  setSegment(newSegment.id);
                  if (newSegment.defaultTransactionType) {
                    setTransactionType(newSegment.defaultTransactionType);
                  }
                }} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white text-sm focus:border-emerald-500 appearance-none">
                  {DOMAINS.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.label})</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">3. Segment Details *</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {activeDomain.segments.map(type => (
                    <div key={type.id} onClick={() => {
                      setSegment(type.id);
                      if (type.defaultTransactionType) setTransactionType(type.defaultTransactionType);
                    }} className={`p-3 rounded-xl border cursor-pointer transition flex flex-col items-center justify-center gap-2 text-center ${segment === type.id ? `bg-${type.color}-500/20 border-${type.color}-500` : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}`}>
                      <span className={`text-sm font-bold ${segment === type.id ? `text-${type.color}-400` : 'text-slate-300'}`}>{type.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h4 className="font-bold text-white mb-2">Basic Info</h4>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">{domainLabels.title}</label>
              <input type="text" required value={title} onChange={e => setTitle(e.target.value)} placeholder="Enter title or name..." className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white text-sm focus:border-emerald-500" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Short Headline</label>
              <input type="text" value={shortHeadline} onChange={e => setShortHeadline(e.target.value)} placeholder="Catchy one-liner..." className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white text-sm focus:border-emerald-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className={activeSubcategories.length ? 'col-span-2 sm:col-span-1' : ''}>
                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">{domainLabels.category}</label>
                {activeCategories.length > 0 ? (
                  <select required value={category} onChange={e => { setCategory(e.target.value); setSubcategory(''); }} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white text-sm focus:border-emerald-500 appearance-none">
                    <option value="" disabled>Select category...</option>
                    {activeCategories.map((c: any) => (
                      <option key={c.id} value={c.label}>{c.label}</option>
                    ))}
                    <option value="Other">Other</option>
                  </select>
                ) : (
                  <input type="text" value={category} onChange={e => setCategory(e.target.value)} required placeholder="Primary category..." className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white text-sm focus:border-emerald-500" />
                )}
              </div>
              
              {activeSubcategories.length > 0 && (
                 <div className="col-span-2 sm:col-span-1">
                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Subcategory</label>
                    <select value={subcategory} onChange={e => setSubcategory(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white text-sm focus:border-emerald-500 appearance-none">
                      <option value="">Select subcategory (Optional)</option>
                      {activeSubcategories.map((s: string) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                 </div>
              )}

              <div className="col-span-2">
                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">{domainLabels.brand}</label>
                <input type="text" value={brand} onChange={e => setBrand(e.target.value)} placeholder="Brand/Issuer" className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white text-sm focus:border-emerald-500" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Search Tags (comma separated)</label>
              <input type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="e.g. vintage, trendy, special" className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white text-sm focus:border-emerald-500" />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
               <h4 className="font-bold text-white">Details & Specs</h4>
               <button type="button" onClick={handleAIAssist} className="flex items-center gap-1 text-[10px] font-bold bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded-lg border border-indigo-500/50 hover:bg-indigo-500/40 transition">
                  <Sparkles className="w-3 h-3" /> AI Assist
               </button>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">{domainLabels.description}</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="Detailed product description..." className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white text-sm focus:border-emerald-500 resize-none" required />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Key Features / Highlights (1 per line)</label>
              <textarea value={keyFeatures} onChange={e => setKeyFeatures(e.target.value)} rows={3} placeholder="- Water resistant&#10;- Genuine Leather&#10;- 2 Year Warranty" className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white text-sm focus:border-emerald-500 resize-none" />
            </div>
            
            {category && (
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 mt-4">
                <h5 className="text-xs font-bold text-slate-300 mb-3">{category} Specifications</h5>
                <div className="grid grid-cols-2 gap-3">
                  {category === 'Fashion' && (
                    <>
                      <input type="text" placeholder="Material" value={specifications['material'] || ''} onChange={(e) => handleSpecChange('material', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-white text-xs" />
                      <input type="text" placeholder="Size/Fit" value={specifications['size'] || ''} onChange={(e) => handleSpecChange('size', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-white text-xs" />
                      <input type="text" placeholder="Care Instructions" value={specifications['care'] || ''} onChange={(e) => handleSpecChange('care', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-white text-xs col-span-2" />
                    </>
                  )}
                  {category === 'Electronics' && (
                    <>
                      <input type="text" placeholder="Model" value={specifications['model'] || ''} onChange={(e) => handleSpecChange('model', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-white text-xs" />
                      <input type="text" placeholder="Warranty" value={specifications['warranty'] || ''} onChange={(e) => handleSpecChange('warranty', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-white text-xs" />
                      <input type="text" placeholder="Compatibility" value={specifications['compatibility'] || ''} onChange={(e) => handleSpecChange('compatibility', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-white text-xs col-span-2" />
                    </>
                  )}
                  {(!['Fashion', 'Electronics'].includes(category)) && (
                    <>
                      <input type="text" placeholder="Feature 1" value={specifications['feature1'] || ''} onChange={(e) => handleSpecChange('feature1', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-white text-xs" />
                      <input type="text" placeholder="Feature 2" value={specifications['feature2'] || ''} onChange={(e) => handleSpecChange('feature2', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-white text-xs" />
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <h4 className="font-bold text-white mb-2">Sales & Operations</h4>
            
            <div className="grid grid-cols-2 gap-4 mb-2">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Transaction Type *</label>
                <select value={transactionType} onChange={e => setTransactionType(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white text-sm focus:border-emerald-500 appearance-none">
                  {TRANSACTION_TYPES.filter(type => {
                     const currentSegment = activeDomain.segments.find(s => s.id === segment);
                     return !currentSegment?.allowedTransactionTypes || currentSegment.allowedTransactionTypes.includes(type.id);
                  }).map(type => (
                    <option key={type.id} value={type.id}>{type.label} ({type.buttonText})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Pricing Model *</label>
                <select value={priceModel} onChange={e => setPriceModel(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white text-sm focus:border-emerald-500 appearance-none">
                  <option value="one_time">One-time (Fixed)</option>
                  <option value="recurring">Recurring (Subscription)</option>
                  <option value="per_hour">Per Hour</option>
                  <option value="per_day">Per Day</option>
                  <option value="per_person">Per Person</option>
                  <option value="per_event">Per Event / Session</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4">
               <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={durationRequired} onChange={e => setDurationRequired(e.target.checked)} className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500 w-4 h-4" />
                  Requires Duration Selection (e.g. Booking/Rent)
               </label>
               <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={depositRequired} onChange={e => setDepositRequired(e.target.checked)} className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500 w-4 h-4" />
                  Requires Deposit
               </label>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800">
              <div className="col-span-2 bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                <label className="text-xs font-bold text-slate-400 uppercase mb-3 block">{domainLabels.price} (Live Calculator)</label>
                <div className="flex flex-col sm:flex-row gap-3">
                   <div className="flex-1">
                      <span className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">Your Price</span>
                      <input type="number" required min="0" step="1" value={price} onChange={e => setPrice(e.target.value)} placeholder="0" className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white text-sm focus:border-emerald-500 font-mono" />
                   </div>
                   <div className="flex items-center justify-center sm:pt-5">
                      <span className="text-slate-500 font-black">+</span>
                   </div>
                   <div className="flex-1 bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 flex flex-col justify-center items-center mt-auto h-[46px] shadow-inner">
                      <span className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">Platform Fee</span>
                      <span className="text-emerald-400 text-xs font-bold">{(() => {
                         let rate = commissions[segment] || 0;
                         if (category) {
                            const catId = category.toLowerCase().replace(/[^a-z0-9]/g, '-');
                            if (commissions[`cat_${catId}`] !== undefined) rate = commissions[`cat_${catId}`];
                            if (subcategory && commissions[`subcat_${catId}_${subcategory}`] !== undefined) rate = commissions[`subcat_${catId}_${subcategory}`];
                         }
                         return rate;
                      })()}%</span>
                   </div>
                   <div className="flex items-center justify-center sm:pt-5">
                      <span className="text-slate-500 font-black">=</span>
                   </div>
                   <div className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl py-3 px-4 flex flex-col justify-center items-center mt-auto h-[46px] shadow-lg shadow-emerald-500/20">
                      <span className="text-[9px] text-emerald-100 font-black uppercase mb-0.5 opacity-80">Buyer Pays</span>
                      <span className="text-white text-sm font-black tracking-tight">NPR {price ? (parseFloat(price) * (1 + ((() => {
                         let rate = commissions[segment] || 0;
                         if (category) {
                            const catId = category.toLowerCase().replace(/[^a-z0-9]/g, '-');
                            if (commissions[`cat_${catId}`] !== undefined) rate = commissions[`cat_${catId}`];
                            if (subcategory && commissions[`subcat_${catId}_${subcategory}`] !== undefined) rate = commissions[`subcat_${catId}_${subcategory}`];
                         }
                         return rate;
                      })() / 100))).toFixed(0) : '0'}</span>
                   </div>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Discount (Optional)</label>
                <input type="number" min="0" step="1" value={discount} onChange={e => setDiscount(e.target.value)} placeholder="0" className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white text-sm focus:border-emerald-500 font-mono" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">{domainLabels.stock}</label>
                <input type="number" required min="1" step="1" value={stock} onChange={e => setStock(e.target.value)} placeholder="1" className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white text-sm focus:border-emerald-500 font-mono" />
              </div>
              {segment === 'wholesale' && (
                <>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Min. Order Qty (MOQ)</label>
                    <input type="number" required min="1" step="1" value={minOrderQuantity} onChange={e => setMinOrderQuantity(e.target.value)} placeholder="1" className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white text-sm focus:border-emerald-500 font-mono" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Bulk Discount Tiers (Qty:Discount%)</label>
                    <input type="text" value={discountTiersInput} onChange={e => setDiscountTiersInput(e.target.value)} placeholder="e.g. 10:5, 50:10" className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white text-sm focus:border-emerald-500 font-mono" />
                    <p className="text-[10px] text-slate-500 mt-1">Format: Quantity:Percentage. Comma separated.</p>
                  </div>
                </>
              )}
              {segment === 'group-purchase' && (
                <>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Min. Pledge Count (Target)</label>
                    <input type="number" required min="2" step="1" value={minPledgeCount} onChange={e => setMinPledgeCount(e.target.value)} placeholder="10" className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white text-sm focus:border-emerald-500 font-mono" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Target Price (NPR)</label>
                    <input type="number" required min="0" step="1" value={pricePerPersonAtMin} onChange={e => setPricePerPersonAtMin(e.target.value)} placeholder="e.g. 1500" className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white text-sm focus:border-emerald-500 font-mono" />
                    <p className="text-[10px] text-slate-500 mt-1">Price when target is reached.</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Expiry Days</label>
                    <input type="number" required min="1" step="1" value={expiryDays} onChange={e => setExpiryDays(e.target.value)} placeholder="7" className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white text-sm focus:border-emerald-500 font-mono" />
                    <p className="text-[10px] text-slate-500 mt-1">Number of days before deal expires.</p>
                  </div>
                </>
              )}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Processing Time</label>
                 <select value={processingTime} onChange={e => setProcessingTime(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white text-sm focus:border-emerald-500 appearance-none">
                  <option value="">Select...</option>
                  <option value="1-2 Days">1-2 Days</option>
                  <option value="3-5 Days">3-5 Days</option>
                  <option value="Made to Order">Made to Order</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">{domainLabels.delivery || 'Delivery Coverage'}</label>
              <input type="text" value={deliveryCoverage} onChange={e => setDeliveryCoverage(e.target.value)} placeholder="e.g. Nationwide, Kathmandu Valley only" className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white text-sm focus:border-emerald-500" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Return Policy</label>
              <select value={returnPolicy} onChange={e => setReturnPolicy(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white text-sm focus:border-emerald-500 appearance-none">
                  <option value="">Select...</option>
                  <option value="7 Days Return">7 Days Return</option>
                  <option value="14 Days Return">14 Days Return</option>
                  <option value="No Returns">No Returns</option>
                </select>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <h4 className="font-bold text-white mb-2">Review & Quality Score</h4>
            
            <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 shadow-xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                 <Sparkles className="w-24 h-24 text-emerald-500" />
               </div>
               <div className="relative z-10 flex flex-col items-center">
                 <div className="text-slate-400 text-xs font-bold uppercase mb-2">Listing Quality</div>
                 <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-emerald-400 to-teal-600 drop-shadow-md mb-2">
                   {listingQualityScore}%
                 </div>
                 
                 <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden mt-2 border border-slate-700">
                    <div 
                      className={`h-full transition-all duration-1000 ${listingQualityScore > 80 ? 'bg-emerald-500' : listingQualityScore > 50 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                      style={{ width: `${listingQualityScore}%` }} 
                    />
                 </div>
                 
                 <div className="mt-4 w-full flex flex-col gap-2">
                   {listingQualityScore < 100 && (
                     <div className="bg-amber-500/10 text-amber-500 text-[10px] font-bold p-2 rounded border border-amber-500/20">
                       💡 Tip: Add more detailed features, brand, and search tags to improve discoverability.
                     </div>
                   )}
                   {listingQualityScore >= 80 && (
                     <div className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold p-2 rounded border border-emerald-500/20 flex gap-1 items-center">
                       <CheckCircle2 className="w-3 h-3" /> Excellent listing! Ready to go live.
                     </div>
                   )}
                 </div>
               </div>
            </div>

            <div className="bg-black/30 rounded-xl p-4 border border-white/5 space-y-2 mt-4 text-xs shadow-inner max-h-[150px] overflow-y-auto">
               <div className="flex justify-between"><span className="text-slate-500">Title</span> <span className="text-white font-bold">{title || '-'}</span></div>
               <div className="flex justify-between"><span className="text-slate-500">Segment</span> <span className="text-white font-bold capitalize">{segment}</span></div>
               <div className="flex justify-between"><span className="text-slate-500">Price</span> <span className="text-white font-bold">NPR {price || '0'}</span></div>
               <div className="flex justify-between"><span className="text-slate-500">Category</span> <span className="text-white font-bold">{category || '-'}{subcategory ? ` > ${subcategory}` : ''}</span></div>
               <div className="flex justify-between"><span className="text-slate-500">Stock</span> <span className="text-white font-bold">{stock} Unit(s)</span></div>
               {segment === 'wholesale' && (
                 <div className="flex justify-between"><span className="text-slate-500">Min. Order Qty</span> <span className="text-white font-bold">{minOrderQuantity} Unit(s)</span></div>
               )}
            </div>
            
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
    <AnimatePresence>
      <div className="absolute inset-0 z-[60] flex flex-col pointer-events-none">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={!loading ? onClose : undefined}
          className="absolute inset-0 bg-black/80 backdrop-blur-md pointer-events-auto"
        />
        <motion.div 
          initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 350, damping: 40 }}
          className="absolute bottom-0 left-0 w-full h-[90vh] flex flex-col bg-slate-900 border-t border-slate-700 rounded-t-[32px] shadow-[0_-20px_40px_rgba(0,0,0,0.8)] pointer-events-auto"
        >
          <div className="flex justify-between items-center px-6 pt-5 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-white font-bold text-lg">Product Listing Manager</h3>
              <p className="text-xs text-slate-500 font-medium">Step {step} of {totalSteps}</p>
            </div>
            <button type="button" onClick={!loading ? onClose : undefined} className="bg-slate-800 p-2 rounded-full hover:bg-slate-700 text-white disabled:opacity-50" disabled={loading}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stepper Progress */}
          <div className="w-full bg-slate-800 h-1">
             <div className="bg-gradient-to-r from-emerald-400 to-teal-500 h-full transition-all duration-300" style={{ width: `${(step / totalSteps) * 100}%` }} />
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-3 rounded-xl text-sm flex gap-2 items-center mb-4">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}
            
            <form id="upload-form" onSubmit={handleSubmit} className="h-full relative">
               <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {renderStepContent()}
                  </motion.div>
               </AnimatePresence>
            </form>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-slate-800 bg-slate-900 flex gap-3 pb-safe">
             {loading ? (
                <div className="w-full space-y-2">
                  <div className="flex justify-between text-xs text-slate-400 font-bold px-1">
                    <span>Uploading & Optimizing...</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
                </div>
             ) : (
                <>
                  {step > 1 && (
                    <button type="button" onClick={prevStep} className="px-4 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition flex items-center justify-center">
                       <ChevronLeft className="w-5 h-5" />
                    </button>
                  )}
                  {step < totalSteps ? (
                    <button type="button" onClick={nextStep} className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 transition cursor-pointer">
                      Continue <ChevronRight className="w-5 h-5" />
                    </button>
                  ) : (
                    <button form="upload-form" type="submit" disabled={listingQualityScore < 50} className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-black flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 transition">
                      Publish Listing
                    </button>
                  )}
                </>
             )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
    {isCameraOpen && (
      <CameraCapture 
        onCapture={(file) => { addFiles([file]); setIsCameraOpen(false); }} 
        onClose={() => setIsCameraOpen(false)} 
      />
    )}
    </>
  );
}
