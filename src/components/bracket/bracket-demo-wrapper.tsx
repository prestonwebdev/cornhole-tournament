"use client";

import { useState, useMemo, useTransition } from "react";
import { motion } from "motion/react";
import { FlaskConical, RotateCcw, Users, Plus, Minus, ChevronDown, Zap, Trash2 } from "lucide-react";
import { useDemoMode } from "@/lib/hooks/use-demo-mode";
import { useMockBracket, generateDynamicBracket } from "@/lib/test-data";
import { mockTeams, mockProfiles } from "@/lib/test-data";
import { BracketView } from "./bracket-view";
import { startMatch, completeMatch, toggleBracketVisibility, resetBracket, resetMatchScore } from "@/lib/actions/match";
import type { Match } from "@/lib/types/database";

type TeamInMatch = {
  id: string;
  name: string;
  player1_id?: string | null;
  player2_id?: string | null;
  player1_name?: string | null;
  player2_name?: string | null;
};

type MatchWithTeams = Match & {
  team_a: TeamInMatch | null;
  team_b: TeamInMatch | null;
  winner: TeamInMatch | null;
  is_bye?: boolean;
};

type RegisteredTeam = {
  id: string;
  name: string;
  seed_number: number | null;
  player1_id: string | null;
  player2_id: string | null;
};

type NextMatchData = {
  id: string;
  bracket_type: "winners" | "consolation";
  round_number: number;
  match_number: number;
  team_a_id: string | null;
  team_b_id: string | null;
  team_a: TeamInMatch | null;
  team_b: TeamInMatch | null;
  status: "pending" | "in_progress" | "complete";
  is_finals: boolean;
};

interface BracketDemoWrapperProps {
  realMatches: MatchWithTeams[];
  bracketPublished: boolean;
  isAdmin?: boolean;
  registeredTeams?: RegisteredTeam[];
  eventDate?: string | null;
  userTeamId?: string | null;
  nextMatch?: NextMatchData | null;
  userRecord?: { wins: number; losses: number };
  opponentRecord?: { wins: number; losses: number };
}

// Generate a preview bracket from real registered teams
function generatePreviewBracket(teams: RegisteredTeam[]): MatchWithTeams[] {
  if (teams.length === 0) return [];

  // Get the mock bracket structure
  const mockMatches = generateDynamicBracket(teams.length);

  // Map real teams to the bracket slots
  return mockMatches.map((match) => {
    const teamAIndex = match.team_a_id ? parseInt(match.team_a_id.replace("t", "")) - 1 : -1;
    const teamBIndex = match.team_b_id ? parseInt(match.team_b_id.replace("t", "")) - 1 : -1;

    const teamA = teamAIndex >= 0 && teamAIndex < teams.length ? teams[teamAIndex] : null;
    const teamB = teamBIndex >= 0 && teamBIndex < teams.length ? teams[teamBIndex] : null;

    return {
      ...match,
      team_a_id: teamA?.id || null,
      team_b_id: teamB?.id || null,
      team_a: teamA ? { id: teamA.id, name: teamA.name } : null,
      team_b: teamB ? { id: teamB.id, name: teamB.name } : null,
      winner: null,
      winner_id: null,
    } as MatchWithTeams;
  });
}

