import { afterEach, expect, it, vi } from "vitest";
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.resetModules();
});
it("preserves deliberately empty lists when reopening the local app", async () => {
  const values = new Map<string, string>([
    ["sparkquest:kids", "[]"],
    ["sparkquest:tasks", "[]"],
    ["sparkquest:rewards", "[]"],
  ]);
  vi.stubGlobal("window", {});
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  });
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
  const storage = await import("../app/_lib/storage");
  await storage.seedData();
  expect(await storage.getKids()).toEqual([]);
  expect(await storage.getTasks()).toEqual([]);
  expect(await storage.getRewards()).toEqual([]);
});
