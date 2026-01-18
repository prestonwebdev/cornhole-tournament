"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Trophy, Clock, Medal, Play, CheckCircle } from "lucide-react";
import type { Match, MatchStatus } from "@/lib/types/database";
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
  is_bye?: boolean;
};

interface BracketContentProps {
  matches: MatchWithTeams[];
  onStartMatch?: (matchId: string) => void | Promise<void>;
  onCompleteMatch?: (matchId: string, scoreA: number, scoreB: number) => void | Promise<void>;
  canUserInteract?: boolean;
  userTeamId?: string | null;
}

export function BracketContent({
  matches,
  onStartMatch,
  onCompleteMatch,
  canUserInteract = true,
  userTeamId,
}: BracketContentProps) {
  const [selectedMatch, setSelectedMatch] = useState<MatchWithTeams | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Group matches by bracket type
  const winnersMatches = matches.filter(m => m.bracket_type === "winners");
  const consolationMatches = matches.filter(m => m.bracket_type === "consolation");

  // Find finals matches
  const winnersFinals = winnersMatches.find(m => m.is_finals);
  const consolationFinals = consolationMatches.find(m => m.is_finals);

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

  const handleMatchClick = (match: MatchWithTeams) => {
    setSelectedMatch(match);
    setSheetOpen(true);
  };

  const handleStartMatch = async (matchId: string) => {
    if (onStartMatch) {
      await onStartMatch(matchId);
      // Update the selected match state after starting
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

  return (
    <motion.div
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: 0.1 }
        }
      }}
    >
      {/* Header */}
      <motion.div
        className="pt-4"
        variants={{
          hidden: { opacity: 0, y: -10 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
        }}
      >
        <h1 className="text-2xl font-bold text-white">Bracket</h1>
        <p className="text-white/60 text-sm">
          {matches.length} match{matches.length !== 1 ? "es" : ""}
        </p>
      </motion.div>

      {/* Winners Bracket - Plays for 1st/2nd */}
      <motion.section
        className="space-y-3"
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-400" />
            <h2 className="text-sm font-medium text-white/80">Championship Bracket</h2>
          </div>
          <span className="text-xs text-white/40">Playing for 1st & 2nd</span>
        </div>

        {Object.entries(winnersRounds).map(([round, roundMatches]) => {
          const roundNum = parseInt(round);
          const isFinals = roundMatches.some(m => m.is_finals);
          const roundLabel = isFinals ? "Finals" : `Round ${round}`;

          return (
            <div key={`winners-${round}`} className="space-y-2">
              <p className="text-xs text-white/40 pl-2">
                {roundLabel}
                {isFinals && <span className="text-yellow-400 ml-2">1st vs 2nd Place</span>}
              </p>
              {roundMatches.map((match, index) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  highlight={isFinals}
                  index={index}
                  showPlacement={isFinals}
                  placement={{ winner: "1st", loser: "2nd" }}
                  onClick={() => handleMatchClick(match)}
                />
              ))}
            </div>
          );
        })}

        {winnersMatches.length === 0 && (
          <p className="text-white/40 text-sm">No matches yet</p>
        )}
      </motion.section>

      {/* Consolation Bracket - Plays for 3rd/4th */}
      <motion.section
        className="space-y-3"
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.1 } }
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Medal className="h-4 w-4 text-orange-400" />
            <h2 className="text-sm font-medium text-white/80">Consolation Bracket</h2>
          </div>
          <span className="text-xs text-white/40">Playing for 3rd & 4th</span>
        </div>

        {Object.entries(consolationRounds).map(([round, roundMatches]) => {
          const isFinals = roundMatches.some(m => m.is_finals);
          const roundLabel = isFinals ? "Consolation Finals" : `Round ${round}`;

          return (
            <div key={`consolation-${round}`} className="space-y-2">
              <p className="text-xs text-white/40 pl-2">
                {roundLabel}
                {isFinals && <span className="text-orange-400 ml-2">3rd vs 4th Place</span>}
              </p>
              {roundMatches.map((match, index) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  highlight={isFinals}
                  highlightColor="orange"
                  index={index}
                  showPlacement={isFinals}
                  placement={{ winner: "3rd", loser: "4th" }}
                  onClick={() => handleMatchClick(match)}
                />
              ))}
            </div>
          );
        })}

        {consolationMatches.length === 0 && (
          <p className="text-white/40 text-sm">No matches yet</p>
        )}
      </motion.section>

      {/* Match Sheet */}
      <MatchSheet
        match={selectedMatch}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onStartMatch={handleStartMatch}
        onCompleteMatch={handleCompleteMatch}
        canUserInteract={canUserInteract}
        userTeamId={userTeamId}
        placement={
          selectedMatch?.is_finals
            ? selectedMatch.bracket_type === "winners"
              ? { winner: "1st", loser: "2nd" }
              : { winner: "3rd", loser: "4th" }
            : undefined
        }
      />
    </motion.div>
  );
}