export function BracketDemoWrapper({
  realMatches,
  bracketPublished,
  isAdmin = false,
  registeredTeams = [],
  eventDate,
  userTeamId,
  nextMatch,
  userRecord,
  opponentRecord,
}: BracketDemoWrapperProps) {
  const demoMode = useDemoMode();
  const bracket = useMockBracket("4-team-fresh");
  const [selectedTeamId, setSelectedTeamId] = useState<string>("t1");
  const [showTeamSelector, setShowTeamSelector] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Check if tournament has started based on event_date
  const tournamentHasStarted = eventDate
    ? new Date(eventDate).getTime() <= Date.now()
    : false;

  const handleToggleVisibility = () => {
    setError(null);
    startTransition(async () => {
      const result = await toggleBracketVisibility();
      if (result.error) {
        setError(result.error);
      }
    });
  };

  const handleResetBracket = () => {
    setError(null);
    startTransition(async () => {
      const result = await resetBracket();
      if (result.error) {
        setError(result.error);
      }
    });
  };

  // Generate preview bracket from registered teams
  const previewBracket = useMemo(() => {
    return generatePreviewBracket(registeredTeams);
  }, [registeredTeams]);

  // Don't show anything until demo mode state is loaded
  if (!demoMode.isLoaded) {
    return null;
  }

  // DEMO MODE: Show mock bracket with controls (admin only)
  if (demoMode.isEnabled && isAdmin) {
    const selectedTeam = mockTeams.find(t => t.id === selectedTeamId);
    const selectedPlayer = mockProfiles.find(p => p.team_id === selectedTeamId);

    const handleStartMatch = (matchId: string) => {
      bracket.startMatch(matchId);
    };

    const handleCompleteMatch = (matchId: string, scoreA: number, scoreB: number) => {
      const match = bracket.getMatch(matchId);
      if (!match) return;
      const winnerId = scoreA > scoreB ? match.team_a_id : match.team_b_id;
      if (!winnerId) return;
      bracket.recordResult(matchId, winnerId, scoreA, scoreB);
    };

    const bracketSize = bracket.teamCount <= 4 ? 4 : bracket.teamCount <= 8 ? 8 : bracket.teamCount <= 16 ? 16 : 32;
    const emptySlots = bracketSize - bracket.teamCount;

    return (
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Demo Mode Banner */}
        <div className="bg-purple-500/20 border border-purple-500/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-purple-400" />
              <span className="font-medium text-purple-300">Demo Mode</span>
            </div>
            <button
              onClick={() => bracket.reset()}
              className="flex items-center gap-1 text-sm text-purple-300 hover:text-purple-200"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          </div>

          {/* Team Count Control */}
          <div className="flex items-center justify-between mb-3 p-3 bg-white/5 rounded-xl">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-white">Teams</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => bracket.setTeamCount(bracket.teamCount - 1)}
                disabled={bracket.teamCount <= 0}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              >
                <Minus className="h-4 w-4 text-white" />
              </button>
              <span className="text-xl font-bold text-white w-8 text-center">{bracket.teamCount}</span>
              <button
                onClick={() => bracket.setTeamCount(bracket.teamCount + 1)}
                disabled={bracket.teamCount >= 32}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              >
                <Plus className="h-4 w-4 text-white" />
              </button>
            </div>
          </div>

          {/* Bracket Size Indicator */}
          <div className="text-xs text-white/40 text-center mb-3">
            {bracketSize}-Team Bracket
            {emptySlots > 0 && (
              <span className="text-yellow-400 ml-2">
                ({emptySlots} {emptySlots === 1 ? "bye" : "byes"})
              </span>
            )}
          </div>

          {/* Team Perspective Selector */}
          <div>
            <button
              onClick={() => setShowTeamSelector(!showTeamSelector)}
              className="w-full flex items-center justify-between p-3 bg-white/5 rounded-xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-sm">
                  {selectedTeam?.name.charAt(0) || "?"}
                </div>
                <div className="text-left">
                  <p className="text-white text-sm font-medium">{selectedTeam?.name || "Select Team"}</p>
                  <p className="text-white/40 text-xs">Viewing as {selectedPlayer?.display_name}</p>
                </div>
              </div>
              <ChevronDown className={`h-5 w-5 text-white/50 transition-transform ${showTeamSelector ? "rotate-180" : ""}`} />
            </button>

            {showTeamSelector && (
              <div className="mt-2 bg-white/5 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                {mockTeams.slice(0, bracket.teamCount).map((team) => {
                  const player = mockProfiles.find(p => p.team_id === team.id);
                  return (
                    <button
                      key={team.id}
                      onClick={() => {
                        setSelectedTeamId(team.id);
                        setShowTeamSelector(false);
                      }}
                      className={`w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors ${
                        selectedTeamId === team.id ? "bg-purple-500/20" : ""
                      }`}
                    >
                      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white text-xs font-bold">
                        {team.name.charAt(0)}
                      </div>
                      <div className="text-left">
                        <p className="text-white text-sm">{team.name}</p>
                        <p className="text-white/40 text-xs">{player?.display_name}</p>
                      </div>
                    </button>
                  );
                })}
                {bracket.teamCount === 0 && (
                  <div className="p-3 text-center text-white/40 text-sm">
                    No teams registered yet
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Demo Bracket */}
        <BracketView
          matches={bracket.matches}
          onStartMatch={handleStartMatch}
          onCompleteMatch={handleCompleteMatch}
          canUserInteract={true}
          userTeamId={selectedTeamId}
        />
      </motion.div>
    );
  }

  // Server action handlers
  const handleStartMatch = async (matchId: string) => {
    await startMatch(matchId);
  };

  const handleCompleteMatch = async (matchId: string, scoreA: number, scoreB: number) => {
    await completeMatch(matchId, scoreA, scoreB);
  };

  const handleResetMatchScore = async (matchId: string) => {
    await resetMatchScore(matchId);
  };

  // No teams registered yet
  if (registeredTeams.length === 0) {
    return (
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Header */}
        <div className="pt-4">
          <h1 className="text-2xl font-bold text-white">Bracket</h1>
          <p className="text-white/60 text-sm">0 teams registered</p>
        </div>

        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="bg-white/5 rounded-2xl p-8 text-center max-w-sm w-full">
            <motion.div
              className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
            >
              <Users className="h-8 w-8 text-white/40" />
            </motion.div>
            <motion.h2
              className="text-xl font-semibold text-white mb-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              No Teams Yet
            </motion.h2>
            <motion.p
              className="text-white/60 text-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              Teams are still registering. Check back soon!
            </motion.p>
          </div>
        </div>
      </motion.div>
    );
  }

  // Determine bracket size
  const bracketSize = registeredTeams.length <= 4 ? 4 : registeredTeams.length <= 8 ? 8 : registeredTeams.length <= 16 ? 16 : 32;

  // Use real matches if available, otherwise use preview
  const displayMatches = realMatches.length > 0 ? realMatches : previewBracket;

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header */}
      <div className="pt-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-white">Bracket</h1>
          {!bracketPublished && (
            <span className="px-2 py-0.5 text-xs font-medium bg-yellow-500/20 text-yellow-400 rounded-full">
              Hidden
            </span>
          )}
        </div>
        <p className="text-white/60 text-sm">
          {bracketSize}-team consolation bracket
        </p>
      </div>

      {/* Admin Controls */}
      {isAdmin && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium text-sm">Admin Controls</p>
              <p className="text-white/60 text-xs mt-0.5">
                {bracketPublished
                  ? "Bracket is visible to all players"
                  : "Bracket is hidden from players"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleVisibility}
                disabled={isPending}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  bracketPublished
                    ? "bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 text-yellow-400"
                    : "bg-green-500 hover:bg-green-600 text-white"
                }`}
              >
                {bracketPublished ? (
                  <>
                    <Zap className="h-4 w-4" />
                    {isPending ? "Updating..." : "Unpublish"}
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    {isPending ? "Updating..." : "Publish"}
                  </>
                )}
              </button>
              <button
                onClick={handleResetBracket}
                disabled={isPending}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-red-400 text-sm font-medium rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Reset
              </button>
            </div>
          </div>
          {error && (
            <p className="text-red-400 text-xs mt-2">{error}</p>
          )}
        </div>
      )}

      {/* Bracket View */}
      <BracketView
        matches={displayMatches}
        canUserInteract={tournamentHasStarted || isAdmin}
        onStartMatch={handleStartMatch}
        onCompleteMatch={handleCompleteMatch}
        onResetMatch={handleResetMatchScore}
        userTeamId={userTeamId}
        isAdmin={isAdmin}
      />
    </motion.div>
  );
}
