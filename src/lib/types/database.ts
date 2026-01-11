export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          is_admin: boolean;
          team_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          is_admin?: boolean;
          team_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          is_admin?: boolean;
          team_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      tournament: {
        Row: {
          id: string;
          name: string;
          event_date: string | null;
          registration_status: "open" | "closed";
          bracket_status: "none" | "draft" | "published";
          is_locked: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name?: string;
          event_date?: string | null;
          registration_status?: "open" | "closed";
          bracket_status?: "none" | "draft" | "published";
          is_locked?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          event_date?: string | null;
          registration_status?: "open" | "closed";
          bracket_status?: "none" | "draft" | "published";
          is_locked?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      teams: {
        Row: {
          id: string;
          name: string;
          player1_id: string | null;
          player2_id: string | null;
          invite_token: string;
          seed_number: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          player1_id?: string | null;
          player2_id?: string | null;
          invite_token: string;
          seed_number?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          player1_id?: string | null;
          player2_id?: string | null;
          invite_token?: string;
          seed_number?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      matches: {
        Row: {
          id: string;
          tournament_id: string;
          bracket_type: "winners" | "losers" | "grand_finals";
          round_number: number;
          match_number: number;
          position_in_round: number;
          team_a_id: string | null;
          team_b_id: string | null;
          score_a: number | null;
          score_b: number | null;
          winner_id: string | null;
          loser_id: string | null;
          next_winner_match_id: string | null;
          next_loser_match_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tournament_id: string;
          bracket_type: "winners" | "losers" | "grand_finals";
          round_number: number;
          match_number: number;
          position_in_round: number;
          team_a_id?: string | null;
          team_b_id?: string | null;
          score_a?: number | null;
          score_b?: number | null;
          winner_id?: string | null;
          loser_id?: string | null;
          next_winner_match_id?: string | null;
          next_loser_match_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tournament_id?: string;
          bracket_type?: "winners" | "losers" | "grand_finals";
          round_number?: number;
          match_number?: number;
          position_in_round?: number;
          team_a_id?: string | null;
          team_b_id?: string | null;
          score_a?: number | null;
          score_b?: number | null;
          winner_id?: string | null;
          loser_id?: string | null;
          next_winner_match_id?: string | null;
          next_loser_match_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
};

// Convenience types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Tournament = Database["public"]["Tables"]["tournament"]["Row"];
export type Team = Database["public"]["Tables"]["teams"]["Row"];
export type Match = Database["public"]["Tables"]["matches"]["Row"];

// Extended types with relations
export type TeamWithPlayers = Team & {
  player1: Profile | null;
  player2: Profile | null;
};

export type ProfileWithTeam = Profile & {
  team: Team | null;
};
