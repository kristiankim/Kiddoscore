import { Kid, Task, Reward, Redemption, Completions } from './types';
import { uid } from './ids';
import { isBackendOffline, setBackendOffline } from './connectivity';

// Check if Supabase is configured (client-side check)
export function isSupabaseConfigured(): boolean {
  if (typeof window === 'undefined') return false;
  const hasConfig = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  return hasConfig && !isBackendOffline();
}

// Conditionally import Supabase functions
let supabaseStorage: any = null;
function getSupabaseStorage() {
  if (isBackendOffline()) return null;

  if (!supabaseStorage && isSupabaseConfigured()) {
    try {
      supabaseStorage = require('./supabase-storage');
    } catch (e) {
      console.error('Failed to load supabase-storage:', e);
      setBackendOffline(true);
      return null;
    }
  }
  return supabaseStorage;
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
  const supabase = getSupabaseStorage();
  if (supabase) {
    return await supabase.getKids();
  }
  return safeGet(STORAGE_KEYS.kids, []);
}

export async function setKids(kids: Kid[]): Promise<void> {
  const supabase = getSupabaseStorage();
  if (supabase) {
    return await supabase.setKids(kids);
  }
  safeSet(STORAGE_KEYS.kids, kids);
}

export async function getTasks(): Promise<Task[]> {
  const supabase = getSupabaseStorage();
  if (supabase) {
    return await supabase.getTasks();
  }
  return safeGet(STORAGE_KEYS.tasks, []);
}

export async function setTasks(tasks: Task[]): Promise<void> {
  const supabase = getSupabaseStorage();
  if (supabase) {
    return await supabase.setTasks(tasks);
  }
  safeSet(STORAGE_KEYS.tasks, tasks);
}

export async function getRewards(): Promise<Reward[]> {
  const supabase = getSupabaseStorage();
  if (supabase) {
    return await supabase.getRewards();
  }
  return safeGet(STORAGE_KEYS.rewards, []);
}

export async function setRewards(rewards: Reward[]): Promise<void> {
  const supabase = getSupabaseStorage();
  if (supabase) {
    return await supabase.setRewards(rewards);
  }
  safeSet(STORAGE_KEYS.rewards, rewards);
}

export async function getCompletions(): Promise<Completions> {
  const supabase = getSupabaseStorage();
  if (supabase) {
    return await supabase.getCompletions();
  }
  return safeGet(STORAGE_KEYS.completions, {});
}

export async function setCompletions(completions: Completions): Promise<void> {
  const supabase = getSupabaseStorage();
  if (supabase) {
    return await supabase.setCompletions(completions);
  }
  safeSet(STORAGE_KEYS.completions, completions);
}

export async function getRedemptions(): Promise<Redemption[]> {
  const supabase = getSupabaseStorage();
  if (supabase) {
    return await supabase.getRedemptions();
  }
  return safeGet(STORAGE_KEYS.redemptions, []);
}

export async function setRedemptions(redemptions: Redemption[]): Promise<void> {
  const supabase = getSupabaseStorage();
  if (supabase) {
    return await supabase.setRedemptions(redemptions);
  }
  safeSet(STORAGE_KEYS.redemptions, redemptions);
}

// Individual CRUD operations for Supabase
export async function addKid(kid: Omit<Kid, 'id'>): Promise<Kid | null> {
  const supabase = getSupabaseStorage();
  if (supabase) {
    return await supabase.addKid(kid);
  }
  // Fallback to localStorage
  const newKid: Kid = { ...kid, id: uid() };
  const kids = await getKids();
  const updatedKids = [...kids, newKid];
  await setKids(updatedKids);
  return newKid;
}

export async function updateKid(kid: Kid): Promise<void> {
  const supabase = getSupabaseStorage();
  if (supabase) {
    return await supabase.updateKid(kid);
  }
  // Fallback to localStorage
  const kids = await getKids();
  const updatedKids = kids.map(k => k.id === kid.id ? kid : k);
  await setKids(updatedKids);
}

