-- Cornhole Tournament Database Schema
-- Double Elimination Support

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  is_admin BOOLEAN DEFAULT FALSE NOT NULL,
  team_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- TOURNAMENT TABLE (single tournament)
-- ============================================
CREATE TABLE public.tournament (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL DEFAULT 'Cornhole Tournament',
  event_date DATE,
  registration_status TEXT DEFAULT 'open' CHECK (registration_status IN ('open', 'closed')) NOT NULL,
  bracket_status TEXT DEFAULT 'none' CHECK (bracket_status IN ('none', 'draft', 'published')) NOT NULL,
  is_locked BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Insert the single tournament row
INSERT INTO public.tournament (name) VALUES ('Cornhole Tournament');

-- ============================================
-- TEAMS TABLE
-- ============================================
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  player1_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  player2_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  invite_token TEXT UNIQUE NOT NULL,
  seed_number INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT team_players_different CHECK (player1_id IS NULL OR player2_id IS NULL OR player1_id != player2_id)
);

-- Add foreign key from profiles to teams (circular reference)
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_team_id_fkey
  FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE SET NULL;

-- ============================================
-- MATCHES TABLE (Double Elimination Support)
-- ============================================
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID REFERENCES public.tournament(id) ON DELETE CASCADE NOT NULL,
  bracket_type TEXT CHECK (bracket_type IN ('winners', 'losers', 'grand_finals')) NOT NULL,
  round_number INTEGER NOT NULL,
  match_number INTEGER NOT NULL,
  position_in_round INTEGER NOT NULL,
  team_a_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  team_b_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  score_a INTEGER,
  score_b INTEGER,
  winner_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  loser_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  next_winner_match_id UUID REFERENCES public.matches(id) ON DELETE SET NULL,
  next_loser_match_id UUID REFERENCES public.matches(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(tournament_id, bracket_type, round_number, position_in_round)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_profiles_team_id ON public.profiles(team_id);
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_teams_invite_token ON public.teams(invite_token);
CREATE INDEX idx_matches_tournament_id ON public.matches(tournament_id);
CREATE INDEX idx_matches_bracket_type ON public.matches(bracket_type);
CREATE INDEX idx_matches_round_number ON public.matches(round_number);

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tournament_updated_at
  BEFORE UPDATE ON public.tournament
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- AUTH TRIGGER - Create profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- TOURNAMENT POLICIES
CREATE POLICY "Tournament is viewable by everyone"
  ON public.tournament FOR SELECT
  USING (true);

CREATE POLICY "Admins can update tournament"
  ON public.tournament FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- TEAMS POLICIES
CREATE POLICY "Teams are viewable by everyone"
  ON public.teams FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create teams when registration open"
  ON public.teams FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.tournament
      WHERE registration_status = 'open'
    )
  );

CREATE POLICY "Team members can update their team"
  ON public.teams FOR UPDATE
  USING (
    auth.uid() = player1_id OR auth.uid() = player2_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can delete teams"
  ON public.teams FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- MATCHES POLICIES
CREATE POLICY "Matches viewable when published or by admin"
  ON public.matches FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tournament
      WHERE bracket_status = 'published'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can insert matches"
  ON public.matches FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can update matches"
  ON public.matches FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can delete matches"
  ON public.matches FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );
