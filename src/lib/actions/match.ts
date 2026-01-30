"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Types for match with teams
export type TeamInfo = {
  id: string;
  name: string;
  player1_id: string | null;
  player2_id: string | null;
  player1_name?: string | null;
  player2_name?: string | null;
};

export type MatchWithTeams = {
  id: string;
  tournament_id: string;
  bracket_type: "winners" | "consolation";
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
  is_finals: boolean;
  status: "pending" | "in_progress" | "complete";
  started_at: string | null;
  completed_at: string | null;
  started_by: string | null;
  created_at: string;
  updated_at: string;
  team_a: TeamInfo | null;
  team_b: TeamInfo | null;
  winner: TeamInfo | null;
};

export type TournamentStatus = {
  status: "registration" | "in_progress" | "complete";
  userPlacement: 1 | 2 | 3 | 4 | null;
  isEliminated: boolean;
  teamId: string | null;
  eventDate: string | null;
};

/**
 * Get a match by ID with team details
 */
export async function getMatchById(matchId: string): Promise<MatchWithTeams | null> {
  const supabase = await createClient();

  const { data: match, error } = await supabase
    .from("matches")
    .select(`
      *,
      team_a:teams!matches_team_a_id_fkey(id, name, player1_id, player2_id),
      team_b:teams!matches_team_b_id_fkey(id, name, player1_id, player2_id),
      winner:teams!matches_winner_id_fkey(id, name, player1_id, player2_id)
    `)
    .eq("id", matchId)
    .single();

  if (error || !match) {
    return null;
  }

  return match as unknown as MatchWithTeams;
}

/**
 * Get all matches for the current user's team
 */
export async function getUserMatches(): Promise<MatchWithTeams[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  // Get user's team
  const { data: profile } = await supabase
    .from("profiles")
    .select("team_id")
    .eq("id", user.id)
    .single();

  const profileData = profile as { team_id: string | null } | null;
  if (!profileData?.team_id) return [];

  const teamId = profileData.team_id;

  // Get all matches where user's team is involved
  const { data: matches, error } = await supabase
    .from("matches")
    .select(`
      *,
      team_a:teams!matches_team_a_id_fkey(id, name, player1_id, player2_id),
      team_b:teams!matches_team_b_id_fkey(id, name, player1_id, player2_id),
      winner:teams!matches_winner_id_fkey(id, name, player1_id, player2_id)
    `)
    .or(`team_a_id.eq.${teamId},team_b_id.eq.${teamId}`)
    .order("round_number", { ascending: true })
    .order("match_number", { ascending: true });

  if (error || !matches) {
    return [];
  }

  return matches as unknown as MatchWithTeams[];
}

/**
 * Get user's next match (pending or in_progress)
 * Includes player names for display
 */
export async function getUserNextMatch(): Promise<MatchWithTeams | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Get user's team
  const { data: profile } = await supabase
    .from("profiles")
    .select("team_id")
    .eq("id", user.id)
    .single();

  const profileData = profile as { team_id: string | null } | null;
  if (!profileData?.team_id) return null;

  const teamId = profileData.team_id;

  // Get next pending or in_progress match with player names
  const { data: match, error } = await supabase
    .from("matches")
    .select(`
      *,
      team_a:teams!matches_team_a_id_fkey(
        id,
        name,
        player1_id,
        player2_id,
        player1:profiles!teams_player1_id_fkey(display_name),
        player2:profiles!teams_player2_id_fkey(display_name)
      ),
      team_b:teams!matches_team_b_id_fkey(
        id,
        name,
        player1_id,
        player2_id,
        player1:profiles!teams_player1_id_fkey(display_name),
        player2:profiles!teams_player2_id_fkey(display_name)
      ),
      winner:teams!matches_winner_id_fkey(id, name, player1_id, player2_id)
    `)
    .or(`team_a_id.eq.${teamId},team_b_id.eq.${teamId}`)
    .in("status", ["pending", "in_progress"])
    .order("bracket_type", { ascending: false }) // winners first
    .order("round_number", { ascending: true })
    .limit(1)
    .single();

  if (error || !match) {
    return null;
  }

  // Cast match to proper type for transformation
  const matchData = match as {
    team_a: { id: string; name: string; player1_id: string | null; player2_id: string | null; player1?: { display_name: string | null }; player2?: { display_name: string | null } } | null;
    team_b: { id: string; name: string; player1_id: string | null; player2_id: string | null; player1?: { display_name: string | null }; player2?: { display_name: string | null } } | null;
    [key: string]: unknown;
  };

  // Transform to flatten player names
  const transformedMatch = {
    ...matchData,
    team_a: matchData.team_a ? {
      id: matchData.team_a.id,
      name: matchData.team_a.name,
      player1_id: matchData.team_a.player1_id,
      player2_id: matchData.team_a.player2_id,
      player1_name: matchData.team_a.player1?.display_name || null,
      player2_name: matchData.team_a.player2?.display_name || null,
    } : null,
    team_b: matchData.team_b ? {
      id: matchData.team_b.id,
      name: matchData.team_b.name,
      player1_id: matchData.team_b.player1_id,
      player2_id: matchData.team_b.player2_id,
      player1_name: matchData.team_b.player1?.display_name || null,
      player2_name: matchData.team_b.player2?.display_name || null,
    } : null,
  };

  return transformedMatch as unknown as MatchWithTeams;
}

/**
 * Get win/loss record for a team
 */
export async function getTeamRecord(teamId: string): Promise<{ wins: number; losses: number }> {
  const supabase = await createClient();

  // Count wins (matches where this team is the winner)
  const { count: wins } = await supabase
    .from("matches")
    .select("*", { count: "exact", head: true })
    .eq("winner_id", teamId)
    .eq("status", "complete");

  // Count losses (matches where this team is the loser)
  const { count: losses } = await supabase
    .from("matches")
    .select("*", { count: "exact", head: true })
    .eq("loser_id", teamId)
    .eq("status", "complete");

  return {
    wins: wins || 0,
    losses: losses || 0,
  };
}

/**
 * Get records for both teams in a match, keyed by user's perspective
 */
