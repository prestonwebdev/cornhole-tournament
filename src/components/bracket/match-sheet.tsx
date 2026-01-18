"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Trophy, Medal, Play, CheckCircle, Clock, Loader2, RotateCcw } from "lucide-react";
import type { MatchStatus } from "@/lib/types/database";
import { MatchResult } from "./match-result";

type TeamInfo = {
  id: string;
  name: string;
  player1_id?: string | null;
  player2_id?: string | null;
  player1_name?: string | null;
  player2_name?: string | null;
};

type MatchData = {
  id: string;
  bracket_type: "winners" | "consolation";
  round_number: number;
  match_number: number;
  team_a_id: string | null;
  team_b_id: string | null;
  team_a: TeamInfo | null;
  team_b: TeamInfo | null;
  score_a: number | null;
  score_b: number | null;
  winner_id: string | null;
  status: MatchStatus;
  is_finals: boolean;
  started_at: string | null;
  completed_at: string | null;
};

interface MatchSheetProps {
  match: MatchData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartMatch?: (matchId: string) => void | Promise<void>;
  onCompleteMatch?: (matchId: string, scoreA: number, scoreB: number) => void | Promise<void>;
  onResetMatch?: (matchId: string) => void | Promise<void>;
  canUserInteract?: boolean;
  placement?: { winner: string; loser: string };
  userTeamId?: string | null;
  isAdmin?: boolean;
}

