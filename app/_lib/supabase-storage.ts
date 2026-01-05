import { Kid, Task, Reward, Redemption, Completions } from './types';
import { supabase, DatabaseKid, DatabaseTask, DatabaseReward, DatabaseRedemption, DatabaseCompletion } from './supabase';
import { setBackendOffline } from './connectivity';

// Helper to handle Supabase errors and trigger offline mode if needed
function handleSupabaseError(error: any, context: string) {
  console.error(`Supabase error (${context}):`, error);
  // If it's a fetch error (unreachable), trigger offline mode
  if (error.message?.includes('Failed to fetch') || error.code === 'PGRST301') {
    setBackendOffline(true);
  }
}

// Transform database types to app types
function transformKid(dbKid: DatabaseKid): Kid {
  return {
    id: dbKid.id,
    name: dbKid.name,
    avatar: dbKid.avatar,
    points: dbKid.points
  };
}

function transformTask(dbTask: DatabaseTask): Task {
  return {
    id: dbTask.id,
    title: dbTask.title,
    points: dbTask.points,
    active: dbTask.active,
    assignedKids: dbTask.assigned_kids
  };
}

function transformReward(dbReward: DatabaseReward): Reward {
  return {
    id: dbReward.id,
    label: dbReward.label,
    cost: dbReward.cost
  };
}

function transformRedemption(dbRedemption: DatabaseRedemption): Redemption {
  return {
    id: dbRedemption.id,
    kidId: dbRedemption.kid_id,
    rewardId: dbRedemption.reward_id,
    label: dbRedemption.label,
    cost: dbRedemption.cost,
    at: dbRedemption.redeemed_at
  };
}

// Kids functions
export async function getKids(): Promise<Kid[]> {
  const { data, error } = await supabase
    .from('kids')
    .select('*')
    .order('name');

  if (error) {
    handleSupabaseError(error, 'fetching kids');
    return [];
  }

  return data.map(transformKid);
}

export async function setKids(kids: Kid[]): Promise<void> {
  // For simplicity, we'll handle individual kid updates rather than bulk replace
  // This function is mainly used for updating points, so we'll update each kid
  for (const kid of kids) {
    await updateKid(kid);
  }
}

export async function addKid(kid: Omit<Kid, 'id'>): Promise<Kid | null> {
  const { data, error } = await supabase
    .from('kids')
    .insert([{
      name: kid.name,
      avatar: kid.avatar,
      points: kid.points
    }])
    .select()
    .single();

  if (error) {
    console.error('Error adding kid:', error);
    return null;
  }

  return transformKid(data);
}

export async function updateKid(kid: Kid): Promise<void> {
  const { error } = await supabase
    .from('kids')
    .update({
      name: kid.name,
      avatar: kid.avatar,
      points: kid.points
    })
    .eq('id', kid.id);

  if (error) {
    console.error('Error updating kid:', error);
  }
}

export async function removeKid(kidId: string): Promise<void> {
  const { error } = await supabase
    .from('kids')
    .delete()
    .eq('id', kidId);

  if (error) {
    console.error('Error removing kid:', error);
  }
}

// Tasks functions
export async function getTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('title');

  if (error) {
    handleSupabaseError(error, 'fetching tasks');
    return [];
  }

  return data.map(transformTask);
}

export async function setTasks(tasks: Task[]): Promise<void> {
  // Similar to setKids, handle individual updates
  for (const task of tasks) {
    await updateTask(task);
  }
}

export async function addTask(task: Omit<Task, 'id'>): Promise<Task | null> {
  const { data, error } = await supabase
    .from('tasks')
    .insert([{
      title: task.title,
      points: task.points,
      active: task.active,
      assigned_kids: task.assignedKids
    }])
    .select()
    .single();

  if (error) {
    console.error('Error adding task:', error);
    return null;
  }

  return transformTask(data);
}

export async function updateTask(task: Task): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .update({
      title: task.title,
      points: task.points,
      active: task.active,
      assigned_kids: task.assignedKids
    })
    .eq('id', task.id);

  if (error) {
    console.error('Error updating task:', error);
  }
}

export async function removeTask(taskId: string): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);

  if (error) {
    console.error('Error removing task:', error);
  }
}

