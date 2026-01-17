/**
 * Mock data for testing bracket logic
 * This file provides test data that doesn't touch the database
 *
 * BRACKET FORMAT: Consolation Bracket
 * - Winners Bracket: Plays for 1st and 2nd place
 * - Consolation Bracket: Plays for 3rd and 4th place
 */

import type { Profile, Team, Match, TeamWithPlayers } from "@/lib/types/database";

// ============================================================================
// MOCK PROFILES (Players)
// ============================================================================

export const mockProfiles: Profile[] = [
  { id: "p1", email: "alice@test.com", display_name: "Alice", is_admin: false, team_id: "t1", created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: "p2", email: "bob@test.com", display_name: "Bob", is_admin: false, team_id: "t1", created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: "p3", email: "charlie@test.com", display_name: "Charlie", is_admin: false, team_id: "t2", created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: "p4", email: "diana@test.com", display_name: "Diana", is_admin: false, team_id: "t2", created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: "p5", email: "evan@test.com", display_name: "Evan", is_admin: false, team_id: "t3", created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: "p6", email: "fiona@test.com", display_name: "Fiona", is_admin: false, team_id: "t3", created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: "p7", email: "george@test.com", display_name: "George", is_admin: false, team_id: "t4", created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: "p8", email: "hannah@test.com", display_name: "Hannah", is_admin: false, team_id: "t4", created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: "p9", email: "ivan@test.com", display_name: "Ivan", is_admin: false, team_id: "t5", created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: "p10", email: "julia@test.com", display_name: "Julia", is_admin: false, team_id: "t5", created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: "p11", email: "kevin@test.com", display_name: "Kevin", is_admin: false, team_id: "t6", created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: "p12", email: "laura@test.com", display_name: "Laura", is_admin: false, team_id: "t6", created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: "p13", email: "mike@test.com", display_name: "Mike", is_admin: false, team_id: "t7", created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: "p14", email: "nina@test.com", display_name: "Nina", is_admin: false, team_id: "t7", created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: "p15", email: "oscar@test.com", display_name: "Oscar", is_admin: false, team_id: "t8", created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: "p16", email: "penny@test.com", display_name: "Penny", is_admin: false, team_id: "t8", created_at: "2024-01-01", updated_at: "2024-01-01" },
];

// ============================================================================
// MOCK TEAMS
// ============================================================================

export const mockTeams: Team[] = [
  { id: "t1", name: "Corn Stars", player1_id: "p1", player2_id: "p2", invite_token: "token1", seed_number: 1, created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: "t2", name: "Hole in One", player1_id: "p3", player2_id: "p4", invite_token: "token2", seed_number: 2, created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: "t3", name: "Bag Daddies", player1_id: "p5", player2_id: "p6", invite_token: "token3", seed_number: 3, created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: "t4", name: "Toss Bosses", player1_id: "p7", player2_id: "p8", invite_token: "token4", seed_number: 4, created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: "t5", name: "Board Certified", player1_id: "p9", player2_id: "p10", invite_token: "token5", seed_number: 5, created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: "t6", name: "The Corntenders", player1_id: "p11", player2_id: "p12", invite_token: "token6", seed_number: 6, created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: "t7", name: "Sack Attack", player1_id: "p13", player2_id: "p14", invite_token: "token7", seed_number: 7, created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: "t8", name: "Kernel Sanders", player1_id: "p15", player2_id: "p16", invite_token: "token8", seed_number: 8, created_at: "2024-01-01", updated_at: "2024-01-01" },
];

// Helper to get teams with player data
export function getMockTeamsWithPlayers(count?: number): TeamWithPlayers[] {
  const teams = count ? mockTeams.slice(0, count) : mockTeams;
  return teams.map(team => ({
    ...team,
    player1: mockProfiles.find(p => p.id === team.player1_id) || null,
    player2: mockProfiles.find(p => p.id === team.player2_id) || null,
  }));
}

// ============================================================================
// BRACKET GENERATION UTILITIES
// ============================================================================

const TOURNAMENT_ID = "test-tournament-1";

type BracketType = "winners" | "consolation";

interface MatchWithTeams extends Match {
  team_a: { id: string; name: string } | null;
  team_b: { id: string; name: string } | null;
  winner: { id: string; name: string } | null;
}

let matchCounter = 0;

