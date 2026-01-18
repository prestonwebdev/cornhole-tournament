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

// Generate mock profiles for up to 32 teams (64 players)
const playerNames = [
  "Alice", "Bob", "Charlie", "Diana", "Evan", "Fiona", "George", "Hannah",
  "Ivan", "Julia", "Kevin", "Laura", "Mike", "Nina", "Oscar", "Penny",
  "Quinn", "Rachel", "Steve", "Tina", "Ulysses", "Vera", "Walter", "Xena",
  "Yusuf", "Zoe", "Adam", "Bella", "Chris", "Daisy", "Eric", "Faith",
  "Gary", "Holly", "Ian", "Jade", "Kyle", "Luna", "Mason", "Nora",
  "Owen", "Paige", "Quentin", "Rosa", "Sam", "Tara", "Uma", "Victor",
  "Wade", "Willow", "Xavier", "Yara", "Zack", "Amy", "Ben", "Chloe",
  "Dan", "Emma", "Frank", "Grace", "Henry", "Ivy", "Jack", "Kate"
];

export const mockProfiles: Profile[] = playerNames.map((name, index) => ({
  id: `p${index + 1}`,
  email: `${name.toLowerCase()}@test.com`,
  display_name: name,
  is_admin: false,
  team_id: `t${Math.floor(index / 2) + 1}`,
  created_at: "2024-01-01",
  updated_at: "2024-01-01",
}));

// ============================================================================
// MOCK TEAMS
// ============================================================================

// Generate mock teams for up to 32 teams
const teamNames = [
  "Corn Stars", "Hole in One", "Bag Daddies", "Toss Bosses",
  "Board Certified", "The Corntenders", "Sack Attack", "Kernel Sanders",
  "Maize Madness", "Husker Heroes", "Bag Raiders", "Corn Dawgs",
  "Toss Masters", "Hole Lotta Fun", "Bean Bag Bandits", "Cornucopia",
  "The Bag End", "Corn Fed", "Toss It Up", "Board Warriors",
  "Sack Masters", "Corn Crushers", "Hole Patrol", "Bag Ballers",
  "Toss Dynasty", "Corn Nation", "Board Dominators", "Sack City",
  "Hole Hunters", "Bag Brigade", "Corn Kings", "Toss Titans"
];

export const mockTeams: Team[] = teamNames.map((name, index) => ({
  id: `t${index + 1}`,
  name,
  player1_id: `p${index * 2 + 1}`,
  player2_id: `p${index * 2 + 2}`,
  invite_token: `token${index + 1}`,
  seed_number: index + 1,
  created_at: "2024-01-01",
  updated_at: "2024-01-01",
}));

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

interface TeamInMatch {
  id: string;
  name: string;
  player1_name?: string | null;
  player2_name?: string | null;
}

interface MatchWithTeams extends Match {
  team_a: TeamInMatch | null;
  team_b: TeamInMatch | null;
  winner: TeamInMatch | null;
  is_bye?: boolean;
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
    status: "pending",
    started_at: null,
    completed_at: null,
    started_by: null,
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
  };
}

function getTeamWithPlayers(team: Team | undefined): TeamInMatch | null {
  if (!team) return null;
  const player1 = mockProfiles.find(p => p.id === team.player1_id);
  const player2 = mockProfiles.find(p => p.id === team.player2_id);
  return {
    id: team.id,
    name: team.name,
    player1_name: player1?.display_name || null,
    player2_name: player2?.display_name || null,
  };
}

function addTeamData(match: Match): MatchWithTeams {
  const teamA = mockTeams.find(t => t.id === match.team_a_id);
  const teamB = mockTeams.find(t => t.id === match.team_b_id);
  const winner = mockTeams.find(t => t.id === match.winner_id);

  return {
    ...match,
    team_a: getTeamWithPlayers(teamA),
    team_b: getTeamWithPlayers(teamB),
    winner: getTeamWithPlayers(winner),
    is_bye: false,
  };
}

/**
 * Process bye rounds - when a team has no opponent, they auto-advance
 * Only first-round matches can be byes (where a team slot has no feeder match)
 */