export async function removeKid(kidId: string): Promise<void> {
  const supabase = getSupabaseStorage();
  if (supabase) {
    return await supabase.removeKid(kidId);
  }
  // Fallback to localStorage
  const kids = await getKids();
  const updatedKids = kids.filter(k => k.id !== kidId);
  await setKids(updatedKids);
}

export async function addTask(task: Omit<Task, 'id'>): Promise<Task | null> {
  const supabase = getSupabaseStorage();
  if (supabase) {
    return await supabase.addTask(task);
  }
  // Fallback to localStorage
  const newTask: Task = { ...task, id: uid() };
  const tasks = await getTasks();
  const updatedTasks = [...tasks, newTask];
  await setTasks(updatedTasks);
  return newTask;
}

export async function updateTask(task: Task): Promise<void> {
  const supabase = getSupabaseStorage();
  if (supabase) {
    return await supabase.updateTask(task);
  }
  // Fallback to localStorage
  const tasks = await getTasks();
  const updatedTasks = tasks.map(t => t.id === task.id ? task : t);
  await setTasks(updatedTasks);
}

export async function removeTask(taskId: string): Promise<void> {
  const supabase = getSupabaseStorage();
  if (supabase) {
    return await supabase.removeTask(taskId);
  }
  // Fallback to localStorage
  const tasks = await getTasks();
  const updatedTasks = tasks.filter(t => t.id !== taskId);
  await setTasks(updatedTasks);
}

export async function addReward(reward: Omit<Reward, 'id'>): Promise<Reward | null> {
  const supabase = getSupabaseStorage();
  if (supabase) {
    return await supabase.addReward(reward);
  }
  // Fallback to localStorage
  const newReward: Reward = { ...reward, id: uid() };
  const rewards = await getRewards();
  const updatedRewards = [...rewards, newReward];
  await setRewards(updatedRewards);
  return newReward;
}

export async function updateReward(reward: Reward): Promise<void> {
  const supabase = getSupabaseStorage();
  if (supabase) {
    return await supabase.updateReward(reward);
  }
  // Fallback to localStorage
  const rewards = await getRewards();
  const updatedRewards = rewards.map(r => r.id === reward.id ? reward : r);
  await setRewards(updatedRewards);
}

export async function removeReward(rewardId: string): Promise<void> {
  const supabase = getSupabaseStorage();
  if (supabase) {
    return await supabase.removeReward(rewardId);
  }
  // Fallback to localStorage
  const rewards = await getRewards();
  const updatedRewards = rewards.filter(r => r.id !== rewardId);
  await setRewards(updatedRewards);
}

export async function addRedemption(redemption: Omit<Redemption, 'id'>): Promise<Redemption | null> {
  const supabase = getSupabaseStorage();
  if (supabase) {
    return await supabase.addRedemption(redemption);
  }
  // Fallback to localStorage
  const newRedemption: Redemption = { ...redemption, id: uid() };
  const redemptions = await getRedemptions();
  const updatedRedemptions = [...redemptions, newRedemption];
  await setRedemptions(updatedRedemptions);
  return newRedemption;
}

export async function removeRedemption(redemptionId: string): Promise<void> {
  const supabase = getSupabaseStorage();
  if (supabase) {
    return await supabase.removeRedemption(redemptionId);
  }
  // Fallback to localStorage
  const redemptions = await getRedemptions();
  const updatedRedemptions = redemptions.filter(r => r.id !== redemptionId);
  await setRedemptions(updatedRedemptions);
}

export async function toggleCompletion(kidId: string, taskId: string, date: string, completed: boolean): Promise<void> {
  const supabase = getSupabaseStorage();
  if (supabase) {
    return await supabase.toggleCompletion(kidId, taskId, date, completed);
  }
  // Fallback to localStorage
  const completions = await getCompletions();
  if (!completions[date]) completions[date] = {};
  if (!completions[date][kidId]) completions[date][kidId] = {};

  if (completed) {
    completions[date][kidId][taskId] = true;
  } else {
    delete completions[date][kidId][taskId];
  }

  await setCompletions(completions);
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