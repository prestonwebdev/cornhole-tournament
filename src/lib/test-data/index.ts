/**
 * Test Data Module
 *
 * Usage:
 *
 * import {
 *   mockTeams,
 *   mockProfiles,
 *   getMockTeamsWithPlayers,
 *   get8TeamFreshBracket,
 *   get8TeamRound1Complete,
 *   get8TeamHalfway,
 *   get4TeamFreshBracket,
 *   get4TeamComplete,
 *   simulateMatchResult,
 *   advanceWinner,
 *   dropToLosers,
 * } from "@/lib/test-data";
 *
 * // Get a fresh 8-team seeded bracket
 * const matches = get8TeamFreshBracket();
 *
 * // Simulate a match result
 * const updated = simulateMatchResult(matches, "m1", "t1", 21, 15);
 */

export {
  // Raw data
  mockProfiles,
  mockTeams,

  // Team helpers
  getMockTeamsWithPlayers,

  // Bracket generation
  generateEmptyBracket,
  generateSeededBracket,

  // Match manipulation
  simulateMatchResult,
  advanceWinner,
  dropToLosers,

  // Pre-built scenarios
  get8TeamFreshBracket,
  get8TeamRound1Complete,
  get8TeamHalfway,
  get4TeamFreshBracket,
  get4TeamComplete,

  // Types
  type MatchWithTeams,
} from "./mock-data";

// React hook for interactive testing
export { useMockBracket, type BracketScenario } from "./use-mock-bracket";
