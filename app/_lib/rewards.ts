import * as storage from "./storage";
import { Redemption, Reward } from "./types";
import { redeemReward } from "./points";

// Read current balances before changing them, and compensate if the second write fails.
export async function redeemForKid(kidId: string, reward: Reward) {
  const [kids, rewards] = await Promise.all([
    storage.getKids(),
    storage.getRewards(),
  ]);
  const kid = kids.find((item) => item.id === kidId);
  const currentReward = rewards.find((item) => item.id === reward.id);
  if (!kid || !currentReward)
    throw new Error(
      "This child or reward is no longer available. Refresh rewards to continue.",
    );
  if (currentReward.cost !== reward.cost) {
    throw new Error(
      "This reward’s cost changed. Refresh rewards before redeeming.",
    );
  }
  if (!Number.isSafeInteger(currentReward.cost) || currentReward.cost < 1) {
    throw new Error("This reward needs a valid point cost in parent settings.");
  }
  const updated = redeemReward(kid, currentReward.cost);
  await storage.updateKid(updated);
  try {
    const redemption = await storage.addRedemption({
      kidId,
      rewardId: currentReward.id,
      label: currentReward.label,
      cost: currentReward.cost,
      at: new Date().toISOString(),
    });
    if (!redemption) throw new Error("The redemption could not be saved.");
  } catch (error) {
    await storage.updateKid(kid);
    throw error;
  }
}

export async function undoRedemption(redemption: Redemption) {
  const [kids, redemptions] = await Promise.all([
    storage.getKids(),
    storage.getRedemptions(),
  ]);
  const current = redemptions.find((item) => item.id === redemption.id);
  const kid = kids.find((item) => item.id === redemption.kidId);
  if (!current || !kid)
    throw new Error(
      "This redemption is no longer available. Refresh rewards to continue.",
    );
  await storage.updateKid({ ...kid, points: kid.points + current.cost });
  try {
    await storage.removeRedemption(current.id);
  } catch (error) {
    await storage.updateKid(kid);
    throw error;
  }
}
