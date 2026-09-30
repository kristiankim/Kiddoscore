import { Completions } from "./types";

function previousDay(date: string): string {
  // Move by calendar day at local noon so DST does not skip or repeat dates.
  const day = new Date(`${date}T12:00:00`);
  day.setDate(day.getDate() - 1);
  return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
}

/** Today's unfinished task keeps yesterday's streak until the day is over. */
export function getTaskStreak(
  completions: Completions,
  kidId: string,
  taskId: string,
  date: string,
  allowYesterday = false,
): number {
  let cursor = date;
  if (allowYesterday && !completions[cursor]?.[kidId]?.[taskId]) {
    cursor = previousDay(cursor);
  }
  let streak = 0;
  while (completions[cursor]?.[kidId]?.[taskId]) {
    streak += 1;
    cursor = previousDay(cursor);
  }
  return streak;
}
