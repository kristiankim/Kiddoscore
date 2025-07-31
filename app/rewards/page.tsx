'use client';

import { RewardList } from '../_components/RewardList';
import { useKidContext } from '../_lib/context';
import Link from 'next/link';

export default function RewardsPage() {
  const { selectedKid } = useKidContext();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-start">
        <Link
          href="/"
          className="btn-secondary"
        >
          ← Back to Tasks
        </Link>
      </div>
      
      <RewardList />
    </div>
  );
}