export async function getMatchRecords(
  matchWithTeams: MatchWithTeams,
  userTeamId: string
): Promise<{
  userRecord: { wins: number; losses: number } | null;
  opponentRecord: { wins: number; losses: number } | null;
}> {
  if (!matchWithTeams.team_a_id || !matchWithTeams.team_b_id) {
    return { userRecord: null, opponentRecord: null };
  }

  const [recordA, recordB] = await Promise.all([
    getTeamRecord(matchWithTeams.team_a_id),
    getTeamRecord(matchWithTeams.team_b_id),
  ]);

  // Determine which team is the user's
  const isUserTeamA = matchWithTeams.team_a_id === userTeamId;

  return {
    userRecord: isUserTeamA ? recordA : recordB,
    opponentRecord: isUserTeamA ? recordB : recordA,
  };
}

/**
 * Start a match (any player in the match or admin can start it)
 */
export async function startMatch(matchId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Get user profile including admin status
  const { data: profile } = await supabase
    .from("profiles")
    .select("team_id, is_admin")
    .eq("id", user.id)
    .single();

  const profileData = profile as { team_id: string | null; is_admin: boolean } | null;
  const isAdmin = profileData?.is_admin ?? false;
  const userTeamId = profileData?.team_id;

  // Get the match
  const match = await getMatchById(matchId);
  if (!match) {
    return { error: "Match not found" };
  }

  // Check match can be started
  if (match.status !== "pending") {
    return { error: "Match has already been started" };
  }

  if (!match.team_a_id || !match.team_b_id) {
    return { error: "Both teams must be assigned to start the match" };
  }

  // Verify user is on one of the teams OR is admin
  if (!isAdmin && userTeamId !== match.team_a_id && userTeamId !== match.team_b_id) {
    return { error: "You must be on one of the teams to start this match" };
  }

  // Use service client for updates (bypasses RLS after we've validated permissions)
  const serviceClient = createServiceClient();

  // Start the match
  const { error } = await serviceClient
    .from("matches")
    .update({
      status: "in_progress",
      started_at: new Date().toISOString(),
      started_by: user.id,
    } as never)
    .eq("id", matchId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/bracket");
  revalidatePath("/dashboard");

  return { success: true };
}

/**
 * Complete a match with scores
 * Auto-advances winner to next match and drops loser to consolation
 * Admins can complete any match
 */
export async function completeMatch(matchId: string, scoreA: number, scoreB: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Get user profile including admin status
  const { data: profile } = await supabase
    .from("profiles")
    .select("team_id, is_admin")
    .eq("id", user.id)
    .single();

  const profileData = profile as { team_id: string | null; is_admin: boolean } | null;
  const isAdmin = profileData?.is_admin ?? false;
  const userTeamId = profileData?.team_id;

  // Get the match
  const match = await getMatchById(matchId);
  if (!match) {
    return { error: "Match not found" };
  }

  // Check match can be completed (admins can override completed matches)
  if (match.status === "complete" && !isAdmin) {
    return { error: "Match has already been completed" };
  }

  if (!match.team_a_id || !match.team_b_id) {
    return { error: "Both teams must be assigned to complete the match" };
  }

  // Verify user is on one of the teams OR is admin
  console.log("[completeMatch] User team:", userTeamId, "Match teams:", match.team_a_id, match.team_b_id, "isAdmin:", isAdmin);
  if (!isAdmin && userTeamId !== match.team_a_id && userTeamId !== match.team_b_id) {
    return { error: "You must be on one of the teams to complete this match" };
  }

  // Validate scores
  if (scoreA < 0 || scoreB < 0) {
    return { error: "Scores cannot be negative" };
  }

  if (scoreA === scoreB) {
    return { error: "Scores cannot be tied" };
  }

  // Determine winner and loser
  const winnerId = scoreA > scoreB ? match.team_a_id : match.team_b_id;
  const loserId = scoreA > scoreB ? match.team_b_id : match.team_a_id;

  // Use service client for updates (bypasses RLS after we've validated permissions)
  const serviceClient = createServiceClient();

  // Update the match
  console.log("[completeMatch] Attempting to update match:", matchId, "with scores:", scoreA, scoreB);
  const { error: updateError, data: updateData } = await serviceClient
    .from("matches")
    .update({
      score_a: scoreA,
      score_b: scoreB,
      winner_id: winnerId,
      loser_id: loserId,
      status: "complete",
      completed_at: new Date().toISOString(),
    } as never)
    .eq("id", matchId)
    .select();

  console.log("[completeMatch] Update result:", updateData, "Error:", updateError);

  if (updateError) {
    console.error("[completeMatch] Update failed:", updateError);
    return { error: updateError.message };
  }

  // Advance winner to next match if applicable
  if (match.next_winner_match_id) {
    // Determine which slot (team_a or team_b) based on position
    const slot = match.position_in_round % 2 === 1 ? "team_a_id" : "team_b_id";

    await serviceClient
      .from("matches")
      .update({ [slot]: winnerId } as never)
      .eq("id", match.next_winner_match_id);
  }

  // Drop loser to consolation bracket if applicable
  if (match.next_loser_match_id) {
    // Losers use opposite slot to avoid conflicts with consolation winners
    const slot = match.position_in_round % 2 === 1 ? "team_b_id" : "team_a_id";

    await serviceClient
      .from("matches")
      .update({ [slot]: loserId } as never)
      .eq("id", match.next_loser_match_id);
  }

  revalidatePath("/bracket");
  revalidatePath("/dashboard");

  return { success: true, winnerId, loserId };
}

/**
 * Reset a match score (admin only)
 * Clears scores, resets status, and removes advanced teams from next matches
 */
export async function resetMatchScore(matchId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  const profileData = profile as { is_admin: boolean } | null;
  if (!profileData?.is_admin) {
    return { error: "Only admins can reset match scores" };
  }

  // Get the match
  const match = await getMatchById(matchId);
  if (!match) {
    return { error: "Match not found" };
  }

  // If match was complete, remove teams from next matches
  if (match.status === "complete") {
    // Remove winner from next winner match
    if (match.next_winner_match_id && match.winner_id) {
      const slot = match.position_in_round % 2 === 1 ? "team_a_id" : "team_b_id";
      await supabase
        .from("matches")
        .update({ [slot]: null } as never)
        .eq("id", match.next_winner_match_id);
    }

    // Remove loser from next loser match
    if (match.next_loser_match_id && match.loser_id) {
      const slot = match.position_in_round % 2 === 1 ? "team_a_id" : "team_b_id";
      await supabase
        .from("matches")
        .update({ [slot]: null } as never)
        .eq("id", match.next_loser_match_id);
    }
  }

  // Reset the match
  const { error: updateError } = await supabase
    .from("matches")
    .update({
      score_a: null,
      score_b: null,
      winner_id: null,
      loser_id: null,
      status: "pending",
      started_at: null,
      started_by: null,
      completed_at: null,
    } as never)
    .eq("id", matchId);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath("/bracket");
  revalidatePath("/dashboard");

  return { success: true };
}

/**
 * Get all bracket matches
 */
export async function getAllBracketMatches(): Promise<MatchWithTeams[]> {
  const supabase = await createClient();

  const { data: matches, error } = await supabase
    .from("matches")
    .select(`
      *,
      team_a:teams!matches_team_a_id_fkey(id, name, player1_id, player2_id),
      team_b:teams!matches_team_b_id_fkey(id, name, player1_id, player2_id),
      winner:teams!matches_winner_id_fkey(id, name, player1_id, player2_id)
    `)
    .order("bracket_type", { ascending: false })
    .order("round_number", { ascending: true })
    .order("match_number", { ascending: true });

  if (error || !matches) {
    return [];
  }

  return matches as unknown as MatchWithTeams[];
}

/**
 * Ensure bracket matches are generated
 * Auto-creates matches if they don't exist and there are enough teams
 * This is called on bracket page load
 */
export async function ensureBracketGenerated() {
  const supabase = await createClient();

  // Get tournament
  const { data: tournament, error: tournamentError } = await supabase
    .from("tournament")
    .select("*")
    .single();

  console.log("[ensureBracketGenerated] Tournament:", tournament, "Error:", tournamentError);

  if (tournamentError || !tournament) {
    return { error: "Tournament not found" };
  }

  const tournamentData = tournament as { id: string; bracket_status: string };

  // Check if matches already exist
  const { data: existingMatches, error: matchesCheckError } = await supabase
    .from("matches")
    .select("id, status, team_a_id, team_b_id")
    .eq("tournament_id", tournamentData.id);

  console.log("[ensureBracketGenerated] Existing matches:", existingMatches?.length, "Error:", matchesCheckError);

  type RegisteredTeamData = {
    id: string;
    name: string;
    seed_number: number | null;
    player1_id: string | null;
    player2_id: string | null;
  };

  // Get registered teams (must have both players)
  const { data: teamsData, error: teamsError } = await supabase
    .from("teams")
    .select("id, name, seed_number, player1_id, player2_id")
    .not("player1_id", "is", null)
    .not("player2_id", "is", null)
    .order("seed_number", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  console.log("[ensureBracketGenerated] Teams:", teamsData?.length, "Error:", teamsError);

  if (teamsError || !teamsData) {
    return { error: "Failed to get teams" };
  }

  const teams = teamsData as RegisteredTeamData[];

  if (teams.length < 2) {
    // Not enough teams yet
    console.log("[ensureBracketGenerated] Not enough teams:", teams.length);
    return { success: true, notEnoughTeams: true };
  }

  if (existingMatches && existingMatches.length > 0) {
    // Check if any matches have been started (in_progress or complete)
    const hasStartedMatches = existingMatches.some(
      m => (m as { status: string }).status === "in_progress" || (m as { status: string }).status === "complete"
    );

    // Count how many teams are currently in the bracket
    const teamsInBracket = new Set<string>();
    existingMatches.forEach(m => {
      const match = m as { team_a_id: string | null; team_b_id: string | null };
      if (match.team_a_id) teamsInBracket.add(match.team_a_id);
      if (match.team_b_id) teamsInBracket.add(match.team_b_id);
    });

    const currentTeamIds = new Set(teams.map(t => t.id));
    const teamCountChanged = teamsInBracket.size !== currentTeamIds.size;
    const teamsChanged = ![...teamsInBracket].every(id => currentTeamIds.has(id)) ||
                        ![...currentTeamIds].every(id => teamsInBracket.has(id));

    console.log("[ensureBracketGenerated] Teams in bracket:", teamsInBracket.size, "Current teams:", currentTeamIds.size);
    console.log("[ensureBracketGenerated] Team count changed:", teamCountChanged, "Teams changed:", teamsChanged);
    console.log("[ensureBracketGenerated] Has started matches:", hasStartedMatches);

    if ((teamCountChanged || teamsChanged) && !hasStartedMatches) {
      // Team composition changed and no matches started - regenerate bracket
      console.log("[ensureBracketGenerated] Regenerating bracket due to team changes");

      // Delete existing matches
      const { error: deleteError } = await supabase
        .from("matches")
        .delete()
        .eq("tournament_id", tournamentData.id);

      if (deleteError) {
        console.error("[ensureBracketGenerated] Failed to delete matches:", deleteError);
        return { error: `Failed to delete matches: ${deleteError.message}` };
      }
    } else if (!teamCountChanged && !teamsChanged) {
      // No changes, bracket is up to date
      return { success: true, alreadyExists: true };
    } else {
      // Teams changed but matches have started - can't regenerate
      console.log("[ensureBracketGenerated] Cannot regenerate - matches have started");
      return { success: true, alreadyExists: true, warning: "Teams changed but matches have started" };
    }
  }

  const registeredTeams = teams;

  // Assign seed numbers if not already set
  registeredTeams.forEach((team, index) => {
    if (team.seed_number === null) {
      team.seed_number = index + 1;
    }
  });

  // Generate match structure based on team count
  const matchInserts = generateMatchStructure(registeredTeams, tournamentData.id);

  console.log("[ensureBracketGenerated] Generated matches:", matchInserts.length);
  console.log("[ensureBracketGenerated] First match:", JSON.stringify(matchInserts[0], null, 2));

  // Insert all matches
  const { data: insertedMatches, error: insertError } = await supabase
    .from("matches")
    .insert(matchInserts as never[])
    .select();

  console.log("[ensureBracketGenerated] Insert result:", insertedMatches?.length, "Error:", insertError);

  if (insertError) {
    console.error("[ensureBracketGenerated] Insert error details:", JSON.stringify(insertError, null, 2));
    console.error("[ensureBracketGenerated] Error message:", insertError.message);
    console.error("[ensureBracketGenerated] Error code:", insertError.code);
    console.error("[ensureBracketGenerated] Error hint:", insertError.hint);
    console.error("[ensureBracketGenerated] Error details:", insertError.details);
    return { error: `Failed to create matches: ${insertError.message}` };
  }

  // Note: Don't call revalidatePath here - this function is called during page render
  // which doesn't support revalidation. The page is already loading fresh data.

  return { success: true, matchCount: matchInserts.length };
}

/**
 * Toggle bracket visibility for non-admins
 * Admins can always see the bracket, this controls whether others can
 */
export async function toggleBracketVisibility() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  const profileData = profile as { is_admin: boolean } | null;
  if (!profileData?.is_admin) {
    return { error: "Only admins can change bracket visibility" };
  }

  // Get tournament
  const { data: tournament } = await supabase
    .from("tournament")
    .select("id, bracket_status")
    .single();

  if (!tournament) {
    return { error: "Tournament not found" };
  }

  const tournamentData = tournament as { id: string; bracket_status: string };

  // Toggle between published and draft
  const newStatus = tournamentData.bracket_status === "published" ? "draft" : "published";

  const { error: updateError } = await supabase
    .from("tournament")
    .update({ bracket_status: newStatus } as never)
    .eq("id", tournamentData.id);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath("/bracket");
  revalidatePath("/dashboard");

  return { success: true, newStatus };
}

/**
 * Generate match structure for the bracket
 * Returns array of match objects ready for database insertion
 */
function generateMatchStructure(
  teams: { id: string; seed_number: number | null }[],
  tournamentId: string
) {
  const teamCount = teams.length;

  // Determine bracket size
  let bracketSize: number;
  if (teamCount <= 4) {
    bracketSize = 4;
  } else if (teamCount <= 8) {
    bracketSize = 8;
  } else if (teamCount <= 16) {
    bracketSize = 16;
  } else {
    bracketSize = 32;
  }

  // Generate UUIDs for all matches
  const matchIds: string[] = [];
  const totalMatches = getTotalMatchCount(bracketSize);
  for (let i = 0; i < totalMatches; i++) {
    matchIds.push(crypto.randomUUID());
  }

  // Get team by seed number
  const getTeamBySeed = (seed: number) => teams.find(t => t.seed_number === seed);

  const matches: Array<{
    id: string;
    tournament_id: string;
    bracket_type: "winners" | "consolation";
    round_number: number;
    match_number: number;
    position_in_round: number;
    team_a_id: string | null;
    team_b_id: string | null;
    next_winner_match_id: string | null;
    next_loser_match_id: string | null;
    is_finals: boolean;
    status: "pending" | "complete";
    winner_id?: string | null;
    completed_at?: string | null;
  }> = [];

  let matchIndex = 0;

  if (bracketSize === 4) {
    // 4-team bracket: 4 matches total
    // m0: Semi 1 (1v4), m1: Semi 2 (2v3), m2: Finals, m3: Consolation Finals
    const seedMatchups = [[1, 4], [2, 3]];

    // Winners Round 1 (Semifinals)
    seedMatchups.forEach(([seedA, seedB], idx) => {
      const teamA = getTeamBySeed(seedA);
      const teamB = getTeamBySeed(seedB);
      matches.push({
        id: matchIds[matchIndex],
        tournament_id: tournamentId,
        bracket_type: "winners",
        round_number: 1,
        match_number: matchIndex + 1,
        position_in_round: idx + 1,
        team_a_id: teamA?.id || null,
        team_b_id: teamB?.id || null,
        next_winner_match_id: matchIds[2], // Finals
        next_loser_match_id: matchIds[3],  // Consolation
        is_finals: false,
        status: "pending",
      });
      matchIndex++;
    });

    // Winners Finals
    matches.push({
      id: matchIds[matchIndex],
      tournament_id: tournamentId,
      bracket_type: "winners",
      round_number: 2,
      match_number: matchIndex + 1,
      position_in_round: 1,
      team_a_id: null,
      team_b_id: null,
      next_winner_match_id: null,
      next_loser_match_id: null,
      is_finals: true,
      status: "pending",
    });
    matchIndex++;

    // Consolation Finals
    matches.push({
      id: matchIds[matchIndex],
      tournament_id: tournamentId,
      bracket_type: "consolation",
      round_number: 1,
      match_number: matchIndex + 1,
      position_in_round: 1,
      team_a_id: null,
      team_b_id: null,
      next_winner_match_id: null,
      next_loser_match_id: null,
      is_finals: true,
      status: "pending",
    });

  } else if (bracketSize === 8) {
    // 8-team bracket: 12 matches total
    const seedMatchups = [[1, 8], [4, 5], [2, 7], [3, 6]];

    // Winners Round 1 (Quarters) - m0 to m3
    seedMatchups.forEach(([seedA, seedB], idx) => {
      const teamA = getTeamBySeed(seedA);
      const teamB = getTeamBySeed(seedB);
      const nextWinnerIdx = 4 + Math.floor(idx / 2); // m4 or m5
      const nextLoserIdx = 7 + Math.floor(idx / 2);  // m7 or m8

      matches.push({
        id: matchIds[matchIndex],
        tournament_id: tournamentId,
        bracket_type: "winners",
        round_number: 1,
        match_number: matchIndex + 1,
        position_in_round: idx + 1,
        team_a_id: teamA?.id || null,
        team_b_id: teamB?.id || null,
        next_winner_match_id: matchIds[nextWinnerIdx],
        next_loser_match_id: matchIds[nextLoserIdx],
        is_finals: false,
        status: "pending",
      });
      matchIndex++;
    });

    // Winners Round 2 (Semis) - m4, m5
    for (let i = 0; i < 2; i++) {
      matches.push({
        id: matchIds[matchIndex],
        tournament_id: tournamentId,
        bracket_type: "winners",
        round_number: 2,
        match_number: matchIndex + 1,
        position_in_round: i + 1,
        team_a_id: null,
        team_b_id: null,
        next_winner_match_id: matchIds[6], // Finals
        next_loser_match_id: matchIds[9 + i], // Consolation R2
        is_finals: false,
        status: "pending",
      });
      matchIndex++;
    }

    // Winners Finals - m6
    matches.push({
      id: matchIds[matchIndex],
      tournament_id: tournamentId,
      bracket_type: "winners",
      round_number: 3,
      match_number: matchIndex + 1,
      position_in_round: 1,
      team_a_id: null,
      team_b_id: null,
      next_winner_match_id: null,
      next_loser_match_id: null,
      is_finals: true,
      status: "pending",
    });
    matchIndex++;

    // Consolation Round 1 - m7, m8
    for (let i = 0; i < 2; i++) {
      matches.push({
        id: matchIds[matchIndex],
        tournament_id: tournamentId,
        bracket_type: "consolation",
        round_number: 1,
        match_number: matchIndex + 1,
        position_in_round: i + 1,
        team_a_id: null,
        team_b_id: null,
        next_winner_match_id: matchIds[9 + i], // Consolation R2
        next_loser_match_id: null,
        is_finals: false,
        status: "pending",
      });
      matchIndex++;
    }

    // Consolation Round 2 - m9, m10
    for (let i = 0; i < 2; i++) {
      matches.push({
        id: matchIds[matchIndex],
        tournament_id: tournamentId,
        bracket_type: "consolation",
        round_number: 2,
        match_number: matchIndex + 1,
        position_in_round: i + 1,
        team_a_id: null,
        team_b_id: null,
        next_winner_match_id: matchIds[11], // Consolation Finals
        next_loser_match_id: null,
        is_finals: false,
        status: "pending",
      });
      matchIndex++;
    }

    // Consolation Finals - m11
    matches.push({
      id: matchIds[matchIndex],
      tournament_id: tournamentId,
      bracket_type: "consolation",
      round_number: 3,
      match_number: matchIndex + 1,
      position_in_round: 1,
      team_a_id: null,
      team_b_id: null,
      next_winner_match_id: null,
      next_loser_match_id: null,
      is_finals: true,
      status: "pending",
    });

  } else if (bracketSize === 16) {
    // 16-team bracket: 24 matches total (15 winners + 9 consolation)
    // Consolation: W-R1 losers compete, W-R2/R3 losers drop in
    const seedMatchups = [[1, 16], [8, 9], [4, 13], [5, 12], [2, 15], [7, 10], [3, 14], [6, 11]];

    // Match index layout:
    // W-R1: m0-m7 (8), W-R2: m8-m11 (4), W-R3: m12-m13 (2), W-Finals: m14 (1)
    // C-R1: m15-m18 (4), C-R2: m19-m20 (2), C-R3: m21-m22 (2), C-Finals: m23 (1)

    // Winners Round 1 - m0 to m7
    seedMatchups.forEach(([seedA, seedB], idx) => {
      const teamA = getTeamBySeed(seedA);
      const teamB = getTeamBySeed(seedB);
      const nextWinnerIdx = 8 + Math.floor(idx / 2);  // m8-m11
      const nextLoserIdx = 15 + Math.floor(idx / 2);  // m15-m18 (C-R1)

      matches.push({
        id: matchIds[matchIndex],
        tournament_id: tournamentId,
        bracket_type: "winners",
        round_number: 1,
        match_number: matchIndex + 1,
        position_in_round: idx + 1,
        team_a_id: teamA?.id || null,
        team_b_id: teamB?.id || null,
        next_winner_match_id: matchIds[nextWinnerIdx],
        next_loser_match_id: matchIds[nextLoserIdx],
        is_finals: false,
        status: "pending",
      });
      matchIndex++;
    });

    // Winners Round 2 - m8 to m11
    for (let i = 0; i < 4; i++) {
      const nextWinnerIdx = 12 + Math.floor(i / 2);  // m12-m13
      const nextLoserIdx = 19 + Math.floor(i / 2);   // m19-m20 (C-R2)

      matches.push({
        id: matchIds[matchIndex],
        tournament_id: tournamentId,
        bracket_type: "winners",
        round_number: 2,
        match_number: matchIndex + 1,
        position_in_round: i + 1,
        team_a_id: null,
        team_b_id: null,
        next_winner_match_id: matchIds[nextWinnerIdx],
        next_loser_match_id: matchIds[nextLoserIdx],
        is_finals: false,
        status: "pending",
      });
      matchIndex++;
    }

    // Winners Round 3 (Semis) - m12, m13
    for (let i = 0; i < 2; i++) {
      matches.push({
        id: matchIds[matchIndex],
        tournament_id: tournamentId,
        bracket_type: "winners",
        round_number: 3,
        match_number: matchIndex + 1,
        position_in_round: i + 1,
        team_a_id: null,
        team_b_id: null,
        next_winner_match_id: matchIds[14], // Finals
        next_loser_match_id: matchIds[21 + i], // C-R3 (m21-m22)
        is_finals: false,
        status: "pending",
      });
      matchIndex++;
    }

    // Winners Finals - m14
    matches.push({
      id: matchIds[matchIndex],
      tournament_id: tournamentId,
      bracket_type: "winners",
      round_number: 4,
      match_number: matchIndex + 1,
      position_in_round: 1,
      team_a_id: null,
      team_b_id: null,
      next_winner_match_id: null,
      next_loser_match_id: null,
      is_finals: true,
      status: "pending",
    });
    matchIndex++;

    // Consolation Round 1 - m15 to m18 (8 W-R1 losers → 4 matches)
    for (let i = 0; i < 4; i++) {
      matches.push({
        id: matchIds[matchIndex],
        tournament_id: tournamentId,
        bracket_type: "consolation",
        round_number: 1,
        match_number: matchIndex + 1,
        position_in_round: i + 1,
        team_a_id: null,
        team_b_id: null,
        next_winner_match_id: matchIds[19 + Math.floor(i / 2)], // C-R2 (m19-m20)
        next_loser_match_id: null,
        is_finals: false,
        status: "pending",
      });
      matchIndex++;
    }

    // Consolation Round 2 - m19, m20 (C-R1 winners + W-R2 losers → 2 matches)
    for (let i = 0; i < 2; i++) {
      matches.push({
        id: matchIds[matchIndex],
        tournament_id: tournamentId,
        bracket_type: "consolation",
        round_number: 2,
        match_number: matchIndex + 1,
        position_in_round: i + 1,
        team_a_id: null,
        team_b_id: null,
        next_winner_match_id: matchIds[21 + i], // C-R3 (m21-m22)
        next_loser_match_id: null,
        is_finals: false,
        status: "pending",
      });
      matchIndex++;
    }

    // Consolation Round 3 - m21, m22 (C-R2 winners + W-R3 losers → 2 matches)
    for (let i = 0; i < 2; i++) {
      matches.push({
        id: matchIds[matchIndex],
        tournament_id: tournamentId,
        bracket_type: "consolation",
        round_number: 3,
        match_number: matchIndex + 1,
        position_in_round: i + 1,
        team_a_id: null,
        team_b_id: null,
        next_winner_match_id: matchIds[23], // C-Finals (m23)
        next_loser_match_id: null,
        is_finals: false,
        status: "pending",
      });
      matchIndex++;
    }

    // Consolation Finals - m23 (2 C-R3 winners → 3rd place)
    matches.push({
      id: matchIds[matchIndex],
      tournament_id: tournamentId,
      bracket_type: "consolation",
      round_number: 4,
      match_number: matchIndex + 1,
      position_in_round: 1,
      team_a_id: null,
      team_b_id: null,
      next_winner_match_id: null,
      next_loser_match_id: null,
      is_finals: true,
      status: "pending",
    });

  } else if (bracketSize === 32) {
    // 32-team bracket: 48 matches total (31 winners + 17 consolation)
    // Similar structure to 16-team but scaled up
    const seedMatchups = [
      [1, 32], [16, 17], [8, 25], [9, 24],
      [4, 29], [13, 20], [5, 28], [12, 21],
      [2, 31], [15, 18], [7, 26], [10, 23],
      [3, 30], [14, 19], [6, 27], [11, 22]
    ];

    // Match index layout:
    // W-R1: m0-m15 (16), W-R2: m16-m23 (8), W-R3: m24-m27 (4), W-R4: m28-m29 (2), W-Finals: m30 (1)
    // C-R1: m31-m38 (8), C-R2: m39-m42 (4), C-R3: m43-m44 (2), C-R4: m45-m46 (2), C-Finals: m47 (1)

    // Winners Round 1 - m0 to m15
    seedMatchups.forEach(([seedA, seedB], idx) => {
      const teamA = getTeamBySeed(seedA);
      const teamB = getTeamBySeed(seedB);
      const nextWinnerIdx = 16 + Math.floor(idx / 2);  // m16-m23
      const nextLoserIdx = 31 + Math.floor(idx / 2);   // m31-m38 (C-R1)

      matches.push({
        id: matchIds[matchIndex],
        tournament_id: tournamentId,
        bracket_type: "winners",
        round_number: 1,
        match_number: matchIndex + 1,
        position_in_round: idx + 1,
        team_a_id: teamA?.id || null,
        team_b_id: teamB?.id || null,
        next_winner_match_id: matchIds[nextWinnerIdx],
        next_loser_match_id: matchIds[nextLoserIdx],
        is_finals: false,
        status: "pending",
      });
      matchIndex++;
    });

    // Winners Round 2 - m16 to m23
    for (let i = 0; i < 8; i++) {
      const nextWinnerIdx = 24 + Math.floor(i / 2);  // m24-m27
      const nextLoserIdx = 39 + Math.floor(i / 2);   // m39-m42 (C-R2)

      matches.push({
        id: matchIds[matchIndex],
        tournament_id: tournamentId,
        bracket_type: "winners",
        round_number: 2,
        match_number: matchIndex + 1,
        position_in_round: i + 1,
        team_a_id: null,
        team_b_id: null,
        next_winner_match_id: matchIds[nextWinnerIdx],
        next_loser_match_id: matchIds[nextLoserIdx],
        is_finals: false,
        status: "pending",
      });
      matchIndex++;
    }

    // Winners Round 3 - m24 to m27
    for (let i = 0; i < 4; i++) {
      const nextWinnerIdx = 28 + Math.floor(i / 2);  // m28-m29
      const nextLoserIdx = 43 + Math.floor(i / 2);   // m43-m44 (C-R3)

      matches.push({
        id: matchIds[matchIndex],
        tournament_id: tournamentId,
        bracket_type: "winners",
        round_number: 3,
        match_number: matchIndex + 1,
        position_in_round: i + 1,
        team_a_id: null,
        team_b_id: null,
        next_winner_match_id: matchIds[nextWinnerIdx],
        next_loser_match_id: matchIds[nextLoserIdx],
        is_finals: false,
        status: "pending",
      });
      matchIndex++;
    }

    // Winners Round 4 (Semis) - m28, m29
    for (let i = 0; i < 2; i++) {
      matches.push({
        id: matchIds[matchIndex],
        tournament_id: tournamentId,
        bracket_type: "winners",
        round_number: 4,
        match_number: matchIndex + 1,
        position_in_round: i + 1,
        team_a_id: null,
        team_b_id: null,
        next_winner_match_id: matchIds[30], // Finals
        next_loser_match_id: matchIds[45 + i], // m45-m46 (C-R4)
        is_finals: false,
        status: "pending",
      });
      matchIndex++;
    }

    // Winners Finals - m30
    matches.push({
      id: matchIds[matchIndex],
      tournament_id: tournamentId,
      bracket_type: "winners",
      round_number: 5,
      match_number: matchIndex + 1,
      position_in_round: 1,
      team_a_id: null,
      team_b_id: null,
      next_winner_match_id: null,
      next_loser_match_id: null,
      is_finals: true,
      status: "pending",
    });
    matchIndex++;

    // Consolation Round 1 - m31 to m38 (16 W-R1 losers → 8 matches)
    for (let i = 0; i < 8; i++) {
      matches.push({
        id: matchIds[matchIndex],
        tournament_id: tournamentId,
        bracket_type: "consolation",
        round_number: 1,
        match_number: matchIndex + 1,
        position_in_round: i + 1,
        team_a_id: null,
        team_b_id: null,
        next_winner_match_id: matchIds[39 + Math.floor(i / 2)], // C-R2 (m39-m42)
        next_loser_match_id: null,
        is_finals: false,
        status: "pending",
      });
      matchIndex++;
    }

    // Consolation Round 2 - m39 to m42 (C-R1 winners + W-R2 losers → 4 matches)
    for (let i = 0; i < 4; i++) {
      matches.push({
        id: matchIds[matchIndex],
        tournament_id: tournamentId,
        bracket_type: "consolation",
        round_number: 2,
        match_number: matchIndex + 1,
        position_in_round: i + 1,
        team_a_id: null,
        team_b_id: null,
        next_winner_match_id: matchIds[43 + Math.floor(i / 2)], // C-R3 (m43-m44)
        next_loser_match_id: null,
        is_finals: false,
        status: "pending",
      });
      matchIndex++;
    }

    // Consolation Round 3 - m43, m44 (C-R2 winners + W-R3 losers → 2 matches)
    for (let i = 0; i < 2; i++) {
      matches.push({
        id: matchIds[matchIndex],
        tournament_id: tournamentId,
        bracket_type: "consolation",
        round_number: 3,
        match_number: matchIndex + 1,
        position_in_round: i + 1,
        team_a_id: null,
        team_b_id: null,
        next_winner_match_id: matchIds[45 + i], // C-R4 (m45-m46)
        next_loser_match_id: null,
        is_finals: false,
        status: "pending",
      });
      matchIndex++;
    }

    // Consolation Round 4 - m45, m46 (C-R3 winners + W-R4 losers → 2 matches)
    for (let i = 0; i < 2; i++) {
      matches.push({
        id: matchIds[matchIndex],
        tournament_id: tournamentId,
        bracket_type: "consolation",
        round_number: 4,
        match_number: matchIndex + 1,
        position_in_round: i + 1,
        team_a_id: null,
        team_b_id: null,
        next_winner_match_id: matchIds[47], // C-Finals (m47)
        next_loser_match_id: null,
        is_finals: false,
        status: "pending",
      });
      matchIndex++;
    }

    // Consolation Finals - m47
    matches.push({
      id: matchIds[matchIndex],
      tournament_id: tournamentId,
      bracket_type: "consolation",
      round_number: 5,
      match_number: matchIndex + 1,
      position_in_round: 1,
      team_a_id: null,
      team_b_id: null,
      next_winner_match_id: null,
      next_loser_match_id: null,
      is_finals: true,
      status: "pending",
    });

  } else {
    // Unsupported bracket size
    throw new Error(`Unsupported bracket size: ${bracketSize}`);
  }

  // Process byes - auto-advance teams with no opponent in R1
  console.log("[generateMatchStructure] Before bye processing:");
  matches.forEach(m => {
    console.log(`  Match ${m.match_number}: R${m.round_number} ${m.bracket_type} - team_a: ${m.team_a_id}, team_b: ${m.team_b_id}`);
  });

  const processedMatches = processMatchByes(matches);

  console.log("[generateMatchStructure] After bye processing:");
  processedMatches.forEach(m => {
    console.log(`  Match ${m.match_number}: R${m.round_number} ${m.bracket_type} - team_a: ${m.team_a_id}, team_b: ${m.team_b_id}, status: ${m.status}, winner: ${m.winner_id}`);
  });

  return processedMatches;
}

/**
 * Get total number of matches for a bracket size
 */
function getTotalMatchCount(bracketSize: number): number {
  if (bracketSize === 4) return 4;
  if (bracketSize === 8) return 12;
  if (bracketSize === 16) return 24; // 15 winners + 9 consolation
  if (bracketSize === 32) return 48; // 31 winners + 17 consolation
  throw new Error(`Unsupported bracket size: ${bracketSize}`);
}

/**
 * Process bye matches - mark as complete and record winner
 */
function processMatchByes(
  matches: Array<{
    id: string;
    tournament_id: string;
    bracket_type: "winners" | "consolation";
    round_number: number;
    match_number: number;
    position_in_round: number;
    team_a_id: string | null;
    team_b_id: string | null;
    next_winner_match_id: string | null;
    next_loser_match_id: string | null;
    is_finals: boolean;
    status: "pending" | "complete";
    winner_id?: string | null;
    completed_at?: string | null;
  }>
) {
  // Build map of which matches feed into which
  const feederMatches = new Map<string, { slotA: string | null; slotB: string | null }>();

  matches.forEach(match => {
    if (match.next_winner_match_id) {
      const existing = feederMatches.get(match.next_winner_match_id) || { slotA: null, slotB: null };
      const isSlotA = match.position_in_round % 2 === 1;
      if (isSlotA) {
        existing.slotA = match.id;
      } else {
        existing.slotB = match.id;
      }
      feederMatches.set(match.next_winner_match_id, existing);
    }
  });

  // Process round 1 matches for byes
  matches.forEach(match => {
    if (match.round_number !== 1 || match.bracket_type !== "winners") return;

    const hasTeamA = match.team_a_id !== null;
    const hasTeamB = match.team_b_id !== null;

    console.log(`[processMatchByes] Match ${match.match_number}: hasTeamA=${hasTeamA}, hasTeamB=${hasTeamB}, position=${match.position_in_round}`);

    // Check for bye: exactly one team
    if (hasTeamA !== hasTeamB) {
      const feeders = feederMatches.get(match.id);
      const emptySlotHasFeeder = hasTeamA
        ? (feeders?.slotB != null)
        : (feeders?.slotA != null);

      console.log(`[processMatchByes] Match ${match.match_number}: feeders=${JSON.stringify(feeders)}, emptySlotHasFeeder=${emptySlotHasFeeder}`);

      if (!emptySlotHasFeeder) {
        // This is a bye - auto-complete
        match.status = "complete";
        match.winner_id = hasTeamA ? match.team_a_id : match.team_b_id;
        match.completed_at = new Date().toISOString();

        console.log(`[processMatchByes] Match ${match.match_number}: BYE! winner=${match.winner_id}`);

        // Advance winner to next match
        if (match.next_winner_match_id && match.winner_id) {
          const nextMatch = matches.find(m => m.id === match.next_winner_match_id);
          if (nextMatch) {
            const isSlotA = match.position_in_round % 2 === 1;
            console.log(`[processMatchByes] Advancing to next match, isSlotA=${isSlotA}`);
            if (isSlotA) {
              nextMatch.team_a_id = match.winner_id;
            } else {
              nextMatch.team_b_id = match.winner_id;
            }
          }
        }
      }
    }
  });

  return matches;
}

/**
 * Reset bracket - deletes all match records (admin only, for testing)
 */
export async function resetBracket() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  const profileData = profile as { is_admin: boolean } | null;
  if (!profileData?.is_admin) {
    return { error: "Only admins can reset the bracket" };
  }

  // Get tournament
  const { data: tournament } = await supabase
    .from("tournament")
    .select("id")
    .single();

  if (!tournament) {
    return { error: "Tournament not found" };
  }

  const tournamentData = tournament as { id: string };

  // Delete all matches
  const { error: deleteError } = await supabase
    .from("matches")
    .delete()
    .eq("tournament_id", tournamentData.id);

  if (deleteError) {
    return { error: deleteError.message };
  }

  // Reset tournament bracket status
  const { error: updateError } = await supabase
    .from("tournament")
    .update({ bracket_status: "none" } as never)
    .eq("id", tournamentData.id);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath("/bracket");
  revalidatePath("/dashboard");
  revalidatePath("/admin");

  return { success: true };
}

