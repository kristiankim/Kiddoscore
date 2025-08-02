-- Kiddoscore Database Schema with Authentication
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  family_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kids table (now belongs to a user/family)
CREATE TABLE kids (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar VARCHAR(255),
  points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks table (now belongs to a user/family)
CREATE TABLE tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  points INTEGER NOT NULL,
  active BOOLEAN DEFAULT true,
  assigned_kids UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rewards table (now belongs to a user/family)
CREATE TABLE rewards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  label VARCHAR(255) NOT NULL,
  cost INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Redemptions table
CREATE TABLE redemptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  kid_id UUID REFERENCES kids(id) ON DELETE CASCADE,
  reward_id UUID REFERENCES rewards(id) ON DELETE CASCADE,
  label VARCHAR(255) NOT NULL,
  cost INTEGER NOT NULL,
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Completions table
CREATE TABLE completions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  kid_id UUID REFERENCES kids(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  completed_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(kid_id, task_id, completed_date)
);

-- Indexes for better performance
CREATE INDEX idx_kids_user_id ON kids(user_id);
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_rewards_user_id ON rewards(user_id);
CREATE INDEX idx_completions_user_id ON completions(user_id);
CREATE INDEX idx_completions_kid_date ON completions(kid_id, completed_date);
CREATE INDEX idx_completions_task_date ON completions(task_id, completed_date);
CREATE INDEX idx_redemptions_user_id ON redemptions(user_id);
CREATE INDEX idx_redemptions_kid ON redemptions(kid_id);
CREATE INDEX idx_redemptions_redeemed_at ON redemptions(redeemed_at);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kids_updated_at BEFORE UPDATE ON kids
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rewards_updated_at BEFORE UPDATE ON rewards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) with proper user-based policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE kids ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE completions ENABLE ROW LEVEL SECURITY;

-- User profiles policy - users can only access their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Kids policies - users can only access kids in their family
CREATE POLICY "Users can view own kids" ON kids
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own kids" ON kids
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own kids" ON kids
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own kids" ON kids
    FOR DELETE USING (auth.uid() = user_id);

-- Tasks policies - users can only access tasks in their family
CREATE POLICY "Users can view own tasks" ON tasks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks" ON tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON tasks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks" ON tasks
    FOR DELETE USING (auth.uid() = user_id);

-- Rewards policies - users can only access rewards in their family
CREATE POLICY "Users can view own rewards" ON rewards
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rewards" ON rewards
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own rewards" ON rewards
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own rewards" ON rewards
    FOR DELETE USING (auth.uid() = user_id);

-- Redemptions policies - users can only access redemptions in their family
CREATE POLICY "Users can view own redemptions" ON redemptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own redemptions" ON redemptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own redemptions" ON redemptions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own redemptions" ON redemptions
    FOR DELETE USING (auth.uid() = user_id);

-- Completions policies - users can only access completions in their family
CREATE POLICY "Users can view own completions" ON completions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own completions" ON completions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own completions" ON completions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own completions" ON completions
    FOR DELETE USING (auth.uid() = user_id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, family_name)
  VALUES (NEW.id, NEW.email, 'My Family');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();