export interface Kid {
  id: string;
  name: string;
  avatar?: string;
  points: number;
}

export interface Task {
  id: string;
  title: string;
  points: number;
  active: boolean;
  assignedKids?: string[]; // Array of kid IDs, empty/undefined means assigned to all
}

export interface Reward {
  id: string;
  label: string;
  cost: number;
}

export interface Redemption {
  id: string;
  kidId: string;
  rewardId: string;
  label: string;
  cost: number;
  at: string;
}

export type Completions = Record<string, Record<string, Record<string, boolean>>>;