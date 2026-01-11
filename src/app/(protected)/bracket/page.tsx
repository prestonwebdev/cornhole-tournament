import { createClient } from "@/lib/supabase/server";
import { BracketContent, BracketEmptyState } from "@/components/bracket/bracket-content";
import type { Tournament, Match } from "@/lib/types/database";

type MatchWithTeams = Match & {
  team_a: { id: string; name: string } | null;
  team_b: { id: string; name: string } | null;
  winner: { id: string; name: string } | null;
};

export default async function BracketPage() {
  const supabase = await createClient();

  // Get tournament status
  const { data: tournamentData } = await supabase
    .from("tournament")
    .select("*")
    .single();

  const tournament = tournamentData as Tournament | null;
  const bracketStatus = tournament?.bracket_status || "none";

  // If bracket is not published, show empty state
  if (bracketStatus !== "published") {
    return <BracketEmptyState />;
  }

  // Get matches for the bracket
  const { data: matchesData } = await supabase
    .from("matches")
    .select(`
      *,
      team_a:teams!matches_team_a_id_fkey(id, name),
      team_b:teams!matches_team_b_id_fkey(id, name),
      winner:teams!matches_winner_id_fkey(id, name)
    `)
    .eq("tournament_id", tournament!.id)
    .order("bracket_type")
    .order("round_number")
    .order("position_in_round");

  const matches = (matchesData || []) as unknown as MatchWithTeams[];

  return <BracketContent matches={matches} />;
}
