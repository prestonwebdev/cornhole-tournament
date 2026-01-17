/**
 * Mock data for testing bracket logic
 * This file provides test data that doesn't touch the database
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

type BracketType = "winners" | "losers" | "grand_finals";

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
 * Generate a double elimination bracket for a given number of teams
 * Returns empty matches ready for seeding
 */
export function generateEmptyBracket(teamCount: number): MatchWithTeams[] {
  matchCounter = 0;
  const matches: Match[] = [];

  // Calculate rounds needed for winners bracket
  const winnersRounds = Math.ceil(Math.log2(teamCount));

  // Winners Bracket
  let matchesInRound = Math.ceil(teamCount / 2);
  for (let round = 1; round <= winnersRounds; round++) {
    for (let pos = 1; pos <= matchesInRound; pos++) {
      matches.push(createMatch("winners", round, pos));
    }
    matchesInRound = Math.ceil(matchesInRound / 2);
  }

  // Losers Bracket (roughly 2x winners rounds - 1)
  const losersRounds = (winnersRounds - 1) * 2;
  matchesInRound = Math.ceil(teamCount / 4);
  for (let round = 1; round <= losersRounds; round++) {
    // Losers bracket has variable matches per round
    const matchesThisRound = round % 2 === 1 ? matchesInRound : matchesInRound;
    for (let pos = 1; pos <= matchesThisRound; pos++) {
      matches.push(createMatch("losers", round, pos));
    }
    if (round % 2 === 0) {
      matchesInRound = Math.ceil(matchesInRound / 2);
    }
  }

  // Grand Finals (potentially 2 matches if losers bracket winner wins first)
  matches.push(createMatch("grand_finals", 1, 1));

  return matches.map(addTeamData);
}

/**
 * Generate a seeded bracket with teams placed according to standard seeding
 * Seed 1 vs Seed 8, Seed 4 vs Seed 5, Seed 2 vs Seed 7, Seed 3 vs Seed 6
 */
