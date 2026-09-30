import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("../app/_lib/storage", () => ({
  getKids: vi.fn(),
  getCompletions: vi.fn(),
  updateKid: vi.fn(),
  toggleCompletion: vi.fn(),
}));
vi.mock("../app/_lib/date", () => ({ today: () => "2026-09-29" }));
import * as storage from "../app/_lib/storage";
import { saveTaskCompletion } from "../app/_lib/tasks";
const kid = { id: "kid", name: "Mia", points: 40 };
const task = { id: "task", title: "Make bed", points: 5, active: true };
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(storage.getKids).mockResolvedValue([kid]);
  vi.mocked(storage.getCompletions).mockResolvedValue({});
});
describe("task save recovery", () => {
  it("restores the balance if saving the completion fails", async () => {
    vi.mocked(storage.toggleCompletion).mockRejectedValue(new Error("Denied"));
    await expect(
      saveTaskCompletion("kid", task, "2026-09-29", true),
    ).rejects.toThrow("Denied");
    expect(storage.updateKid).toHaveBeenNthCalledWith(1, {
      ...kid,
      points: 45,
    });
    expect(storage.updateKid).toHaveBeenLastCalledWith(kid);
  });
  it("does not add points for an already completed task", async () => {
    vi.mocked(storage.getCompletions).mockResolvedValue({
      "2026-09-29": { kid: { task: true } },
    });
    await saveTaskCompletion("kid", task, "2026-09-29", true);
    expect(storage.updateKid).toHaveBeenCalledWith(kid);
  });
  it("rejects edits to previous dates", async () => {
    await expect(
      saveTaskCompletion("kid", task, "2026-09-28", true),
    ).rejects.toThrow();
    expect(storage.updateKid).not.toHaveBeenCalled();
  });
  it("keeps the original completion snapshot intact", async () => {
    const completions = { "2026-09-29": { kid: { task: false } } };
    vi.mocked(storage.getCompletions).mockResolvedValue(completions);
    await saveTaskCompletion("kid", task, "2026-09-29", true);
    expect(completions["2026-09-29"].kid.task).toBe(false);
  });
  it("does not make a spent balance negative when undoing a task", async () => {
    vi.mocked(storage.getKids).mockResolvedValue([{ ...kid, points: 2 }]);
    vi.mocked(storage.getCompletions).mockResolvedValue({
      "2026-09-29": { kid: { task: true } },
    });
    await saveTaskCompletion("kid", task, "2026-09-29", false);
    expect(storage.updateKid).toHaveBeenCalledWith({ ...kid, points: 0 });
  });
});
