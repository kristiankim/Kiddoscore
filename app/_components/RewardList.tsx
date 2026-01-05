'use client';

import { useState, useEffect } from 'react';
import { Reward, Redemption } from '../_lib/types';
import { useKidContext } from '../_lib/context';
import { getRewards, getRedemptions, updateKid, addRedemption, removeRedemption } from '../_lib/storage';
import { redeemReward } from '../_lib/points';
import { ConfirmDialog } from './ConfirmDialog';

export function RewardList() {
  const { selectedKid, refreshKids, isLoading: kidsLoading } = useKidContext();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptionsState] = useState<Redemption[]>([]);
  const [confirmReward, setConfirmReward] = useState<Reward | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<Redemption | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isLoadingRewards, setIsLoadingRewards] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoadingRewards(true);
      setRewards(await getRewards());
      setRedemptionsState(await getRedemptions());
      setIsLoadingRewards(false);
    };
    loadData();
  }, []);

  if (kidsLoading || isLoadingRewards) {
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="h-6 bg-gray-200 rounded animate-pulse w-20"></div>

          <div className="flex items-center gap-3 p-4 bg-gray-100 rounded-lg">
            <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="space-y-1">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-24"></div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="card">
                <div className="flex flex-col gap-3">
                  <div className="space-y-1">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
                  </div>
                  <div className="h-9 bg-gray-200 rounded animate-pulse w-full"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!selectedKid) {
    return <div className="text-gray-500">Select a kid to see rewards</div>;
  }

  const kidRedemptions = redemptions
    .filter(r => r.kidId === selectedKid.id)
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 5);

  const handleRedeem = async (reward: Reward) => {
    if (selectedKid.points < reward.cost) return;

    try {
      const updatedKid = redeemReward(selectedKid, reward.cost);

      await updateKid(updatedKid);

      const newRedemption = await addRedemption({
        kidId: selectedKid.id,
        rewardId: reward.id,
        label: reward.label,
        cost: reward.cost,
        at: new Date().toISOString()
      });

      if (newRedemption) {
        const currentRedemptions = await getRedemptions();
        setRedemptionsState(currentRedemptions);
      }

      refreshKids();
      setConfirmReward(null);

      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 600);
    } catch (error) {
      console.error('Redemption failed:', error);
    }
  };

  const handleCancelRedemption = async (redemption: Redemption) => {
    try {
      if (!selectedKid) return;

      // Add points back to the kid
      await updateKid({ ...selectedKid, points: selectedKid.points + redemption.cost });

      // Remove the redemption
      await removeRedemption(redemption.id);
      const updatedRedemptions = await getRedemptions();
      setRedemptionsState(updatedRedemptions);

      refreshKids();
      setConfirmCancel(null);
    } catch (error) {
      console.error('Cancel redemption failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Rewards</h2>

        {selectedKid && (
          <div className="glass-card flex items-center gap-4 bg-indigo-50/50 border-indigo-100">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-indigo-100" style={{ backgroundColor: 'hsl(var(--brand))' }}>
              {selectedKid.avatar || selectedKid.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Currently selected</div>
              <div className="font-bold text-gray-900 border-b border-indigo-100 pb-0.5 inline-block">{selectedKid.name}</div>
              <div className="text-md font-bold text-indigo-600 mt-1">{selectedKid.points} points <span className="text-gray-400 font-normal">available</span></div>
            </div>
          </div>
        )}

        {rewards.length === 0 ? (
          <div className="text-gray-500 py-10 text-center">No rewards available yet</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {rewards.map(reward => {
              const canAfford = selectedKid.points >= reward.cost;

              return (
                <div key={reward.id} className={`glass-card flex flex-col justify-between gap-4 transition-all duration-300 ${canAfford ? 'hover:scale-[1.02] hover:shadow-xl' : 'opacity-70'}`}>
                  <div>
                    <div className="font-bold text-gray-900 text-lg leading-tight">{reward.label}</div>
                    <div className="text-sm font-semibold text-gray-500 mt-1">{reward.cost} points required</div>
                  </div>

                  <button
                    onClick={() => setConfirmReward(reward)}
                    disabled={!canAfford}
                    className={`w-full py-3 ${canAfford ? 'btn-primary' : 'btn-secondary text-gray-400'}`}
                    aria-label={`Redeem ${reward.label} for ${reward.cost} points`}
                  >
                    {canAfford ? 'Redeem for Points' : 'Need more points'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {kidRedemptions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-md font-medium text-gray-900">Recent Redemptions</h3>

          <div className="space-y-2">
            {kidRedemptions.map(redemption => (
              <div key={redemption.id} className="card bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-gray-900">{redemption.label}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(redemption.at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-gray-600">-{redemption.cost} pts</div>
                    <button
                      onClick={() => setConfirmCancel(redemption)}
                      className="btn-danger text-xs px-2 py-1"
                      title="Cancel redemption and return points"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {confirmReward && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setConfirmReward(null)}
          onConfirm={() => handleRedeem(confirmReward)}
          title="Redeem Reward"
          message={`Redeem "${confirmReward.label}" for ${confirmReward.cost} points?`}
          confirmText="Redeem"
        />
      )}

      {confirmCancel && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setConfirmCancel(null)}
          onConfirm={() => handleCancelRedemption(confirmCancel)}
          title="Cancel Redemption"
          message={`Cancel "${confirmCancel.label}" redemption and return ${confirmCancel.cost} points to ${selectedKid?.name}?`}
          confirmText="Cancel Redemption"
        />
      )}

      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-50">
          <div className="relative">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="confetti-particle"
                style={{
                  left: `${Math.random() * 100 - 50}px`,
                  top: `${Math.random() * 100 - 50}px`,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}