export function generateSeededBracket(teamCount: number): MatchWithTeams[] {
  matchCounter = 0;
  const teams = getMockTeamsWithPlayers(teamCount);
  const matches: Match[] = [];

  // Standard seeding order for first round (for 8 teams)
  // This ensures top seeds don't meet until later rounds
  const seedOrder8 = [
    [1, 8], // Seed 1 vs Seed 8
    [4, 5], // Seed 4 vs Seed 5
    [2, 7], // Seed 2 vs Seed 7
    [3, 6], // Seed 3 vs Seed 6
  ];

  const seedOrder4 = [
    [1, 4],
    [2, 3],
  ];

  const seedOrder = teamCount <= 4 ? seedOrder4 : seedOrder8;
  const actualMatchups = seedOrder.slice(0, Math.ceil(teamCount / 2));

  // Winners Bracket Round 1
  actualMatchups.forEach(([seedA, seedB], index) => {
    const teamA = teams.find(t => t.seed_number === seedA);
    const teamB = teams.find(t => t.seed_number === seedB);
    matches.push(createMatch(
      "winners",
      1,
      index + 1,
      teamA?.id || null,
      teamB?.id || null
    ));
  });

  // Winners Bracket subsequent rounds (empty)
  const winnersRounds = Math.ceil(Math.log2(teamCount));
  let matchesInRound = Math.ceil(actualMatchups.length / 2);
  for (let round = 2; round <= winnersRounds; round++) {
    for (let pos = 1; pos <= matchesInRound; pos++) {
      matches.push(createMatch("winners", round, pos));
    }
    matchesInRound = Math.ceil(matchesInRound / 2);
  }

  // Losers Bracket (empty)
  const losersRounds = Math.max(1, (winnersRounds - 1) * 2);
  matchesInRound = Math.ceil(teamCount / 4);
  for (let round = 1; round <= losersRounds; round++) {
    const matchesThisRound = Math.max(1, matchesInRound);
    for (let pos = 1; pos <= matchesThisRound; pos++) {
      matches.push(createMatch("losers", round, pos));
    }
    if (round % 2 === 0 && matchesInRound > 1) {
      matchesInRound = Math.ceil(matchesInRound / 2);
    }
  }

  // Grand Finals
  matches.push(createMatch("grand_finals", 1, 1));

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
 * Drop loser to losers bracket
 */
export function dropToLosers(
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
 * 8-team bracket with round 1 complete
 */
export function get8TeamRound1Complete(): MatchWithTeams[] {
  let matches = generateSeededBracket(8);

  // Winners Round 1 results: higher seeds win
  matches = simulateMatchResult(matches, "m1", "t1", 21, 15); // Corn Stars beats Kernel Sanders
  matches = simulateMatchResult(matches, "m2", "t4", 21, 18); // Toss Bosses beats Board Certified
  matches = simulateMatchResult(matches, "m3", "t2", 21, 12); // Hole in One beats Sack Attack
  matches = simulateMatchResult(matches, "m4", "t3", 21, 19); // Bag Daddies beats The Corntenders

  // Advance winners to Winners R2
  matches = advanceWinner(matches, "m1", "m5", "team_a");
  matches = advanceWinner(matches, "m2", "m5", "team_b");
  matches = advanceWinner(matches, "m3", "m6", "team_a");
  matches = advanceWinner(matches, "m4", "m6", "team_b");

  // Drop losers to Losers R1
  matches = dropToLosers(matches, "m1", "m7", "team_a");
  matches = dropToLosers(matches, "m2", "m7", "team_b");
  matches = dropToLosers(matches, "m3", "m8", "team_a");
  matches = dropToLosers(matches, "m4", "m8", "team_b");

  return matches;
}

/**
 * 8-team bracket halfway through
 */
export function get8TeamHalfway(): MatchWithTeams[] {
  let matches = get8TeamRound1Complete();

  // Winners R2
  matches = simulateMatchResult(matches, "m5", "t1", 21, 17); // Corn Stars beats Toss Bosses
  matches = simulateMatchResult(matches, "m6", "t2", 21, 20); // Hole in One beats Bag Daddies

  // Losers R1
  matches = simulateMatchResult(matches, "m7", "t8", 21, 14); // Kernel Sanders beats Board Certified
  matches = simulateMatchResult(matches, "m8", "t7", 21, 16); // Sack Attack beats The Corntenders

  // Advance winners
  matches = advanceWinner(matches, "m5", "m9", "team_a"); // Winners Finals
  matches = advanceWinner(matches, "m6", "m9", "team_b");

  // Losers R2 - Winners R2 losers drop down
  matches = dropToLosers(matches, "m5", "m10", "team_a");
  matches = dropToLosers(matches, "m6", "m10", "team_b");

  // Losers R1 winners advance
  matches = advanceWinner(matches, "m7", "m10", "team_a");
  matches = advanceWinner(matches, "m8", "m11", "team_a");

  return matches;
}

/**
 * 4-team bracket (simpler for testing)
 */
export function get4TeamFreshBracket(): MatchWithTeams[] {
  return generateSeededBracket(4);
}

/**
 * 4-team bracket complete (for testing grand finals)
 */
export function get4TeamComplete(): MatchWithTeams[] {
  let matches = generateSeededBracket(4);

  // Winners R1
  matches = simulateMatchResult(matches, "m1", "t1", 21, 12); // Corn Stars beats Toss Bosses
  matches = simulateMatchResult(matches, "m2", "t2", 21, 18); // Hole in One beats Bag Daddies

  // Advance to Winners Finals
  matches = advanceWinner(matches, "m1", "m3", "team_a");
  matches = advanceWinner(matches, "m2", "m3", "team_b");

  // Drop to Losers
  matches = dropToLosers(matches, "m1", "m4", "team_a");
  matches = dropToLosers(matches, "m2", "m4", "team_b");

  // Winners Finals
  matches = simulateMatchResult(matches, "m3", "t1", 21, 19); // Corn Stars wins

  // Losers R1
  matches = simulateMatchResult(matches, "m4", "t3", 21, 15); // Bag Daddies beats Toss Bosses

  // Losers Finals (Winners Finals loser vs Losers winner)
  matches = dropToLosers(matches, "m3", "m5", "team_a");
  matches = advanceWinner(matches, "m4", "m5", "team_b");
  matches = simulateMatchResult(matches, "m5", "t2", 21, 17); // Hole in One comes back

  // Grand Finals
  matches = advanceWinner(matches, "m3", "m6", "team_a"); // Corn Stars from winners
  matches = advanceWinner(matches, "m5", "m6", "team_b"); // Hole in One from losers

  return matches;
}

// ============================================================================
// EXPORTS SUMMARY
// ============================================================================

export type { MatchWithTeams };