export function MatchSheet({
  match,
  open,
  onOpenChange,
  onStartMatch,
  onCompleteMatch,
  onResetMatch,
  canUserInteract = true,
  placement,
  userTeamId,
  isAdmin = false,
}: MatchSheetProps) {
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isEditingComplete, setIsEditingComplete] = useState(false);
  const [resultData, setResultData] = useState<{
    isWinner: boolean;
    teamName: string;
    opponentName: string;
    placement?: string;
    isEliminated?: boolean;
  } | null>(null);

  // Reset scores when match changes or sheet opens
  useEffect(() => {
    if (open && match) {
      // For admins editing completed matches, pre-fill scores
      if (isAdmin && match.status === "complete" && match.score_a !== null && match.score_b !== null) {
        setScoreA(match.score_a);
        setScoreB(match.score_b);
      } else {
        setScoreA(0);
        setScoreB(0);
      }
      setShowResult(false);
      setResultData(null);
      setIsEditingComplete(false);
    }
  }, [open, match?.id, isAdmin]);

  if (!match) return null;

  const canStart = match.status === "pending" && match.team_a_id && match.team_b_id;
  const canComplete = match.status === "in_progress" && match.team_a_id && match.team_b_id;
  const isComplete = match.status === "complete";
  // Admin can edit completed matches
  const adminCanEdit = isAdmin && isComplete && match.team_a_id && match.team_b_id;

  const bracketLabel = match.bracket_type === "winners" ? "Championship" : "Consolation";
  const roundLabel = match.is_finals ? "Finals" : `Round ${match.round_number}`;

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
      if (userTeamId) {
        const userIsTeamA = match.team_a_id === userTeamId;
        const userIsTeamB = match.team_b_id === userTeamId;

        if (userIsTeamA || userIsTeamB) {
          const userScore = userIsTeamA ? scoreA : scoreB;
          const opponentScore = userIsTeamA ? scoreB : scoreA;
          const isWinner = userScore > opponentScore;

          const userTeamName = userIsTeamA ? match.team_a?.name : match.team_b?.name;
          const opponentName = userIsTeamA ? match.team_b?.name : match.team_a?.name;

          // Determine placement for finals
          let resultPlacement: string | undefined;
          if (placement) {
            resultPlacement = isWinner ? placement.winner : placement.loser;
          }

          // User is eliminated if they lose in the consolation bracket
          const isEliminated = !isWinner && match.bracket_type === "consolation";

          setResultData({
            isWinner,
            teamName: userTeamName || "Your Team",
            opponentName: opponentName || "Opponent",
            placement: resultPlacement,
            isEliminated,
          });
          setShowResult(true);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Determine winner based on scores
  const getWinnerName = () => {
    if (scoreA === scoreB) return null;
    return scoreA > scoreB ? match.team_a?.name : match.team_b?.name;
  };

  const handleResetMatch = async () => {
    if (!onResetMatch) return;
    setIsResetting(true);
    try {
      await onResetMatch(match.id);
    } finally {
      setIsResetting(false);
    }
  };

  const handleResultClose = () => {
    setShowResult(false);
    setResultData(null);
    onOpenChange(false);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto pt-8">
          <SheetHeader className="text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {match.bracket_type === "winners" ? (
                  <Trophy className="h-5 w-5 text-yellow-400" />
                ) : (
                  <Medal className="h-5 w-5 text-orange-400" />
                )}
                <SheetTitle>{bracketLabel} Bracket</SheetTitle>
              </div>
              <StatusBadge status={match.status} />
            </div>
            <SheetDescription>
              {roundLabel} &bull; Match {match.match_number}
            </SheetDescription>
          </SheetHeader>

        <div className="mt-6 space-y-6">

          {/* Teams Display */}
          <div className="space-y-3">
            {/* Team A */}
            <TeamCard
              team={match.team_a}
              score={match.score_a}
              isWinner={match.winner_id === match.team_a_id}
              placement={placement && match.winner_id === match.team_a_id ? placement.winner :
                        placement && match.winner_id && match.winner_id !== match.team_a_id ? placement.loser : undefined}
              isComplete={isComplete}
            />

            {/* VS Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-white/40 text-sm font-medium">VS</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Team B */}
            <TeamCard
              team={match.team_b}
              score={match.score_b}
              isWinner={match.winner_id === match.team_b_id}
              placement={placement && match.winner_id === match.team_b_id ? placement.winner :
                        placement && match.winner_id && match.winner_id !== match.team_b_id ? placement.loser : undefined}
              isComplete={isComplete}
            />
          </div>

          {/* Action Area */}
          {canUserInteract && (
            <div className="space-y-4">
              {/* Start Match Button - Only shown when pending */}
              {canStart && (
                <button
                  onClick={handleStartMatch}
                  disabled={isLoading}
                  className="w-full py-3 bg-green-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Play className="h-5 w-5" />
                      Start Match
                    </>
                  )}
                </button>
              )}

              {/* Score Entry - Only shown when in_progress */}
              {canComplete && (
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

              {/* Match Complete State */}
              {isComplete && !isEditingComplete && (
                <div className="text-center text-white/60 text-sm">
                  <p>Match completed</p>
                  {match.completed_at && (
                    <p className="text-white/40 text-xs mt-1">
                      {new Date(match.completed_at).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              {/* Admin Edit Scores for Completed Match */}
              {adminCanEdit && isEditingComplete && (
                <div className="space-y-4 bg-white/5 rounded-xl p-4">
                  <p className="text-sm text-white/60 text-center">
                    Edit scores (Admin)
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
                        Update - {getWinnerName()} Wins
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setIsEditingComplete(false)}
                    className="w-full py-2 text-white/60 text-sm hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Admin Controls */}
              {isAdmin && (isComplete || match.status === "in_progress") && !isEditingComplete && (
                <div className="flex gap-2 pt-2 border-t border-white/10">
                  {isComplete && (
                    <button
                      onClick={() => setIsEditingComplete(true)}
                      className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Edit Scores
                    </button>
                  )}
                  <button
                    onClick={handleResetMatch}
                    disabled={isResetting}
                    className="flex-1 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {isResetting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <RotateCcw className="h-4 w-4" />
                        Reset Match
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Timeline */}
          {(match.started_at || match.completed_at) && (
            <div className="border-t border-white/10 pt-4 space-y-2 text-xs text-white/40">
              {match.started_at && (
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  <span>Started: {new Date(match.started_at).toLocaleString()}</span>
                </div>
              )}
              {match.completed_at && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3" />
                  <span>Completed: {new Date(match.completed_at).toLocaleString()}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>

    {/* Match Result Modal */}
    {showResult && resultData && (
      <MatchResult
        isWinner={resultData.isWinner}
        teamName={resultData.teamName}
        opponentName={resultData.opponentName}
        placement={resultData.placement}
        isEliminated={resultData.isEliminated}
        onClose={handleResultClose}
      />
    )}
    </>
  );
}

function StatusBadge({ status }: { status: MatchStatus }) {
  const configs = {
    pending: {
      label: "Pending",
      className: "bg-white/10 text-white/60",
      icon: Clock,
    },
    in_progress: {
      label: "In Progress",
      className: "bg-yellow-500/20 text-yellow-400",
      icon: Play,
    },
    complete: {
      label: "Complete",
      className: "bg-green-500/20 text-green-400",
      icon: CheckCircle,
    },
  };

  const config = configs[status];
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${config.className}`}>
      <Icon className="h-4 w-4" />
      {config.label}
    </div>
  );
}

interface TeamCardProps {
  team: TeamInfo | null;
  score: number | null;
  isWinner: boolean;
  placement?: string;
  isComplete: boolean;
}

function TeamCard({ team, score, isWinner, placement, isComplete }: TeamCardProps) {
  return (
    <div
      className={`rounded-xl p-4 transition-colors ${
        isWinner && isComplete ? "bg-green-500/10 border border-green-500/30" : "bg-white/5"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
            isWinner && isComplete ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white"
          }`}>
            {team?.name?.charAt(0) || "?"}
          </div>
          <div>
            <p className="font-medium text-white">{team?.name || "TBD"}</p>
            {team?.player1_name && team?.player2_name && (
              <p className="text-xs text-white/40">
                {team.player1_name} & {team.player2_name}
              </p>
            )}
            {placement && (
              <span className={`text-xs px-2 py-0.5 rounded ${
                isWinner ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white/60"
              }`}>
                {placement} Place
              </span>
            )}
          </div>
        </div>
        {isComplete && score !== null && (
          <span className={`text-2xl font-bold ${isWinner ? "text-green-400" : "text-white/60"}`}>
            {score}
          </span>
        )}
      </div>
    </div>
  );
}
