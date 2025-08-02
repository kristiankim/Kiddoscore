import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Database types
export interface DatabaseUserProfile {
  id: string;
  email: string;
  family_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DatabaseKid {
  id: string;
  user_id: string;
  name: string;
  avatar?: string;
  points: number;
  created_at?: string;
  updated_at?: string;
}

export interface DatabaseTask {
  id: string;
  user_id: string;
  title: string;
  points: number;
  active: boolean;
  assigned_kids?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface DatabaseReward {
  id: string;
  user_id: string;
  label: string;
  cost: number;
  created_at?: string;
  updated_at?: string;
}

export interface DatabaseRedemption {
  id: string;
  user_id: string;
  kid_id: string;
  reward_id: string;
  label: string;
  cost: number;
  redeemed_at: string;
}

export interface DatabaseCompletion {
  id: string;
  user_id: string;
  kid_id: string;
  task_id: string;
  completed_date: string;
  created_at?: string;
}