function createMatch(
  bracketType: BracketType,
  roundNumber: number,
  positionInRound: number,
  teamAId: string | null = null,
  teamBId: string | null = null,
  isFinals: boolean = false,
): Match {
  matchCounter++;
  return {
    id: `m${matchCounter}`,
    tournament_id: TOURNAMENT_ID,
    bracket_type: bracketType,
    round_number: roundNumber,
    match_number: matchCounter,
    position_in_round: positionInRound,
    team_a_id: teamAId,
    team_b_id: teamBId,
    score_a: null,
    score_b: null,
    winner_id: null,
    loser_id: null,
    next_winner_match_id: null,
    next_loser_match_id: null,
    is_finals: isFinals,
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
  };
}

function addTeamData(match: Match): MatchWithTeams {
  const teamA = mockTeams.find(t => t.id === match.team_a_id);
  const teamB = mockTeams.find(t => t.id === match.team_b_id);
  const winner = mockTeams.find(t => t.id === match.winner_id);

  return {
    ...match,
    team_a: teamA ? { id: teamA.id, name: teamA.name } : null,
    team_b: teamB ? { id: teamB.id, name: teamB.name } : null,
    winner: winner ? { id: winner.id, name: winner.name } : null,
  };
}

/**
 * Generate a consolation bracket for 8 teams
 *
 * Structure:
 * WINNERS BRACKET (plays for 1st/2nd):
 *   - Round 1: 4 matches (quarterfinals)
 *   - Round 2: 2 matches (semifinals)
 *   - Round 3: 1 match (finals - 1st vs 2nd)
 *
 * CONSOLATION BRACKET (plays for 3rd/4th):
 *   - Round 1: 2 matches (losers from Winners R1)
 *   - Round 2: 2 matches (Consolation R1 winners vs Winners Semifinal losers)
 *   - Round 3: 1 match (consolation finals - 3rd vs 4th)
 */
export function generateSeededBracket(teamCount: number = 8): MatchWithTeams[] {
  matchCounter = 0;
  const teams = getMockTeamsWithPlayers(teamCount);
  const matches: Match[] = [];

  // Standard seeding for 8 teams - ensures top seeds don't meet until later
  // 1v8, 4v5, 2v7, 3v6
  const seedMatchups = [
    [1, 8], // Match 1
    [4, 5], // Match 2
    [2, 7], // Match 3
    [3, 6], // Match 4
  ];

  // ========== WINNERS BRACKET ==========

  // Winners Round 1 (Quarterfinals)
  seedMatchups.forEach(([seedA, seedB], index) => {
    const teamA = teams.find(t => t.seed_number === seedA);
    const teamB = teams.find(t => t.seed_number === seedB);
    matches.push(createMatch(
      "winners",
      1,
      index + 1,
      teamA?.id || null,
      teamB?.id || null,
    ));
  });

  // Winners Round 2 (Semifinals)
  // Match 5: Winner of M1 vs Winner of M2
  // Match 6: Winner of M3 vs Winner of M4
  matches.push(createMatch("winners", 2, 1)); // m5
  matches.push(createMatch("winners", 2, 2)); // m6

  // Winners Round 3 (Finals - 1st vs 2nd)
  matches.push(createMatch("winners", 3, 1, null, null, true)); // m7 - Finals

  // ========== CONSOLATION BRACKET ==========

  // Consolation Round 1
  // Match 8: Loser of M1 vs Loser of M2
  // Match 9: Loser of M3 vs Loser of M4
  matches.push(createMatch("consolation", 1, 1)); // m8
  matches.push(createMatch("consolation", 1, 2)); // m9

  // Consolation Round 2
  // Match 10: Winner of M8 vs Loser of M5 (semifinal loser)
  // Match 11: Winner of M9 vs Loser of M6 (semifinal loser)
  matches.push(createMatch("consolation", 2, 1)); // m10
  matches.push(createMatch("consolation", 2, 2)); // m11

  // Consolation Round 3 (Consolation Finals - 3rd vs 4th)
  matches.push(createMatch("consolation", 3, 1, null, null, true)); // m12 - Consolation Finals

  return matches.map(addTeamData);
}

/**
 * Simulate a match result
 */
export function simulateMatchResult(
  matches: MatchWithTeams[],
  matchId: string,
  winnerId: string,
  scoreA: number,
  scoreB: number
): MatchWithTeams[] {
  return matches.map(match => {
    if (match.id === matchId) {
      const loserId = match.team_a_id === winnerId ? match.team_b_id : match.team_a_id;
      const winner = mockTeams.find(t => t.id === winnerId);
      return {
        ...match,
        winner_id: winnerId,
        loser_id: loserId,
        score_a: scoreA,
        score_b: scoreB,
        winner: winner ? { id: winner.id, name: winner.name } : null,
      };
    }
    return match;
  });
}

