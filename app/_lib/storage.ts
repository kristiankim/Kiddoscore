import { Kid, Task, Reward, Redemption, Completions } from './types';
import { uid } from './ids';

// Check if Supabase is configured
const useSupabase = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// Conditionally import Supabase functions
let supabaseStorage: any = null;
if (useSupabase) {
  supabaseStorage = require('./supabase-storage');
}

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

export async function getKids(): Promise<Kid[]> {
  if (useSupabase && supabaseStorage) {
    return await supabaseStorage.getKids();
  }
  return safeGet(STORAGE_KEYS.kids, []);
}

export async function setKids(kids: Kid[]): Promise<void> {
  if (useSupabase && supabaseStorage) {
    return await supabaseStorage.setKids(kids);
  }
  safeSet(STORAGE_KEYS.kids, kids);
}

export async function getTasks(): Promise<Task[]> {
  if (useSupabase && supabaseStorage) {
    return await supabaseStorage.getTasks();
  }
  return safeGet(STORAGE_KEYS.tasks, []);
}

export async function setTasks(tasks: Task[]): Promise<void> {
  if (useSupabase && supabaseStorage) {
    return await supabaseStorage.setTasks(tasks);
  }
  safeSet(STORAGE_KEYS.tasks, tasks);
}

export async function getRewards(): Promise<Reward[]> {
  if (useSupabase && supabaseStorage) {
    return await supabaseStorage.getRewards();
  }
  return safeGet(STORAGE_KEYS.rewards, []);
}

export async function setRewards(rewards: Reward[]): Promise<void> {
  if (useSupabase && supabaseStorage) {
    return await supabaseStorage.setRewards(rewards);
  }
  safeSet(STORAGE_KEYS.rewards, rewards);
}

export async function getCompletions(): Promise<Completions> {
  if (useSupabase && supabaseStorage) {
    return await supabaseStorage.getCompletions();
  }
  return safeGet(STORAGE_KEYS.completions, {});
}

export async function setCompletions(completions: Completions): Promise<void> {
  if (useSupabase && supabaseStorage) {
    return await supabaseStorage.setCompletions(completions);
  }
  safeSet(STORAGE_KEYS.completions, completions);
}

export async function getRedemptions(): Promise<Redemption[]> {
  if (useSupabase && supabaseStorage) {
    return await supabaseStorage.getRedemptions();
  }
  return safeGet(STORAGE_KEYS.redemptions, []);
}

export async function setRedemptions(redemptions: Redemption[]): Promise<void> {
  if (useSupabase && supabaseStorage) {
    return await supabaseStorage.setRedemptions(redemptions);
  }
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

export async function seedData(): Promise<void> {
  if (!isClient()) return;
  
  const kids = await getKids();
  if (kids.length === 0) {
    const seedKids: Kid[] = [
      { id: uid(), name: 'Eli', points: 50 },
      { id: uid(), name: 'Ethan', points: 35 },
      { id: uid(), name: 'Eleanor', points: 60 },
    ];
    await setKids(seedKids);
  }
  
  const tasks = await getTasks();
  if (tasks.length === 0) {
    const seedTasks: Task[] = [
      { id: uid(), title: 'Do math workbook', points: 10, active: true },
      { id: uid(), title: 'Clean room', points: 8, active: true },
      { id: uid(), title: 'Put clothes in hamper', points: 5, active: true },
      { id: uid(), title: 'Put away dishes', points: 7, active: true },
    ];
    await setTasks(seedTasks);
  }
  
  const rewards = await getRewards();
  if (rewards.length === 0) {
    const seedRewards: Reward[] = [
      { id: uid(), label: '15 min YouTube Kids', cost: 20 },
      { id: uid(), label: '30 min Game Time', cost: 30 },
      { id: uid(), label: 'Pick a dessert', cost: 25 },
    ];
    await setRewards(seedRewards);
  }
}