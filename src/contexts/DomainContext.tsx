import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { DOMAINS as INITIAL_DOMAINS, Domain } from '../lib/domains';

interface DomainContextType {
  domains: Domain[];
  commissions: Record<string, number>;
  loading: boolean;
}

const DomainContext = createContext<DomainContextType>({
  domains: INITIAL_DOMAINS,
  commissions: {},
  loading: true,
});

export const DomainProvider = ({ children }: { children: React.ReactNode }) => {
  const [domains, setDomains] = useState<Domain[]>(INITIAL_DOMAINS);
  const [commissions, setCommissions] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'platform_configs', 'domain_settings'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.domains && data.domains.length > 0) {
           setDomains(data.domains);
        }
        if (data.commissions) {
           setCommissions(data.commissions);
        }
        setLoading(false);
      } else {
        // Init if missing
        setDoc(doc(db, 'platform_configs', 'domain_settings'), {
           domains: INITIAL_DOMAINS,
           commissions: {}
        }).then(() => setLoading(false)).catch(err => {
           console.error("Failed to init domains", err);
           setLoading(false);
        });
      }
    });
    return () => unsub();
  }, []);

  return <DomainContext.Provider value={{ domains, commissions, loading }}>{children}</DomainContext.Provider>;
};

export const useDomains = () => useContext(DomainContext);