/**
 * Advance winner to next match in bracket
 */
export function advanceWinner(
  matches: MatchWithTeams[],
  fromMatchId: string,
  toMatchId: string,
  slot: "team_a" | "team_b"
): MatchWithTeams[] {
  const fromMatch = matches.find(m => m.id === fromMatchId);
  if (!fromMatch?.winner_id) return matches;

  return matches.map(match => {
    if (match.id === toMatchId) {
      const team = mockTeams.find(t => t.id === fromMatch.winner_id);
      if (slot === "team_a") {
        return {
          ...match,
          team_a_id: fromMatch.winner_id,
          team_a: team ? { id: team.id, name: team.name } : null,
        };
      } else {
        return {
          ...match,
          team_b_id: fromMatch.winner_id,
          team_b: team ? { id: team.id, name: team.name } : null,
        };
      }
    }
    return match;
  });
}

/**
 * Drop loser to consolation bracket
 */
export function dropToConsolation(
  matches: MatchWithTeams[],
  fromMatchId: string,
  toMatchId: string,
  slot: "team_a" | "team_b"
): MatchWithTeams[] {
  const fromMatch = matches.find(m => m.id === fromMatchId);
  if (!fromMatch?.loser_id) return matches;

  return matches.map(match => {
    if (match.id === toMatchId) {
      const team = mockTeams.find(t => t.id === fromMatch.loser_id);
      if (slot === "team_a") {
        return {
          ...match,
          team_a_id: fromMatch.loser_id,
          team_a: team ? { id: team.id, name: team.name } : null,
        };
      } else {
        return {
          ...match,
          team_b_id: fromMatch.loser_id,
          team_b: team ? { id: team.id, name: team.name } : null,
        };
      }
    }
    return match;
  });
}

// Legacy alias for backwards compatibility
export const dropToLosers = dropToConsolation;

// ============================================================================
// PRE-BUILT SCENARIOS FOR TESTING
// ============================================================================

/**
 * 8-team bracket with no results yet (just seeded)
 */
export function get8TeamFreshBracket(): MatchWithTeams[] {
  return generateSeededBracket(8);
}

/**
 * 8-team bracket with Winners Round 1 complete
 * Higher seeds win their matches
 */
export function get8TeamRound1Complete(): MatchWithTeams[] {
  let matches = generateSeededBracket(8);

  // Winners Round 1 results: higher seeds win
  // m1: Seed 1 (Corn Stars) beats Seed 8 (Kernel Sanders)
  matches = simulateMatchResult(matches, "m1", "t1", 21, 15);
  // m2: Seed 4 (Toss Bosses) beats Seed 5 (Board Certified)
  matches = simulateMatchResult(matches, "m2", "t4", 21, 18);
  // m3: Seed 2 (Hole in One) beats Seed 7 (Sack Attack)
  matches = simulateMatchResult(matches, "m3", "t2", 21, 12);
  // m4: Seed 3 (Bag Daddies) beats Seed 6 (The Corntenders)
  matches = simulateMatchResult(matches, "m4", "t3", 21, 19);

  // Advance winners to Winners Semifinals
  matches = advanceWinner(matches, "m1", "m5", "team_a"); // Corn Stars to m5
  matches = advanceWinner(matches, "m2", "m5", "team_b"); // Toss Bosses to m5
  matches = advanceWinner(matches, "m3", "m6", "team_a"); // Hole in One to m6
  matches = advanceWinner(matches, "m4", "m6", "team_b"); // Bag Daddies to m6

  // Drop losers to Consolation Round 1
  matches = dropToConsolation(matches, "m1", "m8", "team_a"); // Kernel Sanders to m8
  matches = dropToConsolation(matches, "m2", "m8", "team_b"); // Board Certified to m8
  matches = dropToConsolation(matches, "m3", "m9", "team_a"); // Sack Attack to m9
  matches = dropToConsolation(matches, "m4", "m9", "team_b"); // The Corntenders to m9

  return matches;
}

/**
 * 8-team bracket with Winners Semifinals complete
 */
