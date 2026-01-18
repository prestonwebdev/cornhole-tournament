"use client";

import { motion } from "motion/react";
import { Medal, Play, Loader2, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { CornholeIcon } from "@/components/icons/cornhole-icon";
import { MatchResult } from "@/components/bracket/match-result";

type TeamInfo = {
  id: string;
  name: string;
  player1_name?: string | null;
  player2_name?: string | null;
};

type MatchWithTeams = {
  id: string;
  bracket_type: "winners" | "consolation";
  round_number: number;
  match_number: number;
  team_a_id: string | null;
  team_b_id: string | null;
  team_a: TeamInfo | null;
  team_b: TeamInfo | null;
  status: "pending" | "in_progress" | "complete";
  is_finals: boolean;
};

interface NextMatchCardProps {
  match: MatchWithTeams;
  userTeamId: string;
  userRecord?: { wins: number; losses: number };
  opponentRecord?: { wins: number; losses: number };
  onStartMatch?: (matchId: string) => Promise<void>;
  onCompleteMatch?: (matchId: string, scoreA: number, scoreB: number) => Promise<void>;
}

// Helper to determine match stakes
function getMatchStakes(match: MatchWithTeams): { winStakes: string; loseStakes: string } {
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
    const isPreFinals = round_number >= 2;
    return {
      winStakes: isPreFinals ? "Advance to Finals" : "Advance to next round",
      loseStakes: "Drop to Consolation"
    };
  } else {
    const isPreFinals = round_number >= 2;
    return {
      winStakes: isPreFinals ? "Advance to 3rd Place Match" : "Stay alive",
      loseStakes: "Eliminated"
    };
  }
}

export function NextMatchCard({ match, userTeamId, userRecord, opponentRecord, onStartMatch, onCompleteMatch }: NextMatchCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [resultData, setResultData] = useState<{
    isWinner: boolean;
    teamName: string;
    opponentName: string;
    placement?: string;
    isEliminated?: boolean;
  } | null>(null);

  const isTeamA = match.team_a_id === userTeamId;
  const opponent = isTeamA ? match.team_b : match.team_a;
  const userTeam = isTeamA ? match.team_a : match.team_b;

  // Reset scores when match changes
  useEffect(() => {
    setScoreA(0);
    setScoreB(0);
    setShowResult(false);
    setResultData(null);
  }, [match.id]);

  const bracketLabel = match.bracket_type === "winners" ? "Championship" : "Consolation";
  const roundLabel = match.is_finals ? "Finals" : `Round ${match.round_number}`;
  const stakes = getMatchStakes(match);

  const handleStartMatch = async () => {
    if (!onStartMatch) return;
    setIsLoading(true);
    try {
      await onStartMatch(match.id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteMatch = async () => {
    if (!onCompleteMatch) return;
    if (scoreA === scoreB) return; // Can't have a tie
    setIsLoading(true);
    try {
      await onCompleteMatch(match.id, scoreA, scoreB);

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
    } finally {
      setIsLoading(false);
    }
  };

  // Determine winner based on scores
  const getWinnerName = () => {
    if (scoreA === scoreB) return null;
    return scoreA > scoreB ? match.team_a?.name : match.team_b?.name;
  };

  return (
    <motion.div
      className="bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-6 space-y-4 border border-white/10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
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
          <div className="w-10 h-10 flex-shrink-0 rounded-full bg-white/10 flex items-center justify-center text-base font-bold text-white">
            {userTeam?.name?.charAt(0) || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <p className="text-lg font-semibold text-white truncate">
                {userTeam?.name || "TBD"}
              </p>
              {userRecord && (
                <span className="text-white/40 text-sm flex-shrink-0">
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
          <div className="w-10 h-10 flex-shrink-0 rounded-full bg-white/10 flex items-center justify-center text-base font-bold text-white">
            {opponent?.name?.charAt(0) || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <p className="text-lg font-semibold text-white truncate">
                {opponent?.name || "TBD"}
              </p>
              {opponentRecord && (
                <span className="text-white/40 text-sm flex-shrink-0">
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

      {/* Actions */}
      {match.status === "pending" && onStartMatch && (
        <motion.button
          onClick={handleStartMatch}
          disabled={isLoading || !match.team_a_id || !match.team_b_id}
          className="w-full py-3 bg-green-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          whileTap={{ scale: 0.98 }}
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : !match.team_a_id || !match.team_b_id ? (
            "Waiting for opponent..."
          ) : (
            <>
              <Play className="h-5 w-5" />
              Start Match
            </>
          )}
        </motion.button>
      )}

      {match.status === "in_progress" && onCompleteMatch && (
        <div className="space-y-4 bg-white/5 rounded-xl p-4">
          <p className="text-sm text-white/60 text-center">
            Enter final scores
          </p>

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

          <motion.button
            onClick={handleCompleteMatch}
            disabled={isLoading || scoreA === scoreB}
            className="w-full py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            whileTap={{ scale: 0.98 }}
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
          </motion.button>
        </div>
      )}

      {/* View bracket link */}
      <Link
        href="/bracket"
        className="block text-center text-white/60 hover:text-white text-sm transition-colors"
      >
        View full bracket
      </Link>

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
