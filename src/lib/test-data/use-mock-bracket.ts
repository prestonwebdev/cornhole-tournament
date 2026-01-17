"use client";

import { useState, useCallback } from "react";
import {
  type MatchWithTeams,
  get8TeamFreshBracket,
  get8TeamRound1Complete,
  get8TeamSemisComplete,
  get8TeamFinalsReady,
  get8TeamComplete,
  get4TeamFreshBracket,
  get4TeamComplete,
  simulateMatchResult,
  advanceWinner,
  dropToConsolation,
  mockTeams,
} from "./mock-data";

export type BracketScenario =
  | "8-team-fresh"
  | "8-team-round1"
  | "8-team-semis"
  | "8-team-finals-ready"
  | "8-team-complete"
  | "4-team-fresh"
  | "4-team-complete";

const scenarioLoaders: Record<BracketScenario, () => MatchWithTeams[]> = {
  "8-team-fresh": get8TeamFreshBracket,
  "8-team-round1": get8TeamRound1Complete,
  "8-team-semis": get8TeamSemisComplete,
  "8-team-finals-ready": get8TeamFinalsReady,
  "8-team-complete": get8TeamComplete,
  "4-team-fresh": get4TeamFreshBracket,
  "4-team-complete": get4TeamComplete,
};

export function useMockBracket(initialScenario: BracketScenario = "8-team-fresh") {
  const [matches, setMatches] = useState<MatchWithTeams[]>(() =>
    scenarioLoaders[initialScenario]()
  );
  const [scenario, setScenario] = useState<BracketScenario>(initialScenario);

  // Load a different scenario
  const loadScenario = useCallback((newScenario: BracketScenario) => {
    setMatches(scenarioLoaders[newScenario]());
    setScenario(newScenario);
  }, []);

  // Reset to current scenario's initial state
  const reset = useCallback(() => {
    setMatches(scenarioLoaders[scenario]());
  }, [scenario]);

  // Record a match result and optionally auto-advance
  const recordResult = useCallback((
    matchId: string,
    winnerId: string,
    scoreA: number,
    scoreB: number,
    options?: {
      advanceWinnerTo?: { matchId: string; slot: "team_a" | "team_b" };
      dropLoserTo?: { matchId: string; slot: "team_a" | "team_b" };
    }
  ) => {
    setMatches(prev => {
      let updated = simulateMatchResult(prev, matchId, winnerId, scoreA, scoreB);

      if (options?.advanceWinnerTo) {
        updated = advanceWinner(
          updated,
          matchId,
          options.advanceWinnerTo.matchId,
          options.advanceWinnerTo.slot
        );
      }

      if (options?.dropLoserTo) {
        updated = dropToConsolation(
          updated,
          matchId,
          options.dropLoserTo.matchId,
          options.dropLoserTo.slot
        );
      }

      return updated;
    });
  }, []);

  // Get matches by bracket type
  const getWinnersMatches = useCallback(() =>
    matches.filter(m => m.bracket_type === "winners"),
    [matches]
  );

  const getConsolationMatches = useCallback(() =>
    matches.filter(m => m.bracket_type === "consolation"),
    [matches]
  );

  // Get finals matches
  const getWinnersFinals = useCallback(() =>
    matches.find(m => m.bracket_type === "winners" && m.is_finals),
    [matches]
  );

  const getConsolationFinals = useCallback(() =>
    matches.find(m => m.bracket_type === "consolation" && m.is_finals),
    [matches]
  );

  // Get matches by round
  const getMatchesByRound = useCallback((bracketType: "winners" | "consolation", round: number) =>
    matches.filter(m => m.bracket_type === bracketType && m.round_number === round),
    [matches]
  );

  // Get a specific match
  const getMatch = useCallback((matchId: string) =>
    matches.find(m => m.id === matchId),
    [matches]
  );

  // Get pending matches (both teams assigned, no winner yet)
  const getPendingMatches = useCallback(() =>
    matches.filter(m => m.team_a_id && m.team_b_id && !m.winner_id),
    [matches]
  );

  // Get completed matches
  const getCompletedMatches = useCallback(() =>
    matches.filter(m => m.winner_id),
    [matches]
  );

  // Get teams available for the bracket
  const getTeams = useCallback(() => mockTeams, []);

  return {
    // State
    matches,
    scenario,

    // Actions
    loadScenario,
    reset,
    recordResult,

    // Selectors
    getWinnersMatches,
    getConsolationMatches,
    getWinnersFinals,
    getConsolationFinals,
    getMatchesByRound,
    getMatch,
    getPendingMatches,
    getCompletedMatches,
    getTeams,

    // Available scenarios
    scenarios: Object.keys(scenarioLoaders) as BracketScenario[],
  };
}
