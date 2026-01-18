import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/actions/auth";
import { getUserNextMatch, ensureBracketGenerated, getMatchRecords } from "@/lib/actions/match";
import { BracketDemoWrapper } from "@/components/bracket/bracket-demo-wrapper";
import type { Tournament, Match } from "@/lib/types/database";

type MatchWithTeams = Match & {
  team_a: { id: string; name: string } | null;
  team_b: { id: string; name: string } | null;
  winner: { id: string; name: string } | null;
};

type RegisteredTeam = {
  id: string;
  name: string;
  seed_number: number | null;
  player1_id: string | null;
  player2_id: string | null;
};

export default async function BracketPage() {
  const supabase = await createClient();
  const profile = await getProfile();

  // Auto-generate bracket matches if they don't exist
  await ensureBracketGenerated();

  // Now get the data after potentially creating matches
  const [nextMatch] = await Promise.all([
    getUserNextMatch(),
  ]);

  // Get tournament status
  const { data: tournamentData } = await supabase
    .from("tournament")
    .select("*")
    .single();

  const tournament = tournamentData as Tournament | null;
  const bracketStatus = tournament?.bracket_status || "none";
  const bracketPublished = bracketStatus === "published";
  const isAdmin = profile?.is_admin ?? false;

  // Non-admins can't see bracket unless it's published
  if (!isAdmin && !bracketPublished) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-white/5 rounded-2xl p-8 text-center max-w-sm w-full">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔒</span>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Bracket Not Available Yet
          </h2>
          <p className="text-white/60 text-sm">
            The bracket will be available once the tournament admin publishes it.
          </p>
        </div>
      </div>
    );
  }

  // Get matches for the bracket
  let matches: MatchWithTeams[] = [];
  if (tournament) {
    const { data: matchesData } = await supabase
      .from("matches")
      .select(`
        *,
        team_a:teams!matches_team_a_id_fkey(id, name),
        team_b:teams!matches_team_b_id_fkey(id, name),
        winner:teams!matches_winner_id_fkey(id, name)
      `)
      .eq("tournament_id", tournament.id)
      .order("bracket_type")
      .order("round_number")
      .order("position_in_round");

    matches = (matchesData || []) as unknown as MatchWithTeams[];
  }

  // Get registered teams (complete teams with both players)
  const { data: teamsData } = await supabase
    .from("teams")
    .select("id, name, seed_number, player1_id, player2_id")
    .not("player1_id", "is", null)
    .not("player2_id", "is", null)
    .order("seed_number", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  const registeredTeams = (teamsData || []) as RegisteredTeam[];

  // Get records if user has a next match
  let matchRecords: { userRecord: { wins: number; losses: number } | null; opponentRecord: { wins: number; losses: number } | null } | null = null;
  if (nextMatch && profile?.team_id) {
    matchRecords = await getMatchRecords(nextMatch, profile.team_id);
  }

  return (
    <BracketDemoWrapper
      realMatches={matches}
      bracketPublished={bracketPublished}
      isAdmin={isAdmin}
      registeredTeams={registeredTeams}
      eventDate={tournament?.event_date || null}
      userTeamId={profile?.team_id || null}
      nextMatch={nextMatch}
      userRecord={matchRecords?.userRecord || undefined}
      opponentRecord={matchRecords?.opponentRecord || undefined}
    />
  );
}