function processByeRounds(matches: MatchWithTeams[]): MatchWithTeams[] {
  let updated = [...matches];

  // Build a map of which matches feed into which slots
  const feederMatches = new Map<string, { slotA: string | null; slotB: string | null }>();

  updated.forEach(match => {
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

  // Only process first-round byes (matches where empty slot has no feeder)
  updated = updated.map(match => {
    // Skip if already complete
    if (match.status === "complete" || match.is_bye) return match;

    // Check for bye: exactly one team assigned
    const hasTeamA = match.team_a_id !== null;
    const hasTeamB = match.team_b_id !== null;

    if (hasTeamA !== hasTeamB) {
      // Check if the empty slot has a feeder match
      const feeders = feederMatches.get(match.id);
      // Use != null to catch both null and undefined
      const emptySlotHasFeeder = hasTeamA
        ? (feeders?.slotB != null)
        : (feeders?.slotA != null);

      // Only a true bye if there's no feeder match for the empty slot
      if (!emptySlotHasFeeder) {
        const byeTeamId = hasTeamA ? match.team_a_id : match.team_b_id;
        const byeTeam = mockTeams.find(t => t.id === byeTeamId);

        return {
          ...match,
          is_bye: true,
          status: "complete" as const,
          winner_id: byeTeamId,
          winner: getTeamWithPlayers(byeTeam),
          completed_at: new Date().toISOString(),
        };
      }
    }

    return match;
  });

  // Advance bye winners to next matches (only one pass needed now)
  updated.forEach((match, index) => {
    if (!match.is_bye || !match.winner_id) return;

    const nextMatchId = match.next_winner_match_id;
    if (!nextMatchId) return;

    const nextMatchIndex = updated.findIndex(m => m.id === nextMatchId);
    if (nextMatchIndex === -1) return;

    const nextMatch = updated[nextMatchIndex];
    const winner = mockTeams.find(t => t.id === match.winner_id);

    // Determine slot based on position_in_round
    const isSlotA = match.position_in_round % 2 === 1;

    if (isSlotA && !nextMatch.team_a_id) {
      updated[nextMatchIndex] = {
        ...nextMatch,
        team_a_id: match.winner_id,
        team_a: getTeamWithPlayers(winner),
      };
    } else if (!isSlotA && !nextMatch.team_b_id) {
      updated[nextMatchIndex] = {
        ...nextMatch,
        team_b_id: match.winner_id,
        team_b: getTeamWithPlayers(winner),
      };
    }
  });

  return updated;
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

  // Set up advancement paths (next_winner_match_id, next_loser_match_id)
  // Winners R1 → Winners R2 (Semis) + Consolation R1
  matches[0].next_winner_match_id = "m5"; // M1 winner → M5 team_a
  matches[0].next_loser_match_id = "m8";  // M1 loser → M8 team_a
  matches[1].next_winner_match_id = "m5"; // M2 winner → M5 team_b
  matches[1].next_loser_match_id = "m8";  // M2 loser → M8 team_b
  matches[2].next_winner_match_id = "m6"; // M3 winner → M6 team_a
  matches[2].next_loser_match_id = "m9";  // M3 loser → M9 team_a
  matches[3].next_winner_match_id = "m6"; // M4 winner → M6 team_b
  matches[3].next_loser_match_id = "m9";  // M4 loser → M9 team_b

  // Winners R2 (Semis) → Winners Finals + Consolation R2
  matches[4].next_winner_match_id = "m7";  // M5 winner → M7 team_a
  matches[4].next_loser_match_id = "m10";  // M5 loser → M10 team_b
  matches[5].next_winner_match_id = "m7";  // M6 winner → M7 team_b
  matches[5].next_loser_match_id = "m11";  // M6 loser → M11 team_b

  // Consolation R1 → Consolation R2
  matches[7].next_winner_match_id = "m10"; // M8 winner → M10 team_a
  matches[8].next_winner_match_id = "m11"; // M9 winner → M11 team_a

  // Consolation R2 → Consolation Finals
  matches[9].next_winner_match_id = "m12";  // M10 winner → M12 team_a
  matches[10].next_winner_match_id = "m12"; // M11 winner → M12 team_b

  return matches.map(addTeamData);
}

/**
 * Simulate a match result and auto-advance teams
 */
export function simulateMatchResult(
  matches: MatchWithTeams[],
  matchId: string,
  winnerId: string,
  scoreA: number,
  scoreB: number
): MatchWithTeams[] {
  const currentMatch = matches.find(m => m.id === matchId);
  if (!currentMatch) return matches;

  const loserId = currentMatch.team_a_id === winnerId ? currentMatch.team_b_id : currentMatch.team_a_id;
  const winner = mockTeams.find(t => t.id === winnerId);
  const loser = mockTeams.find(t => t.id === loserId);

  return matches.map(match => {
    // Update the current match with result
    if (match.id === matchId) {
      return {
        ...match,
        winner_id: winnerId,
        loser_id: loserId,
        score_a: scoreA,
        score_b: scoreB,
        status: "complete" as const,
        completed_at: new Date().toISOString(),
        winner: getTeamWithPlayers(winner),
      };
    }

    // Advance winner to next match
    if (currentMatch.next_winner_match_id === match.id && winnerId) {
      // Determine slot based on position_in_round of the source match
      const isSlotA = currentMatch.position_in_round % 2 === 1;
      if (isSlotA) {
        return {
          ...match,
          team_a_id: winnerId,
          team_a: getTeamWithPlayers(winner),
        };
      } else {
        return {
          ...match,
          team_b_id: winnerId,
          team_b: getTeamWithPlayers(winner),
        };
      }
    }

    // Drop loser to consolation
    if (currentMatch.next_loser_match_id === match.id && loserId) {
      // Determine slot based on position_in_round of the source match
      const isSlotA = currentMatch.position_in_round % 2 === 1;
      if (isSlotA) {
        return {
          ...match,
          team_a_id: loserId,
          team_a: getTeamWithPlayers(loser),
        };
      } else {
        return {
          ...match,
          team_b_id: loserId,
          team_b: getTeamWithPlayers(loser),
        };
      }
    }

    return match;
  });
}

/**
 * Start a match (set to in_progress)
 */
export function startMatch(
  matches: MatchWithTeams[],
  matchId: string,
  startedBy: string
): MatchWithTeams[] {
  return matches.map(match => {
    if (match.id === matchId && match.status === "pending") {
      return {
        ...match,
        status: "in_progress" as const,
        started_at: new Date().toISOString(),
        started_by: startedBy,
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
          team_a: getTeamWithPlayers(team),
        };
      } else {
        return {
          ...match,
          team_b_id: fromMatch.winner_id,
          team_b: getTeamWithPlayers(team),
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
          team_a: getTeamWithPlayers(team),
        };
      } else {
        return {
          ...match,
          team_b_id: fromMatch.loser_id,
          team_b: getTeamWithPlayers(team),
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

  // Set up advancement paths for 4-team bracket
  matches[0].next_winner_match_id = "m3"; // M1 winner → Finals team_a
  matches[0].next_loser_match_id = "m4";  // M1 loser → Consolation team_a
  matches[1].next_winner_match_id = "m3"; // M2 winner → Finals team_b
  matches[1].next_loser_match_id = "m4";  // M2 loser → Consolation team_b

  return matches.map(addTeamData);
}

/**
 * Generate a dynamic bracket based on number of teams
 * - 4 teams: 4-team bracket
 * - 5-8 teams: 8-team bracket structure (with empty slots)
 * - 9-16 teams: 16-team bracket structure
 * - 17-32 teams: 32-team bracket structure
 *
 * @param registeredTeamCount Number of teams registered (can be less than bracket size)
 */
export function generateDynamicBracket(registeredTeamCount: number): MatchWithTeams[] {
  // Determine bracket size (minimum 4, round up to next power of 2 for larger)
  let bracketSize: number;
  if (registeredTeamCount <= 4) {
    bracketSize = 4;
  } else if (registeredTeamCount <= 8) {
    bracketSize = 8;
  } else if (registeredTeamCount <= 16) {
    bracketSize = 16;
  } else {
    bracketSize = 32;
  }

  // Get only the registered teams
  const teams = getMockTeamsWithPlayers(registeredTeamCount);

  if (bracketSize === 4) {
    return generate4TeamBracket(teams);
  } else if (bracketSize === 8) {
    return generate8TeamBracket(teams);
  } else if (bracketSize === 16) {
    return generate16TeamBracket(teams);
  } else {
    return generate32TeamBracket(teams);
  }
}

function generate4TeamBracket(teams: TeamWithPlayers[]): MatchWithTeams[] {
  matchCounter = 0;
  const matches: Match[] = [];

  // Get teams by seed (may be null if not enough teams)
  const getTeamBySeed = (seed: number) => teams.find(t => t.seed_number === seed);

  // Winners Round 1 (Semifinals): 1v4, 2v3
  const teamA1 = getTeamBySeed(1);
  const teamB1 = getTeamBySeed(4);
  const teamA2 = getTeamBySeed(2);
  const teamB2 = getTeamBySeed(3);

  matches.push(createMatch("winners", 1, 1, teamA1?.id || null, teamB1?.id || null)); // m1
  matches.push(createMatch("winners", 1, 2, teamA2?.id || null, teamB2?.id || null)); // m2

  // Winners Finals (1st vs 2nd)
  matches.push(createMatch("winners", 2, 1, null, null, true)); // m3

  // Consolation Finals (3rd vs 4th)
  matches.push(createMatch("consolation", 1, 1, null, null, true)); // m4

  // Set up advancement paths
  matches[0].next_winner_match_id = "m3";
  matches[0].next_loser_match_id = "m4";
  matches[1].next_winner_match_id = "m3";
  matches[1].next_loser_match_id = "m4";

  // Process bye rounds
  return processByeRounds(matches.map(addTeamData));
}

function generate8TeamBracket(teams: TeamWithPlayers[]): MatchWithTeams[] {
  matchCounter = 0;
  const matches: Match[] = [];

  // Get teams by seed (may be null if not enough teams)
  const getTeamBySeed = (seed: number) => teams.find(t => t.seed_number === seed);

  // Standard seeding: 1v8, 4v5, 2v7, 3v6
  const seedMatchups = [
    [1, 8],
    [4, 5],
    [2, 7],
    [3, 6],
  ];

  // Winners Round 1 (Quarterfinals)
  seedMatchups.forEach(([seedA, seedB], index) => {
    const teamA = getTeamBySeed(seedA);
    const teamB = getTeamBySeed(seedB);
    matches.push(createMatch(
      "winners",
      1,
      index + 1,
      teamA?.id || null,
      teamB?.id || null,
    ));
  });

  // Winners Round 2 (Semifinals)
  matches.push(createMatch("winners", 2, 1)); // m5
  matches.push(createMatch("winners", 2, 2)); // m6

  // Winners Finals
  matches.push(createMatch("winners", 3, 1, null, null, true)); // m7

  // Consolation Round 1
  matches.push(createMatch("consolation", 1, 1)); // m8
  matches.push(createMatch("consolation", 1, 2)); // m9

  // Consolation Round 2
  matches.push(createMatch("consolation", 2, 1)); // m10
  matches.push(createMatch("consolation", 2, 2)); // m11

  // Consolation Finals
  matches.push(createMatch("consolation", 3, 1, null, null, true)); // m12

  // Set up advancement paths (same as before)
  matches[0].next_winner_match_id = "m5";
  matches[0].next_loser_match_id = "m8";
  matches[1].next_winner_match_id = "m5";
  matches[1].next_loser_match_id = "m8";
  matches[2].next_winner_match_id = "m6";
  matches[2].next_loser_match_id = "m9";
  matches[3].next_winner_match_id = "m6";
  matches[3].next_loser_match_id = "m9";

  matches[4].next_winner_match_id = "m7";
  matches[4].next_loser_match_id = "m10";
  matches[5].next_winner_match_id = "m7";
  matches[5].next_loser_match_id = "m11";

  matches[7].next_winner_match_id = "m10";
  matches[8].next_winner_match_id = "m11";

  matches[9].next_winner_match_id = "m12";
  matches[10].next_winner_match_id = "m12";

  // Process bye rounds
  return processByeRounds(matches.map(addTeamData));
}

/**
 * Generate standard seeding matchups for any bracket size
 * Uses the standard tournament seeding where 1 plays lowest, 2 plays second lowest, etc.
 */
function generateSeedMatchups(bracketSize: number): number[][] {
  if (bracketSize === 4) {
    return [[1, 4], [2, 3]];
  } else if (bracketSize === 8) {
    return [[1, 8], [4, 5], [2, 7], [3, 6]];
  } else if (bracketSize === 16) {
    return [
      [1, 16], [8, 9], [4, 13], [5, 12],
      [2, 15], [7, 10], [3, 14], [6, 11]
    ];
  } else if (bracketSize === 32) {
    return [
      [1, 32], [16, 17], [8, 25], [9, 24],
      [4, 29], [13, 20], [5, 28], [12, 21],
      [2, 31], [15, 18], [7, 26], [10, 23],
      [3, 30], [14, 19], [6, 27], [11, 22]
    ];
  }
  return [];
}

function generate16TeamBracket(teams: TeamWithPlayers[]): MatchWithTeams[] {
  matchCounter = 0;
  const matches: Match[] = [];
  const getTeamBySeed = (seed: number) => teams.find(t => t.seed_number === seed);

  const seedMatchups = generateSeedMatchups(16);

  // Winners Round 1 (Round of 16) - 8 matches
  seedMatchups.forEach(([seedA, seedB], index) => {
    const teamA = getTeamBySeed(seedA);
    const teamB = getTeamBySeed(seedB);
    matches.push(createMatch("winners", 1, index + 1, teamA?.id || null, teamB?.id || null));
  });

  // Winners Round 2 (Quarters) - 4 matches: m9-m12
  for (let i = 0; i < 4; i++) {
    matches.push(createMatch("winners", 2, i + 1));
  }

  // Winners Round 3 (Semis) - 2 matches: m13-m14
  matches.push(createMatch("winners", 3, 1));
  matches.push(createMatch("winners", 3, 2));

  // Winners Finals: m15
  matches.push(createMatch("winners", 4, 1, null, null, true));

  // Consolation Round 1 - 4 matches: m16-m19 (R1 losers)
  for (let i = 0; i < 4; i++) {
    matches.push(createMatch("consolation", 1, i + 1));
  }

  // Consolation Round 2 - 4 matches: m20-m23 (Consol R1 winners + Quarters losers)
  for (let i = 0; i < 4; i++) {
    matches.push(createMatch("consolation", 2, i + 1));
  }

  // Consolation Round 3 - 2 matches: m24-m25
  matches.push(createMatch("consolation", 3, 1));
  matches.push(createMatch("consolation", 3, 2));

  // Consolation Finals: m26
  matches.push(createMatch("consolation", 4, 1, null, null, true));

  // Set up advancement paths - Winners R1 to R2
  for (let i = 0; i < 8; i++) {
    const targetMatch = Math.floor(i / 2) + 9; // m9-m12
    const consolMatch = Math.floor(i / 2) + 16; // m16-m19
    matches[i].next_winner_match_id = `m${targetMatch}`;
    matches[i].next_loser_match_id = `m${consolMatch}`;
  }

  // Winners R2 to R3
  matches[8].next_winner_match_id = "m13";
  matches[8].next_loser_match_id = "m20";
  matches[9].next_winner_match_id = "m13";
  matches[9].next_loser_match_id = "m21";
  matches[10].next_winner_match_id = "m14";
  matches[10].next_loser_match_id = "m22";
  matches[11].next_winner_match_id = "m14";
  matches[11].next_loser_match_id = "m23";

  // Winners R3 to Finals
  matches[12].next_winner_match_id = "m15";
  matches[12].next_loser_match_id = "m24";
  matches[13].next_winner_match_id = "m15";
  matches[13].next_loser_match_id = "m25";

  // Consolation R1 to R2
  matches[15].next_winner_match_id = "m20";
  matches[16].next_winner_match_id = "m21";
  matches[17].next_winner_match_id = "m22";
  matches[18].next_winner_match_id = "m23";

  // Consolation R2 to R3
  matches[19].next_winner_match_id = "m24";
  matches[20].next_winner_match_id = "m24";
  matches[21].next_winner_match_id = "m25";
  matches[22].next_winner_match_id = "m25";

  // Consolation R3 to Finals
  matches[23].next_winner_match_id = "m26";
  matches[24].next_winner_match_id = "m26";

  return processByeRounds(matches.map(addTeamData));
}

function generate32TeamBracket(teams: TeamWithPlayers[]): MatchWithTeams[] {
  matchCounter = 0;
  const matches: Match[] = [];
  const getTeamBySeed = (seed: number) => teams.find(t => t.seed_number === seed);

  const seedMatchups = generateSeedMatchups(32);

  // Winners Round 1 (Round of 32) - 16 matches: m1-m16
  seedMatchups.forEach(([seedA, seedB], index) => {
    const teamA = getTeamBySeed(seedA);
    const teamB = getTeamBySeed(seedB);
    matches.push(createMatch("winners", 1, index + 1, teamA?.id || null, teamB?.id || null));
  });

  // Winners Round 2 (Round of 16) - 8 matches: m17-m24
  for (let i = 0; i < 8; i++) {
    matches.push(createMatch("winners", 2, i + 1));
  }

  // Winners Round 3 (Quarters) - 4 matches: m25-m28
  for (let i = 0; i < 4; i++) {
    matches.push(createMatch("winners", 3, i + 1));
  }

  // Winners Round 4 (Semis) - 2 matches: m29-m30
  matches.push(createMatch("winners", 4, 1));
  matches.push(createMatch("winners", 4, 2));

  // Winners Finals: m31
  matches.push(createMatch("winners", 5, 1, null, null, true));

  // Consolation Round 1 - 8 matches: m32-m39 (R1 losers)
  for (let i = 0; i < 8; i++) {
    matches.push(createMatch("consolation", 1, i + 1));
  }

  // Consolation Round 2 - 8 matches: m40-m47 (Consol R1 winners + R2 losers)
  for (let i = 0; i < 8; i++) {
    matches.push(createMatch("consolation", 2, i + 1));
  }

  // Consolation Round 3 - 4 matches: m48-m51
  for (let i = 0; i < 4; i++) {
    matches.push(createMatch("consolation", 3, i + 1));
  }

  // Consolation Round 4 - 2 matches: m52-m53
  matches.push(createMatch("consolation", 4, 1));
  matches.push(createMatch("consolation", 4, 2));

  // Consolation Finals: m54
  matches.push(createMatch("consolation", 5, 1, null, null, true));

  // Set up advancement paths - Winners R1 to R2
  for (let i = 0; i < 16; i++) {
    const targetMatch = Math.floor(i / 2) + 17; // m17-m24
    const consolMatch = Math.floor(i / 2) + 32; // m32-m39
    matches[i].next_winner_match_id = `m${targetMatch}`;
    matches[i].next_loser_match_id = `m${consolMatch}`;
  }

  // Winners R2 to R3
  for (let i = 0; i < 8; i++) {
    const targetMatch = Math.floor(i / 2) + 25; // m25-m28
    const consolMatch = i + 40; // m40-m47
    matches[16 + i].next_winner_match_id = `m${targetMatch}`;
    matches[16 + i].next_loser_match_id = `m${consolMatch}`;
  }

  // Winners R3 to R4
  matches[24].next_winner_match_id = "m29";
  matches[24].next_loser_match_id = "m48";
  matches[25].next_winner_match_id = "m29";
  matches[25].next_loser_match_id = "m49";
  matches[26].next_winner_match_id = "m30";
  matches[26].next_loser_match_id = "m50";
  matches[27].next_winner_match_id = "m30";
  matches[27].next_loser_match_id = "m51";

  // Winners R4 to Finals
  matches[28].next_winner_match_id = "m31";
  matches[28].next_loser_match_id = "m52";
  matches[29].next_winner_match_id = "m31";
  matches[29].next_loser_match_id = "m53";

  // Consolation R1 to R2
  for (let i = 0; i < 8; i++) {
    matches[31 + i].next_winner_match_id = `m${40 + i}`;
  }

  // Consolation R2 to R3
  for (let i = 0; i < 8; i++) {
    const targetMatch = Math.floor(i / 2) + 48;
    matches[39 + i].next_winner_match_id = `m${targetMatch}`;
  }

  // Consolation R3 to R4
  matches[47].next_winner_match_id = "m52";
  matches[48].next_winner_match_id = "m52";
  matches[49].next_winner_match_id = "m53";
  matches[50].next_winner_match_id = "m53";

  // Consolation R4 to Finals
  matches[51].next_winner_match_id = "m54";
  matches[52].next_winner_match_id = "m54";

  return processByeRounds(matches.map(addTeamData));
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
