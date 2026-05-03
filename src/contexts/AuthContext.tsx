import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  userRole: 'casual' | 'seller' | 'admin' | null;
  activeProfile: 'casual' | 'seller' | 'admin' | null;
  setActiveProfile: (role: 'casual' | 'seller' | 'admin' | null) => void;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userRole: null,
  activeProfile: null,
  setActiveProfile: () => {},
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'casual' | 'seller' | 'admin' | null>(null);
  const [activeProfile, setActiveProfile] = useState<'casual' | 'seller' | 'admin' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const adminDoc = await getDoc(doc(db, 'admins', currentUser.uid));
          if (adminDoc.exists()) {
            setUserRole('admin');
            setActiveProfile('admin');
          } else {
            const sellerDoc = await getDoc(doc(db, 'sellers', currentUser.uid));
            if (sellerDoc.exists()) {
              setUserRole('seller');
              setActiveProfile('seller');
            } else {
              const casualDoc = await getDoc(doc(db, 'casual_users', currentUser.uid));
              if (casualDoc.exists()) {
                setUserRole('casual');
                setActiveProfile('casual');
              } else {
                // Check the old 'users' collection just in case they were signed up before
                const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                if (userDoc.exists()) {
                  const role = userDoc.data().role as 'casual' | 'seller' | 'admin';
                  setUserRole(role);
                  setActiveProfile(role);
                } else {
                  setUserRole('casual'); // fallback
                  setActiveProfile('casual');
                }
              }
            }
          }
        } catch (error) {
          console.error("Error fetching user role", error);
          setUserRole('casual');
          setActiveProfile('casual');
        }
      } else {
        setUserRole(null);
        setActiveProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUserRole(null);
      setActiveProfile(null);
    } catch (error) {
      console.error('Error signing out', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userRole, activeProfile, setActiveProfile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
