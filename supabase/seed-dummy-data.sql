-- DUMMY DATA FOR TESTING
-- Run this in Supabase SQL Editor
-- DELETE THIS DATA BEFORE PUBLISHING

-- First, create some dummy users in auth.users (if not using real signups)
-- Note: You'll need to manually create users through Supabase Auth UI or signups
-- This script assumes you have at least one real user to reference

-- Insert dummy profiles (free agents - no team)
INSERT INTO profiles (id, email, display_name, is_admin, team_id)
VALUES
  (gen_random_uuid(), 'mike.johnson@example.com', 'Mike Johnson', false, null),
  (gen_random_uuid(), 'sarah.williams@example.com', 'Sarah Williams', false, null),
  (gen_random_uuid(), 'david.brown@example.com', 'David Brown', false, null),
  (gen_random_uuid(), 'emily.davis@example.com', 'Emily Davis', false, null),
  (gen_random_uuid(), 'chris.wilson@example.com', 'Chris Wilson', false, null)
ON CONFLICT (id) DO NOTHING;

-- Create some dummy teams
DO $$
DECLARE
  team1_id uuid := gen_random_uuid();
  team2_id uuid := gen_random_uuid();
  team3_id uuid := gen_random_uuid();
  team4_id uuid := gen_random_uuid();
  team5_id uuid := gen_random_uuid();
  player1_id uuid := gen_random_uuid();
  player2_id uuid := gen_random_uuid();
  player3_id uuid := gen_random_uuid();
  player4_id uuid := gen_random_uuid();
  player5_id uuid := gen_random_uuid();
  player6_id uuid := gen_random_uuid();
  player7_id uuid := gen_random_uuid();
  player8_id uuid := gen_random_uuid();
  player9_id uuid := gen_random_uuid();
BEGIN
  -- Create players for complete teams
  INSERT INTO profiles (id, email, display_name, is_admin, team_id)
  VALUES
    (player1_id, 'john.smith@example.com', 'John Smith', false, team1_id),
    (player2_id, 'jane.doe@example.com', 'Jane Doe', false, team1_id),
    (player3_id, 'bob.miller@example.com', 'Bob Miller', false, team2_id),
    (player4_id, 'alice.jones@example.com', 'Alice Jones', false, team2_id),
    (player5_id, 'tom.anderson@example.com', 'Tom Anderson', false, team3_id),
    (player6_id, 'lisa.taylor@example.com', 'Lisa Taylor', false, team3_id),
    (player7_id, 'mark.white@example.com', 'Mark White', false, team4_id),
    (player8_id, 'nancy.harris@example.com', 'Nancy Harris', false, team4_id),
    (player9_id, 'steve.clark@example.com', 'Steve Clark', false, team5_id)
  ON CONFLICT (id) DO NOTHING;

  -- Create complete teams
  INSERT INTO teams (id, name, player1_id, player2_id, invite_token, seed_number)
  VALUES
    (team1_id, 'Corn Stars', player1_id, player2_id, 'token-cornstars-123', 1),
    (team2_id, 'Bag Daddies', player3_id, player4_id, 'token-bagdaddies-456', 2),
    (team3_id, 'Hole in One', player5_id, player6_id, 'token-holeinone-789', 3),
    (team4_id, 'Toss Masters', player7_id, player8_id, 'token-tossmasters-abc', 4)
  ON CONFLICT (id) DO NOTHING;

  -- Create incomplete team (looking for teammate)
  INSERT INTO teams (id, name, player1_id, player2_id, invite_token, seed_number)
  VALUES
    (team5_id, 'Flying Bags', player9_id, null, 'token-flyingbags-def', null)
  ON CONFLICT (id) DO NOTHING;

END $$;

-- Verify the data
SELECT 'Teams created:' as info, count(*) as count FROM teams;
SELECT 'Complete teams:' as info, count(*) as count FROM teams WHERE player2_id IS NOT NULL;
SELECT 'Incomplete teams:' as info, count(*) as count FROM teams WHERE player2_id IS NULL;
SELECT 'Free agents:' as info, count(*) as count FROM profiles WHERE team_id IS NULL;

-- To remove all dummy data later, run:
-- DELETE FROM teams WHERE invite_token LIKE 'token-%';
-- DELETE FROM profiles WHERE email LIKE '%@example.com';