export function BracketEmptyState() {
  return (
    <motion.div
      className="flex items-center justify-center min-h-[60vh]"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="bg-white/5 rounded-2xl p-8 text-center max-w-sm w-full">
        <motion.div
          className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
        >
          <Clock className="h-8 w-8 text-white/40" />
        </motion.div>
        <motion.h1
          className="text-xl font-semibold text-white mb-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Bracket Coming Soon
        </motion.h1>
        <motion.p
          className="text-white/60 text-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          The bracket hasn&apos;t been created yet. Check back soon!
        </motion.p>
      </div>
    </motion.div>
  );
}

interface MatchCardProps {
  match: MatchWithTeams;
  highlight?: boolean;
  highlightColor?: "yellow" | "orange";
  index: number;
  showPlacement?: boolean;
  placement?: { winner: string; loser: string };
  onClick?: () => void;
}

function MatchCard({
  match,
  highlight,
  highlightColor = "yellow",
  index,
  showPlacement,
  placement,
  onClick,
}: MatchCardProps) {
  const borderColor = highlightColor === "yellow" ? "border-yellow-400/30" : "border-orange-400/30";
  const canInteract = match.team_a_id && match.team_b_id && !match.is_bye;
  const isBye = match.is_bye;

  // For bye rounds, determine which team has the bye and which slot is empty
  const teamADisplay = match.team_a?.name || (isBye && match.team_b_id ? "Bye" : "TBD");
  const teamBDisplay = match.team_b?.name || (isBye && match.team_a_id ? "Bye" : "TBD");
  const isTeamABye = !match.team_a_id && isBye;
  const isTeamBBye = !match.team_b_id && isBye;

  return (
    <motion.div
      className={`rounded-xl overflow-hidden ${highlight ? `border ${borderColor}` : ""} ${canInteract ? "cursor-pointer active:scale-[0.98]" : ""} ${isBye ? "opacity-60" : ""}`}
      initial={{ opacity: 0, x: -15 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={canInteract ? { scale: 1.01 } : undefined}
      whileTap={canInteract ? { scale: 0.99 } : undefined}
      onClick={canInteract ? onClick : undefined}
    >
      <div className="text-xs text-white/40 px-4 py-1 bg-white/5 flex justify-between items-center">
        <span>Match {match.match_number}</span>
        <div className="flex items-center gap-2">
          {/* Status Badge */}
          {isBye && (
            <span className="flex items-center gap-1 text-blue-400">
              Bye
            </span>
          )}
          {!isBye && match.status === "in_progress" && (
            <span className="flex items-center gap-1 text-yellow-400">
              <Play className="h-3 w-3" />
              Live
            </span>
          )}
          {!isBye && match.status === "complete" && (
            <span className="flex items-center gap-1 text-green-400">
              <CheckCircle className="h-3 w-3" />
            </span>
          )}
          {match.is_finals && (
            <span className={highlightColor === "yellow" ? "text-yellow-400" : "text-orange-400"}>
              Finals
            </span>
          )}
        </div>
      </div>
      <div className="bg-white/5">
        <div
          className={`flex justify-between items-center px-4 py-3 transition-colors ${
            match.winner_id === match.team_a_id && !isTeamABye ? "bg-green-500/10" : ""
          }`}
        >
          <div className="flex items-center gap-2">
            <div>
              <span className={`font-medium ${isTeamABye ? "text-white/30 italic" : "text-white"}`}>
                {teamADisplay}
              </span>
              {match.team_a?.player1_name && match.team_a?.player2_name && (
                <p className="text-xs text-white/40">
                  {match.team_a.player1_name} & {match.team_a.player2_name}
                </p>
              )}
            </div>
            {showPlacement && match.winner_id === match.team_a_id && placement && (
              <span className="text-xs text-green-400 bg-green-500/20 px-2 py-0.5 rounded">
                {placement.winner}
              </span>
            )}
            {showPlacement && match.winner_id && match.winner_id !== match.team_a_id && placement && (
              <span className="text-xs text-white/40 bg-white/10 px-2 py-0.5 rounded">
                {placement.loser}
              </span>
            )}
          </div>
          <span className="font-bold text-white">{isBye ? "-" : (match.score_a ?? "-")}</span>
        </div>
        <div className="h-px bg-white/10" />
        <div
          className={`flex justify-between items-center px-4 py-3 transition-colors ${
            match.winner_id === match.team_b_id && !isTeamBBye ? "bg-green-500/10" : ""
          }`}
        >
          <div className="flex items-center gap-2">
            <div>
              <span className={`font-medium ${isTeamBBye ? "text-white/30 italic" : "text-white"}`}>
                {teamBDisplay}
              </span>
              {match.team_b?.player1_name && match.team_b?.player2_name && (
                <p className="text-xs text-white/40">
                  {match.team_b.player1_name} & {match.team_b.player2_name}
                </p>
              )}
            </div>
            {showPlacement && match.winner_id === match.team_b_id && placement && (
              <span className="text-xs text-green-400 bg-green-500/20 px-2 py-0.5 rounded">
                {placement.winner}
              </span>
            )}
            {showPlacement && match.winner_id && match.winner_id !== match.team_b_id && placement && (
              <span className="text-xs text-white/40 bg-white/10 px-2 py-0.5 rounded">
                {placement.loser}
              </span>
            )}
          </div>
          <span className="font-bold text-white">{isBye ? "-" : (match.score_b ?? "-")}</span>
        </div>
      </div>
    </motion.div>
  );
}
