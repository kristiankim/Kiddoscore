import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("../app/_lib/storage", () => ({
  getKids: vi.fn(),
  getRewards: vi.fn(),
  getRedemptions: vi.fn(),
  updateKid: vi.fn(),
  addRedemption: vi.fn(),
  removeRedemption: vi.fn(),
}));
import * as storage from "../app/_lib/storage";
import { redeemForKid, undoRedemption } from "../app/_lib/rewards";
const kid = { id: "kid", name: "Mia", points: 30 };
const reward = { id: "reward", label: "Movie", cost: 20 };
const redemption = {
  id: "redemption",
  kidId: "kid",
  rewardId: "reward",
  label: "Movie",
  cost: 20,
  at: "2026-09-29T12:00:00Z",
};
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(storage.getKids).mockResolvedValue([kid]);
  vi.mocked(storage.getRewards).mockResolvedValue([reward]);
  vi.mocked(storage.getRedemptions).mockResolvedValue([redemption]);
  vi.mocked(storage.addRedemption).mockResolvedValue(redemption);
});
describe("reward balances", () => {
  it("requires a new confirmation if the reward cost changes", async () => {
    await expect(redeemForKid("kid", { ...reward, cost: 5 })).rejects.toThrow(
      "cost changed",
    );
    expect(storage.updateKid).not.toHaveBeenCalled();
  });
  it("deducts the confirmed cost and saves the redemption", async () => {
    await redeemForKid("kid", reward);
    expect(storage.updateKid).toHaveBeenCalledWith({ ...kid, points: 10 });
    expect(storage.addRedemption).toHaveBeenCalledWith(
      expect.objectContaining({ cost: 20 }),
    );
  });
  it("rejects a redemption when the current balance is too low", async () => {
    vi.mocked(storage.getKids).mockResolvedValue([{ ...kid, points: 10 }]);
    await expect(redeemForKid("kid", reward)).rejects.toThrow(
      "Insufficient points",
    );
    expect(storage.updateKid).not.toHaveBeenCalled();
    expect(storage.addRedemption).not.toHaveBeenCalled();
  });
  it("restores points when saving the redemption fails", async () => {
    vi.mocked(storage.addRedemption).mockResolvedValue(null);
    await expect(redeemForKid("kid", reward)).rejects.toThrow();
    expect(storage.updateKid).toHaveBeenLastCalledWith(kid);
  });
  it("returns points from the saved redemption", async () => {
    await undoRedemption({ ...redemption, cost: 99 });
    expect(storage.updateKid).toHaveBeenCalledWith({ ...kid, points: 50 });
    expect(storage.removeRedemption).toHaveBeenCalledWith("redemption");
  });
  it("does not refund an already removed redemption", async () => {
    vi.mocked(storage.getRedemptions).mockResolvedValue([]);
    await expect(undoRedemption(redemption)).rejects.toThrow();
    expect(storage.updateKid).not.toHaveBeenCalled();
  });
  it("restores the balance if removing a redemption fails", async () => {
    vi.mocked(storage.removeRedemption).mockRejectedValue(new Error("Denied"));
    await expect(undoRedemption(redemption)).rejects.toThrow("Denied");
    expect(storage.updateKid).toHaveBeenLastCalledWith(kid);
  });
});