export function get8TeamSemisComplete(): MatchWithTeams[] {
  let matches = get8TeamRound1Complete();

  // Winners Semifinals
  // m5: Corn Stars beats Toss Bosses
  matches = simulateMatchResult(matches, "m5", "t1", 21, 17);
  // m6: Hole in One beats Bag Daddies
  matches = simulateMatchResult(matches, "m6", "t2", 21, 20);

  // Consolation Round 1
  // m8: Kernel Sanders beats Board Certified
  matches = simulateMatchResult(matches, "m8", "t8", 21, 14);
  // m9: Sack Attack beats The Corntenders
  matches = simulateMatchResult(matches, "m9", "t7", 21, 16);

  // Advance to Winners Finals
  matches = advanceWinner(matches, "m5", "m7", "team_a"); // Corn Stars
  matches = advanceWinner(matches, "m6", "m7", "team_b"); // Hole in One

  // Advance Consolation R1 winners + drop Semifinal losers to Consolation R2
  matches = advanceWinner(matches, "m8", "m10", "team_a"); // Kernel Sanders
  matches = dropToConsolation(matches, "m5", "m10", "team_b"); // Toss Bosses (semi loser)
  matches = advanceWinner(matches, "m9", "m11", "team_a"); // Sack Attack
  matches = dropToConsolation(matches, "m6", "m11", "team_b"); // Bag Daddies (semi loser)

  return matches;
}

/**
 * 8-team bracket near completion (Finals ready)
 */
export function get8TeamFinalsReady(): MatchWithTeams[] {
  let matches = get8TeamSemisComplete();

  // Consolation Round 2
  // m10: Kernel Sanders beats Toss Bosses
  matches = simulateMatchResult(matches, "m10", "t8", 21, 19);
  // m11: Bag Daddies beats Sack Attack
  matches = simulateMatchResult(matches, "m11", "t3", 21, 18);

  // Advance to Consolation Finals
  matches = advanceWinner(matches, "m10", "m12", "team_a"); // Kernel Sanders
  matches = advanceWinner(matches, "m11", "m12", "team_b"); // Bag Daddies

  return matches;
}

/**
 * 8-team bracket complete
 */
export function get8TeamComplete(): MatchWithTeams[] {
  let matches = get8TeamFinalsReady();

  // Winners Finals (1st vs 2nd)
  // m7: Corn Stars beats Hole in One - CHAMPIONS!
  matches = simulateMatchResult(matches, "m7", "t1", 21, 18);

  // Consolation Finals (3rd vs 4th)
  // m12: Kernel Sanders beats Bag Daddies for 3rd place
  matches = simulateMatchResult(matches, "m12", "t8", 21, 17);

  return matches;
}

/**
 * 4-team bracket (simpler for testing)
 */
export function get4TeamFreshBracket(): MatchWithTeams[] {
  matchCounter = 0;
  const teams = getMockTeamsWithPlayers(4);
  const matches: Match[] = [];

  // Winners Round 1 (Semifinals)
  // 1v4, 2v3
  const teamA1 = teams.find(t => t.seed_number === 1);
  const teamB1 = teams.find(t => t.seed_number === 4);
  const teamA2 = teams.find(t => t.seed_number === 2);
  const teamB2 = teams.find(t => t.seed_number === 3);

  matches.push(createMatch("winners", 1, 1, teamA1?.id, teamB1?.id)); // m1
  matches.push(createMatch("winners", 1, 2, teamA2?.id, teamB2?.id)); // m2

  // Winners Finals (1st vs 2nd)
  matches.push(createMatch("winners", 2, 1, null, null, true)); // m3

  // Consolation Finals (3rd vs 4th) - losers of semifinals
  matches.push(createMatch("consolation", 1, 1, null, null, true)); // m4

  return matches.map(addTeamData);
}

/**
 * 4-team bracket complete
 */
export function get4TeamComplete(): MatchWithTeams[] {
  let matches = get4TeamFreshBracket();

  // Winners Round 1 (Semifinals)
  matches = simulateMatchResult(matches, "m1", "t1", 21, 12); // Corn Stars beats Toss Bosses
  matches = simulateMatchResult(matches, "m2", "t2", 21, 18); // Hole in One beats Bag Daddies

  // Advance to Finals
  matches = advanceWinner(matches, "m1", "m3", "team_a");
  matches = advanceWinner(matches, "m2", "m3", "team_b");

  // Drop to Consolation Finals
  matches = dropToConsolation(matches, "m1", "m4", "team_a");
  matches = dropToConsolation(matches, "m2", "m4", "team_b");

  // Winners Finals
  matches = simulateMatchResult(matches, "m3", "t1", 21, 19); // Corn Stars wins!

  // Consolation Finals
  matches = simulateMatchResult(matches, "m4", "t3", 21, 15); // Bag Daddies takes 3rd

  return matches;
}

// Legacy aliases
export const get8TeamHalfway = get8TeamSemisComplete;
export const generateEmptyBracket = generateSeededBracket;

// ============================================================================
// EXPORTS SUMMARY
// ============================================================================

export type { MatchWithTeams };
