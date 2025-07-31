import { Kid, Task, Completions } from './types';
import { today } from './date';

export function applyTaskToggle(
  kid: Kid,
  task: Task,
  isCompleted: boolean,
  completions: Completions
): { kid: Kid; completions: Completions } {
  const todayKey = today();
  const newCompletions = { ...completions };
  
  if (!newCompletions[todayKey]) {
    newCompletions[todayKey] = {};
  }
  if (!newCompletions[todayKey][kid.id]) {
    newCompletions[todayKey][kid.id] = {};
  }
  
  const wasCompleted = newCompletions[todayKey][kid.id][task.id] || false;
  newCompletions[todayKey][kid.id][task.id] = isCompleted;
  
  let pointsDelta = 0;
  if (isCompleted && !wasCompleted) {
    pointsDelta = task.points;
  } else if (!isCompleted && wasCompleted) {
    pointsDelta = -task.points;
  }
  
  return {
    kid: { ...kid, points: kid.points + pointsDelta },
    completions: newCompletions
  };
}

export function redeemReward(kid: Kid, cost: number): Kid {
  if (kid.points < cost) {
    throw new Error('Insufficient points');
  }
  
  return { ...kid, points: kid.points - cost };
}

export function recalcPointsFromCompletions(
  kid: Kid,
  tasks: Task[],
  completions: Completions
): number {
  let total = 0;
  
  Object.values(completions).forEach(dayCompletions => {
    const kidCompletions = dayCompletions[kid.id] || {};
    
    Object.entries(kidCompletions).forEach(([taskId, isCompleted]) => {
      if (isCompleted) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          total += task.points;
        }
      }
    });
  });
  
  return total;
}

export function getTodayCompletions(kidId: string, completions: Completions): Record<string, boolean> {
  const todayKey = today();
  return completions[todayKey]?.[kidId] || {};
}

export function clearTodayCompletions(kidId: string, completions: Completions): Completions {
  const todayKey = today();
  const newCompletions = { ...completions };
  
  if (newCompletions[todayKey]?.[kidId]) {
    delete newCompletions[todayKey][kidId];
    
    if (Object.keys(newCompletions[todayKey]).length === 0) {
      delete newCompletions[todayKey];
    }
  }
  
  return newCompletions;
}

export function clearAllCompletions(): Completions {
  return {};
}