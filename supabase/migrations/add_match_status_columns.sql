-- Add ALL required match columns to matches table
-- Run this in your Supabase SQL editor

-- Core match columns
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS is_finals BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS position_in_round INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS next_winner_match_id UUID,
ADD COLUMN IF NOT EXISTS next_loser_match_id UUID;

-- Match lifecycle columns
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'complete')),
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS started_by UUID REFERENCES profiles(id);

-- Result columns
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS winner_id UUID REFERENCES teams(id),
ADD COLUMN IF NOT EXISTS loser_id UUID REFERENCES teams(id);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_team_a ON matches(team_a_id);
CREATE INDEX IF NOT EXISTS idx_matches_team_b ON matches(team_b_id);
CREATE INDEX IF NOT EXISTS idx_matches_tournament ON matches(tournament_id);
