'use client';

import { useKidContext } from '../_lib/context';

export function KidSwitcher() {
  const { kids, selectedKid, setSelectedKid } = useKidContext();
  
  if (kids.length === 0) return null;
  
  return (
    <div className="flex gap-2">
      {kids.map(kid => (
        <button
          key={kid.id}
          onClick={() => setSelectedKid(kid)}
          className={`px-4 min-h-[44px] rounded-full text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand/50 ${
            selectedKid?.id === kid.id
              ? 'bg-brand text-white'
              : 'bg-surface-secondary text-content-muted hover:text-content'
          }`}
          aria-label={`Select ${kid.name}`}
        >
          {kid.avatar || kid.name.charAt(0).toUpperCase()}
        </button>
      ))}
    </div>
  );
}