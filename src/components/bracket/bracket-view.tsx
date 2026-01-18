"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { Trophy, Medal, Play, CheckCircle } from "lucide-react";
import type { Match } from "@/lib/types/database";
import { MatchSheet } from "./match-sheet";

type TeamInMatch = {
  id: string;
  name: string;
  player1_name?: string | null;
  player2_name?: string | null;
};

type MatchWithTeams = Match & {
  team_a: TeamInMatch | null;
  team_b: TeamInMatch | null;
  winner: TeamInMatch | null;
};

interface BracketViewProps {
  matches: MatchWithTeams[];
  onStartMatch?: (matchId: string) => void | Promise<void>;
  onCompleteMatch?: (matchId: string, scoreA: number, scoreB: number) => void | Promise<void>;
  onResetMatch?: (matchId: string) => void | Promise<void>;
  canUserInteract?: boolean;
  userTeamId?: string | null;
  isAdmin?: boolean;
}

export function BracketView({
  matches,
  onStartMatch,
  onCompleteMatch,
  onResetMatch,
  canUserInteract = true,
  userTeamId,
  isAdmin = false,
}: BracketViewProps) {
  const [selectedMatch, setSelectedMatch] = useState<MatchWithTeams | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Group matches by bracket type
  const winnersMatches = matches.filter(m => m.bracket_type === "winners");
  const consolationMatches = matches.filter(m => m.bracket_type === "consolation");

  // Group by round
  const winnersRounds = winnersMatches.reduce((acc, match) => {
    if (!acc[match.round_number]) acc[match.round_number] = [];
    acc[match.round_number].push(match);
    return acc;
  }, {} as Record<number, MatchWithTeams[]>);

  const consolationRounds = consolationMatches.reduce((acc, match) => {
    if (!acc[match.round_number]) acc[match.round_number] = [];
    acc[match.round_number].push(match);
    return acc;
  }, {} as Record<number, MatchWithTeams[]>);

  // Check if user can interact with match (admins can interact with any match)
  const userCanInteractWithMatch = (match: MatchWithTeams | null) => {
    if (!match) return false;
    if (isAdmin) return true;
    if (!userTeamId) return canUserInteract;
    return canUserInteract && (match.team_a_id === userTeamId || match.team_b_id === userTeamId);
  };

  const handleMatchClick = (match: MatchWithTeams) => {
    setSelectedMatch(match);
    setSheetOpen(true);
  };

  const handleStartMatch = async (matchId: string) => {
    if (onStartMatch) {
      await onStartMatch(matchId);
      const updatedMatch = matches.find(m => m.id === matchId);
      if (updatedMatch) {
        setSelectedMatch({ ...updatedMatch, status: "in_progress" });
      }
    }
  };

  const handleCompleteMatch = async (matchId: string, scoreA: number, scoreB: number) => {
    if (onCompleteMatch) {
      await onCompleteMatch(matchId, scoreA, scoreB);
      setSheetOpen(false);
    }
  };

  const handleResetMatch = async (matchId: string) => {
    if (onResetMatch) {
      await onResetMatch(matchId);
      setSheetOpen(false);
    }
  };

  // Card dimensions
  const CARD_WIDTH = 140;
  const CARD_HEIGHT = 56;
  const ROUND_GAP = 48;
  const MATCH_GAP = 16;

  const maxRounds = Math.max(Object.keys(winnersRounds).length, Object.keys(consolationRounds).length);
  const bracketWidth = maxRounds * (CARD_WIDTH + ROUND_GAP);

  return (
    <div className="space-y-4">
      {/* Single scroll container for both brackets - hidden scrollbar */}
      <div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
        <div style={{ minWidth: bracketWidth }}>
          {/* Championship Bracket */}
          <section className="mb-8">
            <div className="flex items-center gap-2 px-1 mb-3">
              <Trophy className="h-4 w-4 text-yellow-400" />
              <h2 className="text-sm font-medium text-white/80">Championship Bracket</h2>
              {winnersMatches.some(m => m.status === "in_progress") ? (
                <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded">Live</span>
              ) : winnersMatches.every(m => m.status === "complete") ? (
                <span className="text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded">Complete</span>
              ) : null}
              <span className="text-xs text-white/40 ml-auto">1st & 2nd</span>
            </div>

            <div className="relative">
              {/* SVG Lines */}
              <svg className="absolute inset-0 pointer-events-none" style={{ width: "100%", height: "100%" }}>
                <BracketLines rounds={winnersRounds} cardWidth={CARD_WIDTH} cardHeight={CARD_HEIGHT} roundGap={ROUND_GAP} matchGap={MATCH_GAP} />
              </svg>

              {/* Round columns */}
              <div className="flex relative">
                {Object.entries(winnersRounds).map(([round, roundMatches], roundIndex) => {
                  const totalRounds = Object.keys(winnersRounds).length;
                  const spacingMultiplier = Math.pow(2, roundIndex);
                  const effectiveGap = (CARD_HEIGHT + MATCH_GAP) * spacingMultiplier - CARD_HEIGHT;
                  const initialOffset = (spacingMultiplier - 1) * (CARD_HEIGHT + MATCH_GAP) / 2;

                  return (
                    <div
                      key={`winners-${round}`}
                      className="flex flex-col"
                      style={{ width: CARD_WIDTH, marginRight: roundIndex < totalRounds - 1 ? ROUND_GAP : 0 }}
                    >
                      <p className="text-[10px] text-white/40 mb-2 text-center h-[12px]">
                        {roundMatches[0]?.is_finals ? "Finals" : `R${round}`}
                      </p>
                      <div className="flex flex-col" style={{ paddingTop: initialOffset }}>
                        {roundMatches.map((match, idx) => (
                          <div
                            key={match.id}
                            style={{ marginTop: idx > 0 ? effectiveGap : 0 }}
                          >
                            <MiniMatchCard
                              match={match}
                              onClick={() => handleMatchClick(match)}
                              width={CARD_WIDTH}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Consolation Bracket */}
          <section>
            <div className="flex items-center gap-2 px-1 mb-3">
              <Medal className="h-4 w-4 text-orange-400" />
              <h2 className="text-sm font-medium text-white/80">Consolation Bracket</h2>
              {consolationMatches.some(m => m.status === "in_progress") ? (
                <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded">Live</span>
              ) : consolationMatches.length > 0 && consolationMatches.every(m => m.status === "complete") ? (
                <span className="text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded">Complete</span>
              ) : null}
              <span className="text-xs text-white/40 ml-auto">3rd & 4th</span>
            </div>

            <div className="relative">
              {/* SVG Lines */}
              <svg className="absolute inset-0 pointer-events-none" style={{ width: "100%", height: "100%" }}>
                <BracketLines rounds={consolationRounds} cardWidth={CARD_WIDTH} cardHeight={CARD_HEIGHT} roundGap={ROUND_GAP} matchGap={MATCH_GAP} />
              </svg>

              {/* Round columns */}
              <div className="flex relative">
                {Object.entries(consolationRounds).map(([round, roundMatches], roundIndex) => {
                  const totalRounds = Object.keys(consolationRounds).length;
                  const spacingMultiplier = Math.pow(2, roundIndex);
                  const effectiveGap = (CARD_HEIGHT + MATCH_GAP) * spacingMultiplier - CARD_HEIGHT;
                  const initialOffset = (spacingMultiplier - 1) * (CARD_HEIGHT + MATCH_GAP) / 2;

                  return (
                    <div
                      key={`consolation-${round}`}
                      className="flex flex-col"
                      style={{ width: CARD_WIDTH, marginRight: roundIndex < totalRounds - 1 ? ROUND_GAP : 0 }}
                    >
                      <p className="text-[10px] text-white/40 mb-2 text-center h-[12px]">
                        {roundMatches[0]?.is_finals ? "Finals" : `R${round}`}
                      </p>
                      <div className="flex flex-col" style={{ paddingTop: initialOffset }}>
                        {roundMatches.map((match, idx) => (
                          <div
                            key={match.id}
                            style={{ marginTop: idx > 0 ? effectiveGap : 0 }}
                          >
                            <MiniMatchCard
                              match={match}
                              onClick={() => handleMatchClick(match)}
                              width={CARD_WIDTH}
                              accentColor="orange"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Match Sheet */}
      <MatchSheet
        match={selectedMatch}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onStartMatch={handleStartMatch}
        onCompleteMatch={handleCompleteMatch}
        onResetMatch={handleResetMatch}
        canUserInteract={userCanInteractWithMatch(selectedMatch)}
        userTeamId={userTeamId}
        isAdmin={isAdmin}
        placement={
          selectedMatch?.is_finals
            ? selectedMatch.bracket_type === "winners"
              ? { winner: "1st", loser: "2nd" }
              : { winner: "3rd", loser: "4th" }
            : undefined
        }
      />
    </div>
  );
}

// Mini Match Card - smaller, compact design
interface MiniMatchCardProps {
  match: MatchWithTeams;
  onClick: () => void;
  width: number;
  accentColor?: "yellow" | "orange";
}

function MiniMatchCard({ match, onClick, width, accentColor = "yellow" }: MiniMatchCardProps) {
  const isComplete = match.status === "complete";
  const isLive = match.status === "in_progress";
  const canInteract = match.team_a_id && match.team_b_id;

  return (
    <motion.div
      className={`rounded-lg overflow-hidden bg-white/5 border border-white/10 ${
        canInteract ? "cursor-pointer" : ""
      } ${isLive ? "border-yellow-400/50" : ""}`}
      style={{ width }}
      onClick={canInteract ? onClick : undefined}
      whileHover={canInteract ? { scale: 1.02 } : undefined}
      whileTap={canInteract ? { scale: 0.98 } : undefined}
    >
      {/* Status indicator */}
      {isLive && (
        <div className="bg-yellow-400/20 px-2 py-0.5 flex items-center justify-center gap-1">
          <Play className="h-2.5 w-2.5 text-yellow-400" />
          <span className="text-[9px] text-yellow-400 font-medium">LIVE</span>
        </div>
      )}

      {/* Team A */}
      <div className={`flex items-center justify-between px-2 py-1.5 text-xs ${
        isComplete && match.winner_id === match.team_a_id ? "bg-green-500/10" : ""
      }`}>
        <span className={`truncate flex-1 ${
          isComplete && match.winner_id === match.team_a_id ? "text-green-400 font-medium" : "text-white/80"
        }`}>
          {match.team_a?.name || "TBD"}
        </span>
        <span className={`ml-1 font-bold min-w-[16px] text-right ${
          isComplete && match.winner_id === match.team_a_id ? "text-green-400" : "text-white/40"
        }`}>
          {match.score_a ?? "-"}
        </span>
      </div>

      <div className="h-px bg-white/10" />

      {/* Team B */}
      <div className={`flex items-center justify-between px-2 py-1.5 text-xs ${
        isComplete && match.winner_id === match.team_b_id ? "bg-green-500/10" : ""
      }`}>
        <span className={`truncate flex-1 ${
          isComplete && match.winner_id === match.team_b_id ? "text-green-400 font-medium" : "text-white/80"
        }`}>
          {match.team_b?.name || "TBD"}
        </span>
        <span className={`ml-1 font-bold min-w-[16px] text-right ${
          isComplete && match.winner_id === match.team_b_id ? "text-green-400" : "text-white/40"
        }`}>
          {match.score_b ?? "-"}
        </span>
      </div>
    </motion.div>
  );
}

// SVG Bracket Lines
interface BracketLinesProps {
  rounds: Record<number, MatchWithTeams[]>;
  cardWidth: number;
  cardHeight: number;
  roundGap: number;
  matchGap: number;
}

function BracketLines({ rounds, cardWidth, cardHeight, roundGap, matchGap }: BracketLinesProps) {
  const lines: React.ReactNode[] = [];
  const roundKeys = Object.keys(rounds).map(Number).sort((a, b) => a - b);

  // Header offset (for "R1", "Finals" labels)
  const headerOffset = 20;

  // Helper to calculate Y position of a match
  const getMatchY = (roundIndex: number, matchIndex: number): number => {
    const spacingMultiplier = Math.pow(2, roundIndex);
    const effectiveGap = (cardHeight + matchGap) * spacingMultiplier - cardHeight;
    const initialOffset = (spacingMultiplier - 1) * (cardHeight + matchGap) / 2;
    const y = headerOffset + initialOffset + matchIndex * (cardHeight + effectiveGap);
    return y;
  };

  roundKeys.forEach((round, roundIndex) => {
    if (roundIndex === roundKeys.length - 1) return; // No lines from last round

    const currentMatches = rounds[round];
    const nextRound = roundKeys[roundIndex + 1];
    const nextMatches = rounds[nextRound];

    if (!nextMatches) return;

    currentMatches.forEach((match, idx) => {
      const matchY = getMatchY(roundIndex, idx);
      const centerY = matchY + cardHeight / 2;

      // X positions
      const x1 = roundIndex * (cardWidth + roundGap) + cardWidth;
      const x2 = (roundIndex + 1) * (cardWidth + roundGap);
      const midX = x1 + roundGap / 2;

      // Find next match index (pairs feed into same match)
      const nextMatchIdx = Math.floor(idx / 2);
      if (nextMatchIdx >= nextMatches.length) return;

      const nextMatchY = getMatchY(roundIndex + 1, nextMatchIdx);
      const nextCenterY = nextMatchY + cardHeight / 2;

      // Draw connector line: horizontal from card, vertical to meet, horizontal to next card
      lines.push(
        <path
          key={`line-${match.id}`}
          d={`M ${x1} ${centerY} H ${midX} V ${nextCenterY} H ${x2}`}
          fill="none"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="1.5"
        />
      );
    });
  });

  return <>{lines}</>;
}
