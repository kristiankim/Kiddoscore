"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Kid } from "./types";
import { getKids, seedData } from "./storage";

interface KidContextType {
  selectedKid: Kid | null;
  setSelectedKid: (kid: Kid) => void;
  kids: Kid[];
  refreshKids: () => Promise<void>;
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
        const updated = currentKids.find((k) => k.id === selectedKid.id);
        setSelectedKid(updated || currentKids[0] || null);
      }
    } finally {
      if (isInitialLoad) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      try {
        await seedData();
        await refreshKids();
      } catch {
        setIsLoading(false);
      }
    };
    initializeData();
  }, []);

  return (
    <KidContext.Provider
      value={{ selectedKid, setSelectedKid, kids, refreshKids, isLoading }}
    >
      {children}
    </KidContext.Provider>
  );
}

export function useKidContext() {
  const context = useContext(KidContext);
  if (!context) {
    throw new Error("useKidContext must be used within KidProvider");
  }
  return context;
}
