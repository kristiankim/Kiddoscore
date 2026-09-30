import * as storage from "./storage";
import { applyTaskToggle } from "./points";
import { today } from "./date";
import { Task } from "./types";

export async function saveTaskCompletion(
  kidId: string,
  task: Task,
  date: string,
  completed: boolean,
) {
  if (date !== today()) throw new Error("Only today’s tasks can be changed.");
  const [kids, completions] = await Promise.all([
    storage.getKids(),
    storage.getCompletions(),
  ]);
  const kid = kids.find((item) => item.id === kidId);
  if (!kid) throw new Error("Child no longer exists");
  const result = applyTaskToggle(kid, task, completed, completions);
  await storage.updateKid(result.kid);
  try {
    await storage.toggleCompletion(kidId, task.id, date, completed);
  } catch (error) {
    await storage.updateKid(kid);
    throw error;
  }
  return result;
}
