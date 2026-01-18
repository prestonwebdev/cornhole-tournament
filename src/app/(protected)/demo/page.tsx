"use client";

import { useState } from "react";
import { useMockBracket, type BracketScenario } from "@/lib/test-data";
import { mockTeams, mockProfiles } from "@/lib/test-data";
import {
  RotateCcw,
  Users,
  Trophy,
  Medal,
  ChevronDown,
  Eye,
  Play,
  CheckCircle,
  XCircle,
  Home,
  LayoutGrid,
  Loader2,
  Plus,
  Minus
} from "lucide-react";
import { BracketView } from "@/components/bracket/bracket-view";
import { motion } from "motion/react";
import { CornholeIcon } from "@/components/icons/cornhole-icon";
import { MatchResult } from "@/components/bracket/match-result";

type ViewMode = "dashboard" | "bracket";

export default function DemoPage() {
  const bracket = useMockBracket("8-team-fresh");
  const [selectedTeamId, setSelectedTeamId] = useState<string>("t1");
  const [viewMode, setViewMode] = useState<ViewMode>("dashboard");
  const [showTeamSelector, setShowTeamSelector] = useState(false);

  const selectedTeam = mockTeams.find(t => t.id === selectedTeamId);
  const selectedPlayer = mockProfiles.find(p => p.team_id === selectedTeamId);

  // Get user's matches
  const userMatches = bracket.matches.filter(
    m => m.team_a_id === selectedTeamId || m.team_b_id === selectedTeamId
  );

  // Get next match (pending or in_progress)
  const nextMatch = userMatches.find(
    m => m.status === "pending" || m.status === "in_progress"
  );

  // Check if user is eliminated (lost in consolation, not in finals)
  const lostConsolationMatch = userMatches.find(
    m => m.bracket_type === "consolation" &&
    m.status === "complete" &&
    m.loser_id === selectedTeamId &&
    !m.is_finals
  );

  // Check placement
  const championshipFinals = bracket.matches.find(
    m => m.bracket_type === "winners" && m.is_finals
  );
  const consolationFinals = bracket.matches.find(
    m => m.bracket_type === "consolation" && m.is_finals
  );

  let userPlacement: 1 | 2 | 3 | 4 | null = null;
  if (championshipFinals?.winner_id === selectedTeamId) userPlacement = 1;
  else if (championshipFinals?.loser_id === selectedTeamId) userPlacement = 2;
  else if (consolationFinals?.winner_id === selectedTeamId) userPlacement = 3;
  else if (consolationFinals?.loser_id === selectedTeamId) userPlacement = 4;

  const isEliminated = !!lostConsolationMatch && !userPlacement;

  // Tournament status
  const completedMatches = bracket.getCompletedMatches();
  const totalMatches = bracket.matches.length;
  const tournamentComplete = championshipFinals?.status === "complete" && consolationFinals?.status === "complete";
  const tournamentStarted = completedMatches.length > 0 || bracket.matches.some(m => m.status === "in_progress");

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

  // Get user team and opponent for next match (with player names)
  const getUserTeamAndOpponent = () => {
    if (!nextMatch) return { userTeam: null, opponent: null };
    if (nextMatch.team_a_id === selectedTeamId) {
      return { userTeam: nextMatch.team_a, opponent: nextMatch.team_b };
    } else {
      return { userTeam: nextMatch.team_b, opponent: nextMatch.team_a };
    }
  };

  const { userTeam: userTeamWithPlayers, opponent } = getUserTeamAndOpponent();

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      {/* Demo Controls Header */}
      <div className="sticky top-0 z-50 bg-[#1a1a1a]/95 backdrop-blur border-b border-white/10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-purple-400" />
              <span className="font-medium text-white">Demo Mode</span>
            </div>
            <button
              onClick={() => bracket.reset()}
              className="flex items-center gap-1 text-sm text-white/60 hover:text-white"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          </div>

          {/* Team Count Control */}
          <div className="flex items-center justify-between mb-3 p-3 bg-white/5 rounded-xl">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-white">Teams Registered</span>
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
            {(() => {
              const bracketSize = bracket.teamCount <= 4 ? 4 : bracket.teamCount <= 8 ? 8 : bracket.teamCount <= 16 ? 16 : 32;
              const emptySlots = bracketSize - bracket.teamCount;
              return (
                <>
                  {bracketSize}-Team Bracket
                  {emptySlots > 0 && (
                    <span className="text-yellow-400 ml-2">
                      ({emptySlots} {emptySlots === 1 ? "bye" : "byes"})
                    </span>
                  )}
                </>
              );
            })()}
          </div>

          {/* Scenario Selector */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
            {bracket.scenarios.map((s) => (
              <button
                key={s}
                onClick={() => bracket.loadScenario(s)}
                className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors ${
                  bracket.scenario === s
                    ? "bg-purple-500 text-white"
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* User Perspective Selector */}
          <div className="mt-3">
            <button
              onClick={() => setShowTeamSelector(!showTeamSelector)}
              className="w-full flex items-center justify-between p-3 bg-white/5 rounded-xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
                  {selectedTeam?.name.charAt(0)}
                </div>
                <div className="text-left">
                  <p className="text-white font-medium">{selectedTeam?.name}</p>
                  <p className="text-white/50 text-xs">Viewing as {selectedPlayer?.display_name}</p>
                </div>
              </div>
              <ChevronDown className={`h-5 w-5 text-white/50 transition-transform ${showTeamSelector ? "rotate-180" : ""}`} />
            </button>

            {showTeamSelector && (
              <div className="mt-2 bg-white/5 rounded-xl overflow-hidden">
                {mockTeams.slice(0, bracket.teamCount).map((team) => {
                  const player = mockProfiles.find(p => p.team_id === team.id);
                  const teamMatches = bracket.matches.filter(
                    m => m.team_a_id === team.id || m.team_b_id === team.id
                  );
                  const isOut = teamMatches.some(
                    m => m.bracket_type === "consolation" && m.loser_id === team.id && !m.is_finals
                  );
                  const won1st = championshipFinals?.winner_id === team.id;
                  const won2nd = championshipFinals?.loser_id === team.id;
                  const won3rd = consolationFinals?.winner_id === team.id;
                  const won4th = consolationFinals?.loser_id === team.id;

                  return (
                    <button
                      key={team.id}
                      onClick={() => {
                        setSelectedTeamId(team.id);
                        setShowTeamSelector(false);
                      }}
                      className={`w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors ${
                        selectedTeamId === team.id ? "bg-purple-500/20" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white text-sm font-bold">
                          {team.name.charAt(0)}
                        </div>
                        <div className="text-left">
                          <p className="text-white text-sm">{team.name}</p>
                          <p className="text-white/40 text-xs">{player?.display_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {won1st && <Trophy className="h-4 w-4 text-yellow-400" />}
                        {won2nd && <Medal className="h-4 w-4 text-gray-300" />}
                        {won3rd && <Medal className="h-4 w-4 text-orange-400" />}
                        {won4th && <Medal className="h-4 w-4 text-orange-300" />}
                        {isOut && !won1st && !won2nd && !won3rd && !won4th && (
                          <XCircle className="h-4 w-4 text-red-400" />
                        )}
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

        {/* View Toggle */}
        <div className="flex border-t border-white/10">
          <button
            onClick={() => setViewMode("dashboard")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              viewMode === "dashboard"
                ? "text-white border-b-2 border-white"
                : "text-white/50 hover:text-white/70"
            }`}
          >
            <Home className="h-4 w-4" />
            Dashboard
          </button>
          <button
            onClick={() => setViewMode("bracket")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              viewMode === "bracket"
                ? "text-white border-b-2 border-white"
                : "text-white/50 hover:text-white/70"
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
            Bracket
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="px-4 pb-20">
        {viewMode === "dashboard" ? (
          <DemoDashboard
            team={selectedTeam!}
            player={selectedPlayer!}
            nextMatch={nextMatch}
            opponent={opponent}
            userPlacement={userPlacement}
            isEliminated={isEliminated}
            userMatches={userMatches}
            allMatches={bracket.matches}
            tournamentStarted={tournamentStarted}
            onStartMatch={handleStartMatch}
            onCompleteMatch={handleCompleteMatch}
          />
        ) : (
          <div className="pt-4">
            <BracketView
              matches={bracket.matches}
              onStartMatch={handleStartMatch}
              onCompleteMatch={handleCompleteMatch}
              canUserInteract={true}
              userTeamId={selectedTeam?.id}
            />
          </div>
        )}
      </div>

      {/* Stats Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#1a1a1a]/95 backdrop-blur border-t border-white/10 px-4 py-2">
        <div className="flex justify-around text-xs">
          <div className="text-center">
            <p className="text-white font-medium">{completedMatches.length}/{totalMatches}</p>
            <p className="text-white/40">Matches</p>
          </div>
          <div className="text-center">
            <p className="text-white font-medium">{bracket.matches.filter(m => m.status === "in_progress").length}</p>
            <p className="text-white/40">In Progress</p>
          </div>
          <div className="text-center">
            <p className="text-white font-medium">{bracket.getPendingMatches().length}</p>
            <p className="text-white/40">Pending</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Demo Dashboard Component
interface DemoDashboardProps {
  team: typeof mockTeams[0];
  player: typeof mockProfiles[0];
  nextMatch: ReturnType<typeof useMockBracket>["matches"][0] | undefined;
  opponent: { id: string; name: string; player1_name?: string | null; player2_name?: string | null } | null;
  userPlacement: 1 | 2 | 3 | 4 | null;
  isEliminated: boolean;
  userMatches: ReturnType<typeof useMockBracket>["matches"];
  allMatches: ReturnType<typeof useMockBracket>["matches"];
  tournamentStarted: boolean;
  onStartMatch: (matchId: string) => void;
  onCompleteMatch: (matchId: string, scoreA: number, scoreB: number) => void;
}

function DemoDashboard({
  team,
  player,
  nextMatch,
  opponent,
  userPlacement,
  isEliminated,
  userMatches,
  allMatches,
  tournamentStarted,
  onStartMatch,
  onCompleteMatch,
}: DemoDashboardProps) {
  // Calculate team record
  const completedMatches = userMatches.filter(m => m.status === "complete");
  const wins = completedMatches.filter(m => m.winner_id === team.id).length;
  const losses = completedMatches.filter(m => m.loser_id === team.id).length;

  // Calculate opponent record
  const opponentMatches = opponent
    ? allMatches.filter(m => m.team_a_id === opponent.id || m.team_b_id === opponent.id)
    : [];
  const opponentCompletedMatches = opponentMatches.filter(m => m.status === "complete");
  const opponentWins = opponentCompletedMatches.filter(m => m.winner_id === opponent?.id).length;
  const opponentLosses = opponentCompletedMatches.filter(m => m.loser_id === opponent?.id).length;

  // Get user team with player names from the match
  const userTeamWithPlayers = nextMatch
    ? nextMatch.team_a_id === team.id
      ? nextMatch.team_a
      : nextMatch.team_b
    : null;

  return (
    <motion.div
      className="space-y-6 pt-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      key={team.id}
    >
      {/* Header */}
      <div>
        <p className="text-white/60 text-sm">Welcome back,</p>
        <h1 className="text-2xl font-bold text-white">{player.display_name}</h1>
      </div>

      {/* Tournament Status Card */}
      {userPlacement ? (
        <PlacementCard placement={userPlacement} teamName={team.name} />
      ) : isEliminated ? (
        <EliminatedCard />
      ) : nextMatch ? (
        <DemoNextMatchCard
          match={nextMatch}
          opponent={opponent}
          userTeam={userTeamWithPlayers}
          userRecord={{ wins, losses }}
          opponentRecord={opponent ? { wins: opponentWins, losses: opponentLosses } : undefined}
          onStartMatch={onStartMatch}
          onCompleteMatch={onCompleteMatch}
        />
      ) : (
        <WaitingCard />
      )}

      {/* Team Card - only show before tournament starts */}
      {!tournamentStarted && (
        <div className="bg-white/5 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">{team.name}</h2>
              <p className="text-white/60 text-sm">Your team</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-white">{wins}-{losses}</p>
              <p className="text-white/40 text-xs">Record</p>
            </div>
          </div>

          {/* Team members */}
          <div className="space-y-2">
            {[team.player1_id, team.player2_id].map((playerId, index) => {
              const teamPlayer = mockProfiles.find(p => p.id === playerId);
              return (
                <div
                  key={playerId}
                  className="flex items-center gap-3 p-3 bg-white/5 rounded-xl"
                >
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-medium text-white">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white">
                      {teamPlayer?.display_name || "Player"}
                    </p>
                    {playerId === player.id && (
                      <p className="text-xs text-white/50">You</p>
                    )}
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-400" />
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2 p-4 bg-green-500/10 rounded-xl">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <span className="text-sm text-green-400 font-medium">
              Team complete! You&apos;re ready to compete.
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// Placement Trophy Card
function PlacementCard({ placement, teamName }: { placement: 1 | 2 | 3 | 4; teamName: string }) {
  const config = {
    1: { label: "Champions!", color: "text-yellow-400", bg: "from-yellow-500/20 to-yellow-500/5", border: "border-yellow-400/30", icon: Trophy },
    2: { label: "2nd Place", color: "text-gray-300", bg: "from-gray-400/20 to-gray-400/5", border: "border-gray-400/30", icon: Medal },
    3: { label: "3rd Place", color: "text-orange-400", bg: "from-orange-500/20 to-orange-500/5", border: "border-orange-400/30", icon: Medal },
    4: { label: "4th Place", color: "text-orange-300", bg: "from-orange-400/20 to-orange-400/5", border: "border-orange-400/30", icon: Medal },
  }[placement];

  const Icon = config.icon;

  return (
    <motion.div
      className={`bg-gradient-to-br ${config.bg} rounded-2xl p-6 border ${config.border}`}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
    >
      <div className="flex flex-col items-center text-center space-y-3">
        <motion.div
          className={`w-20 h-20 rounded-full bg-white/10 flex items-center justify-center`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
        >
          <Icon className={`h-10 w-10 ${config.color}`} />
        </motion.div>
        <div>
          <p className={`text-3xl font-bold ${config.color}`}>{config.label}</p>
          <p className="text-white/60 text-sm mt-1">{teamName}</p>
        </div>
        <p className="text-white/40 text-sm">Tournament Complete</p>
      </div>
    </motion.div>
  );
}

// Eliminated Card
function EliminatedCard() {
  return (
    <motion.div
      className="bg-gradient-to-br from-red-500/10 to-red-500/5 rounded-2xl p-6 border border-red-400/20"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex flex-col items-center text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
          <XCircle className="h-8 w-8 text-red-400" />
        </div>
        <div>
          <p className="text-xl font-semibold text-white">Eliminated</p>
          <p className="text-white/60 text-sm mt-1">Better luck next time!</p>
        </div>
      </div>
    </motion.div>
  );
}

// Helper to determine match stakes
function getMatchStakes(match: ReturnType<typeof useMockBracket>["matches"][0]): { winStakes: string; loseStakes: string } {
  const { bracket_type, is_finals, round_number } = match;

  if (is_finals) {
    if (bracket_type === "winners") {
      return {
        winStakes: "Win the championship!",
        loseStakes: "2nd place"
      };
    } else {
      return {
        winStakes: "3rd place",
        loseStakes: "4th place"
      };
    }
  }

  if (bracket_type === "winners") {
    // Check if next match is finals
    const isPreFinals = round_number >= 2; // In an 8-team bracket, round 2 winners go to finals
    return {
      winStakes: isPreFinals ? "Advance to Finals" : "Advance to next round",
      loseStakes: "Drop to Consolation"
    };
  } else {
    // Consolation bracket
    const isPreFinals = round_number >= 2;
    return {
      winStakes: isPreFinals ? "Advance to 3rd Place Match" : "Stay alive",
      loseStakes: "Eliminated"
    };
  }
}

// Next Match Card
function DemoNextMatchCard({
  match,
  opponent,
  userTeam,
  userRecord,
  opponentRecord,
  onStartMatch,
  onCompleteMatch
}: {
  match: ReturnType<typeof useMockBracket>["matches"][0];
  opponent: { id: string; name: string; player1_name?: string | null; player2_name?: string | null } | null;
  userTeam: { id: string; name: string; player1_name?: string | null; player2_name?: string | null } | null;
  userRecord?: { wins: number; losses: number };
  opponentRecord?: { wins: number; losses: number };
  onStartMatch: (matchId: string) => void;
  onCompleteMatch: (matchId: string, scoreA: number, scoreB: number) => void;
}) {
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [resultData, setResultData] = useState<{
    isWinner: boolean;
    teamName: string;
    opponentName: string;
    placement?: string;
    isEliminated?: boolean;
  } | null>(null);

  const bracketLabel = match.bracket_type === "winners" ? "Championship" : "Consolation";
  const roundLabel = match.is_finals ? "Finals" : `Round ${match.round_number}`;
  const stakes = getMatchStakes(match);

  const isTeamA = match.team_a_id === userTeam?.id;

  const handleCompleteMatch = () => {
    if (scoreA === scoreB) return;
    setIsLoading(true);

    // Determine if user won or lost
    const userScore = isTeamA ? scoreA : scoreB;
    const opponentScore = isTeamA ? scoreB : scoreA;
    const isWinner = userScore > opponentScore;

    // Determine placement for finals
    let placement: string | undefined;
    if (match.is_finals) {
      if (match.bracket_type === "winners") {
        placement = isWinner ? "1st" : "2nd";
      } else {
        placement = isWinner ? "3rd" : "4th";
      }
    }

    // User is eliminated if they lose in the consolation bracket
    const isEliminated = !isWinner && match.bracket_type === "consolation";

    setResultData({
      isWinner,
      teamName: userTeam?.name || "Your Team",
      opponentName: opponent?.name || "Opponent",
      placement,
      isEliminated,
    });
    setShowResult(true);

    onCompleteMatch(match.id, scoreA, scoreB);
    setIsLoading(false);
  };

  const getWinnerName = () => {
    if (scoreA === scoreB) return null;
    return scoreA > scoreB ? match.team_a?.name : match.team_b?.name;
  };

  return (
    <motion.div
      className="bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-6 space-y-4 border border-white/10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {match.bracket_type === "winners" ? (
            <CornholeIcon className="h-5 w-5 text-yellow-400" />
          ) : (
            <Medal className="h-5 w-5 text-orange-400" />
          )}
          <span className="text-sm font-medium text-white">
            {match.status === "in_progress" ? "Current Match" : "Next Match"}
          </span>
        </div>
        <span className="text-xs text-white/40">
          {bracketLabel} - {roundLabel}
        </span>
      </div>

      {/* Match Stakes */}
      <div className="flex justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-400"></div>
          <span className="text-white/60">Win: <span className="text-green-400">{stakes.winStakes}</span></span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-400"></div>
          <span className="text-white/60">Lose: <span className="text-red-400">{stakes.loseStakes}</span></span>
        </div>
      </div>

      {/* Teams */}
      <div className="space-y-2">
        {/* User's Team */}
        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-base font-bold text-white">
            {userTeam?.name?.charAt(0) || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold text-white truncate">
                {userTeam?.name || "TBD"}
              </p>
              {userRecord && (
                <span className="text-white/40 text-sm">
                  ({userRecord.wins}-{userRecord.losses})
                </span>
              )}
            </div>
            {userTeam?.player1_name && userTeam?.player2_name && (
              <p className="text-white/40 text-xs truncate">
                {userTeam.player1_name} & {userTeam.player2_name}
              </p>
            )}
          </div>
        </div>

        {/* VS Divider */}
        <div className="flex items-center justify-center py-1">
          <span className="text-white text-sm font-bold">VS</span>
        </div>

        {/* Opponent Team */}
        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-base font-bold text-white">
            {opponent?.name?.charAt(0) || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold text-white truncate">
                {opponent?.name || "TBD"}
              </p>
              {opponentRecord && (
                <span className="text-white/40 text-sm">
                  ({opponentRecord.wins}-{opponentRecord.losses})
                </span>
              )}
            </div>
            {opponent?.player1_name && opponent?.player2_name && (
              <p className="text-white/40 text-xs truncate">
                {opponent.player1_name} & {opponent.player2_name}
              </p>
            )}
          </div>
        </div>
      </div>

      {match.status === "pending" && (
        <button
          onClick={() => onStartMatch(match.id)}
          disabled={!match.team_a_id || !match.team_b_id}
          className="w-full py-3 bg-green-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {!match.team_a_id || !match.team_b_id ? (
            "Waiting for opponent..."
          ) : (
            <>
              <Play className="h-5 w-5" />
              Start Match
            </>
          )}
        </button>
      )}

      {match.status === "in_progress" && (
        <div className="space-y-4 bg-white/5 rounded-xl p-4">
          <p className="text-sm text-white/60 text-center">Enter final scores</p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/60 block mb-2">
                {match.team_a?.name || "Team A"}
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={scoreA}
                onChange={(e) => setScoreA(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>
            <div>
              <label className="text-xs text-white/60 block mb-2">
                {match.team_b?.name || "Team B"}
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={scoreB}
                onChange={(e) => setScoreB(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>
          </div>

          <button
            onClick={handleCompleteMatch}
            disabled={isLoading || scoreA === scoreB}
            className="w-full py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : scoreA === scoreB ? (
              "Scores cannot be tied"
            ) : (
              <>
                <CheckCircle className="h-5 w-5" />
                Submit - {getWinnerName()} Wins
              </>
            )}
          </button>
        </div>
      )}

      {/* Match Result Modal */}
      {showResult && resultData && (
        <MatchResult
          isWinner={resultData.isWinner}
          teamName={resultData.teamName}
          opponentName={resultData.opponentName}
          placement={resultData.placement}
          isEliminated={resultData.isEliminated}
          onClose={() => {
            setShowResult(false);
            setResultData(null);
          }}
        />
      )}
    </motion.div>
  );
}

// Waiting Card (no next match scheduled yet)
function WaitingCard() {
  return (
    <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
      <div className="flex flex-col items-center text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
          <CornholeIcon className="h-8 w-8 text-white/40" />
        </div>
        <div>
          <p className="text-lg font-semibold text-white">No Upcoming Match</p>
          <p className="text-white/60 text-sm mt-1">
            Waiting for your next match to be scheduled...
          </p>
        </div>
      </div>
    </div>
  );
}
