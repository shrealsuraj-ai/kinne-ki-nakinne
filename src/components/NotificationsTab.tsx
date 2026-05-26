import React, { useState, useEffect } from 'react';
import { Bell, CheckSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy, doc, updateDoc } from 'firebase/firestore';

export default function NotificationsTab() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchNotifs = async () => {
      try {
        const q = query(
          collection(db, 'notifications'),
          where('userId', '==', user.uid)
        );
        const snap = await getDocs(q);
        let fetched = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
        
        // --- Generate System Notifications for Seller Products ---
        try {
          const { addDoc } = await import('firebase/firestore');
          const productQ = query(collection(db, 'products'), where('sellerId', '==', user.uid));
          const productSnap = await getDocs(productQ);
          
          let newlyCreated = false;
          for (const pDoc of productSnap.docs) {
             const product = pDoc.data();
             
             // Inventory threshold check
             if (product.stock !== undefined && product.stock <= 5) {
               const alreadyAlerted = fetched.some(n => n.productId === pDoc.id && n.type === 'low_stock' && !n.read);
               if (!alreadyAlerted) {
                 const stockNotif = {
                   userId: user.uid,
                   title: 'Low Stock Alert',
                   message: `Your product "${product.title}" is running low on inventory (Only ${product.stock} remaining). Re-stock soon!`,
                   read: false,
                   type: 'low_stock',
                   productId: pDoc.id,
                   timestamp: new Date()
                 };
                 const saved = await addDoc(collection(db, 'notifications'), stockNotif);
                 fetched.push({ id: saved.id, ...stockNotif, timestamp: { toMillis: () => Date.now() } });
                 newlyCreated = true;
               }
             }

             // Views spike check
             const viewThreshold = 50; // In a production app this would be more like 1000
             if (product.views !== undefined && product.views >= viewThreshold) {
                // Determine if we already sent a spike notif recently (or at all for this tier)
                const alreadyAlerted = fetched.some(n => n.productId === pDoc.id && n.type === 'view_spike' && n.viewThreshold === viewThreshold);
                if (!alreadyAlerted) {
                  const spikeNotif = {
                   userId: user.uid,
                   title: 'Trending Product Spike 🔥',
                   message: `Success! Your product "${product.title}" has crossed ${viewThreshold} views.`,
                   read: false,
                   type: 'view_spike',
                   productId: pDoc.id,
                   viewThreshold,
                   timestamp: new Date()
                 };
                 const saved = await addDoc(collection(db, 'notifications'), spikeNotif);
                 fetched.push({ id: saved.id, ...spikeNotif, timestamp: { toMillis: () => Date.now() } });
                 newlyCreated = true;
                }
             }
          }
        } catch (sysErr) {
           console.error("System notifications generation failed:", sysErr);
        }
        // -------------------------------------------------------------

        // Sort in memory to avoid needing immediate composite index
        fetched.sort((a, b) => {
           let timeA = 0;
           if (a.timestamp?.toMillis) timeA = a.timestamp.toMillis();
           else if (a.timestamp instanceof Date) timeA = a.timestamp.getTime();
           
           let timeB = 0;
           if (b.timestamp?.toMillis) timeB = b.timestamp.toMillis();
           else if (b.timestamp instanceof Date) timeB = b.timestamp.getTime();

           return timeB - timeA;
        });
        setNotifications(fetched);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    };
    fetchNotifs();
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
        <Bell className="w-4 h-4 text-emerald-400" /> Notifications
      </h3>
      {notifications.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center">
          <Bell className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-bold">No new notifications.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(notif => (
             <div key={notif.id} className={`p-4 rounded-xl border flex items-start gap-3 transition-colors ${notif.read ? 'bg-slate-900 border-slate-800 opacity-60' : 'bg-slate-800 border-emerald-500/30'}`}>
                <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${notif.read ? 'bg-slate-600' : 'bg-emerald-500 animate-pulse'}`} />
                <div className="flex-1">
                   <h4 className={`text-sm font-bold ${notif.read ? 'text-slate-300' : 'text-white'}`}>{notif.title || 'Notification'}</h4>
                   <p className="text-xs text-slate-400 mt-1 leading-relaxed">{notif.message}</p>
                   {notif.timestamp && <p className="text-[10px] text-slate-500 mt-2 font-bold">{new Date(notif.timestamp.toMillis()).toLocaleString()}</p>}
                </div>
                {!notif.read && (
                   <button onClick={() => markAsRead(notif.id)} className="p-2 -mr-2 -mt-2 text-slate-500 hover:text-emerald-400 transition" title="Mark as read">
                     <CheckSquare className="w-4 h-4" />
                   </button>
                )}
             </div>
          ))}
        </div>
      )}
    </div>
  );
}
