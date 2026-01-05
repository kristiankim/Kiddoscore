'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Kid } from './types';
import { getKids, seedData } from './storage';

interface KidContextType {
  selectedKid: Kid | null;
  setSelectedKid: (kid: Kid) => void;
  kids: Kid[];
  refreshKids: () => void;
  isLoading: boolean;
}

const KidContext = createContext<KidContextType | null>(null);

export function KidProvider({ children }: { children: ReactNode }) {
  const [selectedKid, setSelectedKid] = useState<Kid | null>(null);
  const [kids, setKids] = useState<Kid[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshKids = async () => {
    const isInitialLoad = kids.length === 0;
    if (isInitialLoad) {
      setIsLoading(true);
    }

    try {
      const currentKids = await getKids();
      setKids(currentKids);

      if (!selectedKid && currentKids.length > 0) {
        setSelectedKid(currentKids[0]);
      } else if (selectedKid) {
        const updated = currentKids.find(k => k.id === selectedKid.id);
        if (updated) {
          setSelectedKid(updated);
        }
      }
    } finally {
      if (isInitialLoad) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      await seedData();
      await refreshKids();
    };
    initializeData();
  }, []);

  return (
    <KidContext.Provider value={{ selectedKid, setSelectedKid, kids, refreshKids, isLoading }}>
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