// Rewards functions
export async function getRewards(): Promise<Reward[]> {
  const { data, error } = await supabase
    .from('rewards')
    .select('*')
    .order('label');

  if (error) {
    handleSupabaseError(error, 'fetching rewards');
    return [];
  }

  return data.map(transformReward);
}

export async function setRewards(rewards: Reward[]): Promise<void> {
  // Handle individual updates
  for (const reward of rewards) {
    await updateReward(reward);
  }
}

export async function addReward(reward: Omit<Reward, 'id'>): Promise<Reward | null> {
  const { data, error } = await supabase
    .from('rewards')
    .insert([{
      label: reward.label,
      cost: reward.cost
    }])
    .select()
    .single();

  if (error) {
    console.error('Error adding reward:', error);
    return null;
  }

  return transformReward(data);
}

export async function updateReward(reward: Reward): Promise<void> {
  const { error } = await supabase
    .from('rewards')
    .update({
      label: reward.label,
      cost: reward.cost
    })
    .eq('id', reward.id);

  if (error) {
    console.error('Error updating reward:', error);
  }
}

export async function removeReward(rewardId: string): Promise<void> {
  const { error } = await supabase
    .from('rewards')
    .delete()
    .eq('id', rewardId);

  if (error) {
    console.error('Error removing reward:', error);
  }
}

// Redemptions functions
export async function getRedemptions(): Promise<Redemption[]> {
  const { data, error } = await supabase
    .from('redemptions')
    .select('*')
    .order('redeemed_at', { ascending: false });

  if (error) {
    console.error('Error fetching redemptions:', error);
    return [];
  }

  return data.map(transformRedemption);
}

export async function setRedemptions(redemptions: Redemption[]): Promise<void> {
  // This function is mainly used for adding new redemptions
  // We'll handle this through addRedemption instead
}

export async function addRedemption(redemption: Omit<Redemption, 'id'>): Promise<Redemption | null> {
  const { data, error } = await supabase
    .from('redemptions')
    .insert([{
      kid_id: redemption.kidId,
      reward_id: redemption.rewardId,
      label: redemption.label,
      cost: redemption.cost,
      redeemed_at: redemption.at
    }])
    .select()
    .single();

  if (error) {
    console.error('Error adding redemption:', error);
    return null;
  }

  return transformRedemption(data);
}

export async function removeRedemption(redemptionId: string): Promise<void> {
  const { error } = await supabase
    .from('redemptions')
    .delete()
    .eq('id', redemptionId);

  if (error) {
    console.error('Error removing redemption:', error);
  }
}

// Completions functions
export async function getCompletions(): Promise<Completions> {
  const { data, error } = await supabase
    .from('completions')
    .select('*');

  if (error) {
    console.error('Error fetching completions:', error);
    return {};
  }

  // Transform flat completion records into the nested structure
  const completions: Completions = {};

  for (const completion of data) {
    const date = completion.completed_date;
    const kidId = completion.kid_id;
    const taskId = completion.task_id;

    if (!completions[date]) {
      completions[date] = {};
    }
    if (!completions[date][kidId]) {
      completions[date][kidId] = {};
    }
    completions[date][kidId][taskId] = true;
  }

  return completions;
}

export async function setCompletions(completions: Completions): Promise<void> {
  // This is complex - we'd need to compare with existing and insert/delete as needed
  // For now, we'll handle individual completion toggles
}

export async function toggleCompletion(kidId: string, taskId: string, date: string, completed: boolean): Promise<void> {
  if (completed) {
    // Add completion
    const { error } = await supabase
      .from('completions')
      .insert([{
        kid_id: kidId,
        task_id: taskId,
        completed_date: date
      }]);

    if (error && error.code !== '23505') { // Ignore unique constraint violations
      console.error('Error adding completion:', error);
    }
  } else {
    // Remove completion
    const { error } = await supabase
      .from('completions')
      .delete()
      .eq('kid_id', kidId)
      .eq('task_id', taskId)
      .eq('completed_date', date);

    if (error) {
      console.error('Error removing completion:', error);
    }
  }
}

// Legacy functions for compatibility (will be replaced gradually)
export function getPasscode(): string | null {
  return null; // Implement if needed
}

export function setPasscode(passcode: string): void {
  // Implement if needed
}

export function verifyPasscode(passcode: string): boolean {
  return true; // Implement if needed
}