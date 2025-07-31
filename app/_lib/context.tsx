'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Kid } from './types';
import { getKids, seedData } from './storage';

interface KidContextType {
  selectedKid: Kid | null;
  setSelectedKid: (kid: Kid) => void;
  kids: Kid[];
  refreshKids: () => void;
}

const KidContext = createContext<KidContextType | null>(null);

export function KidProvider({ children }: { children: ReactNode }) {
  const [selectedKid, setSelectedKid] = useState<Kid | null>(null);
  const [kids, setKids] = useState<Kid[]>([]);
  
  const refreshKids = () => {
    const currentKids = getKids();
    setKids(currentKids);
    
    if (!selectedKid && currentKids.length > 0) {
      setSelectedKid(currentKids[0]);
    } else if (selectedKid) {
      const updated = currentKids.find(k => k.id === selectedKid.id);
      if (updated) {
        setSelectedKid(updated);
      }
    }
  };
  
  useEffect(() => {
    seedData();
    refreshKids();
  }, []);
  
  return (
    <KidContext.Provider value={{ selectedKid, setSelectedKid, kids, refreshKids }}>
      {children}
    </KidContext.Provider>
  );
}

export function useKidContext() {
  const context = useContext(KidContext);
  if (!context) {
    throw new Error('useKidContext must be used within KidProvider');
  }
  return context;
}