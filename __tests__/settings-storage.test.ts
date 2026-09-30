import { afterEach, describe, expect, it, vi } from "vitest";

const { query, failure } = vi.hoisted(() => {
  const failure = { message: "Permission denied", code: "42501" };
  const query: any = {
    then: (resolve: any) =>
      Promise.resolve({ data: null, error: failure }).then(resolve),
  };
  for (const method of ["select", "order", "update", "delete", "eq", "insert"])
    query[method] = vi.fn(() => query);
  return { query, failure };
});
vi.mock("../app/_lib/supabase", () => ({
  supabase: { from: vi.fn(() => query) },
}));
vi.mock("../app/_lib/connectivity", () => ({ setBackendOffline: vi.fn() }));
import * as storage from "../app/_lib/supabase-storage";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("settings persistence failures", () => {
  it.each(["getKids", "getTasks", "getRewards", "getCompletions"] as const)(
    "%s rejects instead of reporting an empty household",
    async (operation) => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      await expect(storage[operation]()).rejects.toEqual(failure);
    },
  );

  it("rejects a denied point adjustment", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      storage.updateKid({ id: "kid", name: "Mia", points: 25 }),
    ).rejects.toEqual(failure);
  });

  it("rejects a denied task deletion", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(storage.removeTask("task")).rejects.toEqual(failure);
  });

  it("rejects a denied completion reset", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      storage.toggleCompletion("kid", "task", "2026-09-29", false),
    ).rejects.toEqual(failure);
  });
});
