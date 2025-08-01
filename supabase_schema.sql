-- Kiddoscore Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Kids table
CREATE TABLE kids (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  avatar VARCHAR(255),
  points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks table
CREATE TABLE tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  points INTEGER NOT NULL,
  active BOOLEAN DEFAULT true,
  assigned_kids UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rewards table
CREATE TABLE rewards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  label VARCHAR(255) NOT NULL,
  cost INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Redemptions table
CREATE TABLE redemptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  kid_id UUID REFERENCES kids(id) ON DELETE CASCADE,
  reward_id UUID REFERENCES rewards(id) ON DELETE CASCADE,
  label VARCHAR(255) NOT NULL,
  cost INTEGER NOT NULL,
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Completions table (replaces the complex completions object)
CREATE TABLE completions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  kid_id UUID REFERENCES kids(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  completed_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(kid_id, task_id, completed_date)
);

-- Indexes for better performance
CREATE INDEX idx_completions_kid_date ON completions(kid_id, completed_date);
CREATE INDEX idx_completions_task_date ON completions(task_id, completed_date);
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
CREATE TRIGGER update_kids_updated_at BEFORE UPDATE ON kids
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rewards_updated_at BEFORE UPDATE ON rewards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) - Enable but allow all operations for now
-- You can customize this based on your authentication needs
ALTER TABLE kids ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE completions ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (customize based on your auth setup)
CREATE POLICY "Allow all operations on kids" ON kids FOR ALL USING (true);
CREATE POLICY "Allow all operations on tasks" ON tasks FOR ALL USING (true);
CREATE POLICY "Allow all operations on rewards" ON rewards FOR ALL USING (true);
CREATE POLICY "Allow all operations on redemptions" ON redemptions FOR ALL USING (true);
CREATE POLICY "Allow all operations on completions" ON completions FOR ALL USING (true);