import { Kid, Task, Reward, Redemption, Completions } from './types';
import { uid } from './ids';

const STORAGE_KEYS = {
  kids: 'kiddo-score:kids',
  tasks: 'kiddo-score:tasks',
  rewards: 'kiddo-score:rewards',
  completions: 'kiddo-score:completions',
  redemptions: 'kiddo-score:redemptions',
  passcode: 'kiddo-score:passcode',
} as const;

function isClient(): boolean {
  return typeof window !== 'undefined';
}

function safeGet<T>(key: string, fallback: T): T {
  if (!isClient()) return fallback;
  
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function safeSet<T>(key: string, value: T): void {
  if (!isClient()) return;
  
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Silent fail
  }
}

export function getKids(): Kid[] {
  return safeGet(STORAGE_KEYS.kids, []);
}

export function setKids(kids: Kid[]): void {
  safeSet(STORAGE_KEYS.kids, kids);
}

export function getTasks(): Task[] {
  return safeGet(STORAGE_KEYS.tasks, []);
}

export function setTasks(tasks: Task[]): void {
  safeSet(STORAGE_KEYS.tasks, tasks);
}

export function getRewards(): Reward[] {
  return safeGet(STORAGE_KEYS.rewards, []);
}

export function setRewards(rewards: Reward[]): void {
  safeSet(STORAGE_KEYS.rewards, rewards);
}

export function getCompletions(): Completions {
  return safeGet(STORAGE_KEYS.completions, {});
}

export function setCompletions(completions: Completions): void {
  safeSet(STORAGE_KEYS.completions, completions);
}

export function getRedemptions(): Redemption[] {
  return safeGet(STORAGE_KEYS.redemptions, []);
}

export function setRedemptions(redemptions: Redemption[]): void {
  safeSet(STORAGE_KEYS.redemptions, redemptions);
}

export function getPasscode(): string | null {
  return safeGet(STORAGE_KEYS.passcode, null);
}

export function setPasscode(passcode: string): void {
  const hash = btoa(passcode);
  safeSet(STORAGE_KEYS.passcode, hash);
}

export function verifyPasscode(passcode: string): boolean {
  const stored = getPasscode();
  if (!stored) return false;
  return btoa(passcode) === stored;
}

export function seedData(): void {
  if (!isClient()) return;
  
  if (getKids().length === 0) {
    const kids: Kid[] = [
      { id: uid(), name: 'Eli', points: 50 },
      { id: uid(), name: 'Ethan', points: 35 },
      { id: uid(), name: 'Eleanor', points: 60 },
    ];
    setKids(kids);
  }
  
  if (getTasks().length === 0) {
    const tasks: Task[] = [
      { id: uid(), title: 'Do math workbook', points: 10, active: true },
      { id: uid(), title: 'Clean room', points: 8, active: true },
      { id: uid(), title: 'Put clothes in hamper', points: 5, active: true },
      { id: uid(), title: 'Put away dishes', points: 7, active: true },
    ];
    setTasks(tasks);
  }
  
  if (getRewards().length === 0) {
    const rewards: Reward[] = [
      { id: uid(), label: '15 min YouTube Kids', cost: 20 },
      { id: uid(), label: '30 min Game Time', cost: 30 },
      { id: uid(), label: 'Pick a dessert', cost: 25 },
    ];
    setRewards(rewards);
  }
}