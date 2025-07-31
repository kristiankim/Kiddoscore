'use client';

import { useState, useEffect, useRef } from 'react';

export function useLocalStorageState<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [state, setState] = useState<T>(initialValue);
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const item = localStorage.getItem(key);
        if (item) {
          setState(JSON.parse(item));
        }
      } catch {
        // Use initial value
      }
    }
  }, [key]);
  
  const setValue = (value: T) => {
    setState(value);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(key, JSON.stringify(value));
        } catch {
          // Silent fail
        }
      }
    }, 100);
  };
  
  return [state, setValue];
}