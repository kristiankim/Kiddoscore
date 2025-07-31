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
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            selectedKid?.id === kid.id
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          aria-label={`Select ${kid.name}`}
        >
          {kid.avatar || kid.name.charAt(0).toUpperCase()}
        </button>
      ))}
    </div>
  );
}