/**
 * Start the tournament (admin only)
 * Sets event_date to the specified time or now
 */
export async function startTournament(scheduledDate?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  const profileData = profile as { is_admin: boolean } | null;
  if (!profileData?.is_admin) {
    return { error: "Only admins can start the tournament" };
  }

  // Set event_date to scheduled time or now
  const eventDate = scheduledDate || new Date().toISOString();

  const { error: updateError } = await supabase
    .from("tournament")
    .update({
      event_date: eventDate,
    } as never)
    .not("id", "is", null); // Update all rows (should be just one)

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath("/bracket");
  revalidatePath("/dashboard");
  revalidatePath("/menu");

  return { success: true, eventDate };
}

/**
 * Stop the tournament (admin only)
 * Clears event_date so tournament is no longer live
 */
export async function stopTournament() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  const profileData = profile as { is_admin: boolean } | null;
  if (!profileData?.is_admin) {
    return { error: "Only admins can stop the tournament" };
  }

  // Clear event_date
  const { error: updateError } = await supabase
    .from("tournament")
    .update({
      event_date: null,
    } as never)
    .not("id", "is", null);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath("/bracket");
  revalidatePath("/dashboard");
  revalidatePath("/menu");

  return { success: true };
}

/**
 * Get tournament status for current user
 */
