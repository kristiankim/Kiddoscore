import { describe, expect, it } from "vitest";
import { getTaskStreak } from "../app/_lib/streaks";
import { Completions } from "../app/_lib/types";

function history(...dates: string[]): Completions {
  return Object.fromEntries(
    dates.map((date) => [date, { mia: { bed: true } }]),
  );
}

describe("daily task streaks", () => {
  it("starts at zero without history", () => {
    expect(getTaskStreak({}, "mia", "bed", "2026-09-30", true)).toBe(0);
  });
  it("counts today and consecutive previous days", () => {
    expect(
      getTaskStreak(
        history("2026-09-28", "2026-09-29", "2026-09-30"),
        "mia",
        "bed",
        "2026-09-30",
        true,
      ),
    ).toBe(3);
  });
  it("preserves yesterday’s streak while today is unfinished", () => {
    expect(
      getTaskStreak(
        history("2026-09-28", "2026-09-29"),
        "mia",
        "bed",
        "2026-09-30",
        true,
      ),
    ).toBe(2);
  });
  it("stops at the first missed day", () => {
    expect(
      getTaskStreak(
        history("2026-09-27", "2026-09-29", "2026-09-30"),
        "mia",
        "bed",
        "2026-09-30",
        true,
      ),
    ).toBe(2);
    expect(
      getTaskStreak(history("2026-09-28"), "mia", "bed", "2026-09-30", true),
    ).toBe(0);
  });
  it("does not count another child or task", () => {
    const saved = history("2026-09-30");
    expect(getTaskStreak(saved, "owen", "bed", "2026-09-30", true)).toBe(0);
    expect(getTaskStreak(saved, "mia", "teeth", "2026-09-30", true)).toBe(0);
  });
  it("treats an undone completion as missed", () => {
    const saved = history("2026-09-28", "2026-09-29", "2026-09-30");
    saved["2026-09-29"].mia.bed = false;
    expect(getTaskStreak(saved, "mia", "bed", "2026-09-30", true)).toBe(1);
  });
  it("reports a historical streak at the selected day, excluding future completions", () => {
    const saved = history("2026-09-28", "2026-09-29", "2026-09-30");
    expect(getTaskStreak(saved, "mia", "bed", "2026-09-29")).toBe(2);
    expect(getTaskStreak(saved, "mia", "bed", "2026-10-01")).toBe(0);
  });
  it.each([
    ["2026-01-01", "2025-12-31"],
    ["2024-03-01", "2024-02-29"],
    ["2026-03-09", "2026-03-08"],
    ["2026-11-02", "2026-11-01"],
  ])("counts across calendar boundaries: %s", (date, prior) => {
    expect(getTaskStreak(history(date, prior), "mia", "bed", date)).toBe(2);
  });
});