export async function getTournamentStatus(): Promise<TournamentStatus> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get tournament data first to include event_date in response
  const { data: tournament } = await supabase
    .from("tournament")
    .select("bracket_status, registration_status, event_date")
    .single();

  const tournamentData = tournament as { bracket_status: string; registration_status: string; event_date: string | null } | null;

  // Default response
  const defaultStatus: TournamentStatus = {
    status: "registration",
    userPlacement: null,
    isEliminated: false,
    teamId: null,
    eventDate: tournamentData?.event_date || null,
  };

  if (!user) return defaultStatus;

  // Get user's team
  const { data: profile } = await supabase
    .from("profiles")
    .select("team_id")
    .eq("id", user.id)
    .single();

  const profileData = profile as { team_id: string | null } | null;
  if (!profileData?.team_id) return defaultStatus;

  const teamId = profileData.team_id;
  defaultStatus.teamId = teamId;

  // If bracket not published, still in registration
  if (!tournamentData || tournamentData.bracket_status !== "published") {
    return defaultStatus;
  }

  defaultStatus.status = "in_progress";

  // Get all matches
  const matches = await getAllBracketMatches();

  // Find championship finals and consolation finals
  const championshipFinals = matches.find(m => m.bracket_type === "winners" && m.is_finals);
  const consolationFinals = matches.find(m => m.bracket_type === "consolation" && m.is_finals);

  // Check if tournament is complete (both finals done)
  const isTournamentComplete =
    championshipFinals?.status === "complete" &&
    consolationFinals?.status === "complete";

  if (isTournamentComplete) {
    defaultStatus.status = "complete";
  }

  // Check user's placement
  if (championshipFinals?.winner_id === teamId) {
    defaultStatus.userPlacement = 1;
  } else if (championshipFinals?.loser_id === teamId) {
    defaultStatus.userPlacement = 2;
  } else if (consolationFinals?.winner_id === teamId) {
    defaultStatus.userPlacement = 3;
  } else if (consolationFinals?.loser_id === teamId) {
    defaultStatus.userPlacement = 4;
  }

  // Check if user is eliminated (lost in consolation bracket, not in finals)
  const userMatches = matches.filter(m => m.team_a_id === teamId || m.team_b_id === teamId);
  const lostConsolationMatch = userMatches.find(
    m => m.bracket_type === "consolation" &&
    m.status === "complete" &&
    m.loser_id === teamId &&
    !m.is_finals
  );

  if (lostConsolationMatch && !defaultStatus.userPlacement) {
    defaultStatus.isEliminated = true;
  }

  return defaultStatus;
}
