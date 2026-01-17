"use client";

import { useState } from "react";
import { useMockBracket, type BracketScenario } from "@/lib/test-data";
import { Trophy, RotateCcw, Play, ChevronDown, ChevronUp, Medal } from "lucide-react";

export default function BracketTestPage() {
  const bracket = useMockBracket("8-team-fresh");
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);
  const [scoreA, setScoreA] = useState(21);
  const [scoreB, setScoreB] = useState(15);

  const winnersMatches = bracket.getWinnersMatches();
  const consolationMatches = bracket.getConsolationMatches();
  const pendingMatches = bracket.getPendingMatches();
  const completedMatches = bracket.getCompletedMatches();

  // Group winners matches by round
  const winnersRounds = winnersMatches.reduce((acc, match) => {
    if (!acc[match.round_number]) acc[match.round_number] = [];
    acc[match.round_number].push(match);
    return acc;
  }, {} as Record<number, typeof winnersMatches>);

  // Group consolation matches by round
  const consolationRounds = consolationMatches.reduce((acc, match) => {
    if (!acc[match.round_number]) acc[match.round_number] = [];
    acc[match.round_number].push(match);
    return acc;
  }, {} as Record<number, typeof consolationMatches>);

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="pt-4">
        <h1 className="text-2xl font-bold text-white">Bracket Test Playground</h1>
        <p className="text-white/60 text-sm">
          Test consolation bracket logic with mock data (no database changes)
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white/5 rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-white">Scenario</h2>
          <button
            onClick={() => bracket.reset()}
            className="flex items-center gap-1 text-sm text-white/60 hover:text-white"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {bracket.scenarios.map((s) => (
            <button
              key={s}
              onClick={() => bracket.loadScenario(s)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                bracket.scenario === s
                  ? "bg-white text-[#1a1a1a]"
                  : "bg-white/10 text-white/70 hover:bg-white/20"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="flex gap-4 text-sm">
          <div className="bg-white/5 rounded-lg px-3 py-2">
            <span className="text-white/40">Pending:</span>{" "}
            <span className="text-white font-medium">{pendingMatches.length}</span>
          </div>
          <div className="bg-white/5 rounded-lg px-3 py-2">
            <span className="text-white/40">Completed:</span>{" "}
            <span className="text-white font-medium">{completedMatches.length}</span>
          </div>
          <div className="bg-white/5 rounded-lg px-3 py-2">
            <span className="text-white/40">Total:</span>{" "}
            <span className="text-white font-medium">{bracket.matches.length}</span>
          </div>
        </div>
      </div>

      {/* Championship Bracket - Plays for 1st/2nd */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-400" />
            <h2 className="text-sm font-medium text-white/80">Championship Bracket</h2>
          </div>
          <span className="text-xs text-white/40">Playing for 1st & 2nd</span>
        </div>

        {Object.entries(winnersRounds).map(([round, matches]) => {
          const isFinals = matches.some(m => m.is_finals);
          const roundLabel = isFinals ? "Finals (1st vs 2nd)" : `Round ${round}`;

          return (
            <div key={`winners-${round}`} className="space-y-2">
              <p className="text-xs text-white/40 pl-2">{roundLabel}</p>
              {matches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  highlight={isFinals}
                  highlightColor="yellow"
                  expanded={expandedMatch === match.id}
                  onToggle={() => setExpandedMatch(expandedMatch === match.id ? null : match.id)}
                  scoreA={scoreA}
                  scoreB={scoreB}
                  onScoreAChange={setScoreA}
                  onScoreBChange={setScoreB}
                  onRecordResult={(winnerId) => {
                    bracket.recordResult(match.id, winnerId, scoreA, scoreB);
                    setExpandedMatch(null);
                  }}
                  placement={isFinals ? { winner: "1st", loser: "2nd" } : undefined}
                />
              ))}
            </div>
          );
        })}
      </section>

      {/* Consolation Bracket - Plays for 3rd/4th */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Medal className="h-4 w-4 text-orange-400" />
            <h2 className="text-sm font-medium text-white/80">Consolation Bracket</h2>
          </div>
          <span className="text-xs text-white/40">Playing for 3rd & 4th</span>
        </div>

        {Object.entries(consolationRounds).map(([round, matches]) => {
          const isFinals = matches.some(m => m.is_finals);
          const roundLabel = isFinals ? "Consolation Finals (3rd vs 4th)" : `Round ${round}`;

          return (
            <div key={`consolation-${round}`} className="space-y-2">
              <p className="text-xs text-white/40 pl-2">{roundLabel}</p>
              {matches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  highlight={isFinals}
                  highlightColor="orange"
                  expanded={expandedMatch === match.id}
                  onToggle={() => setExpandedMatch(expandedMatch === match.id ? null : match.id)}
                  scoreA={scoreA}
                  scoreB={scoreB}
                  onScoreAChange={setScoreA}
                  onScoreBChange={setScoreB}
                  onRecordResult={(winnerId) => {
                    bracket.recordResult(match.id, winnerId, scoreA, scoreB);
                    setExpandedMatch(null);
                  }}
                  placement={isFinals ? { winner: "3rd", loser: "4th" } : undefined}
                />
              ))}
            </div>
          );
        })}
      </section>

      {/* Debug: Raw match data */}
      <details className="bg-white/5 rounded-xl p-4">
        <summary className="text-white/60 text-sm cursor-pointer hover:text-white">
          View Raw Match Data (JSON)
        </summary>
        <pre className="mt-4 text-xs text-white/40 overflow-auto max-h-96">
          {JSON.stringify(bracket.matches, null, 2)}
        </pre>
      </details>
    </div>
  );
}

interface MatchCardProps {
  match: ReturnType<typeof useMockBracket>["matches"][0];
  highlight?: boolean;
  highlightColor?: "yellow" | "orange";
  expanded: boolean;
  onToggle: () => void;
  scoreA: number;
  scoreB: number;
  onScoreAChange: (score: number) => void;
  onScoreBChange: (score: number) => void;
  onRecordResult: (winnerId: string) => void;
  placement?: { winner: string; loser: string };
}

function MatchCard({
  match,
  highlight,
  highlightColor = "yellow",
  expanded,
  onToggle,
  scoreA,
  scoreB,
  onScoreAChange,
  onScoreBChange,
  onRecordResult,
  placement,
}: MatchCardProps) {
  const canPlay = match.team_a_id && match.team_b_id && !match.winner_id;
  const isComplete = !!match.winner_id;
  const borderColor = highlightColor === "yellow" ? "border-yellow-400/30" : "border-orange-400/30";
  const accentColor = highlightColor === "yellow" ? "text-yellow-400" : "text-orange-400";

  return (
    <div
      className={`rounded-xl overflow-hidden ${highlight ? `border ${borderColor}` : ""}`}
    >
      {/* Match header */}
      <div className="text-xs text-white/40 px-4 py-1 bg-white/5 flex justify-between items-center">
        <span>Match {match.match_number} ({match.id})</span>
        <div className="flex items-center gap-2">
          {match.is_finals && (
            <span className={accentColor}>Finals</span>
          )}
          {canPlay && (
            <button
              onClick={onToggle}
              className="flex items-center gap-1 text-green-400 hover:text-green-300"
            >
              <Play className="h-3 w-3" />
              Play
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          )}
          {isComplete && (
            <span className="text-green-400">Complete</span>
          )}
        </div>
      </div>

      {/* Teams */}
      <div className="bg-white/5">
        <div
          className={`flex justify-between items-center px-4 py-3 ${
            match.winner_id === match.team_a_id ? "bg-green-500/10" : ""
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="font-medium text-white">
              {match.team_a?.name || "TBD"}
            </span>
            {placement && match.winner_id === match.team_a_id && (
              <span className="text-xs text-green-400 bg-green-500/20 px-2 py-0.5 rounded">
                {placement.winner}
              </span>
            )}
            {placement && match.winner_id && match.winner_id !== match.team_a_id && (
              <span className="text-xs text-white/40 bg-white/10 px-2 py-0.5 rounded">
                {placement.loser}
              </span>
            )}
          </div>
          <span className="font-bold text-white">{match.score_a ?? "-"}</span>
        </div>
        <div className="h-px bg-white/10" />
        <div
          className={`flex justify-between items-center px-4 py-3 ${
            match.winner_id === match.team_b_id ? "bg-green-500/10" : ""
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="font-medium text-white">
              {match.team_b?.name || "TBD"}
            </span>
            {placement && match.winner_id === match.team_b_id && (
              <span className="text-xs text-green-400 bg-green-500/20 px-2 py-0.5 rounded">
                {placement.winner}
              </span>
            )}
            {placement && match.winner_id && match.winner_id !== match.team_b_id && (
              <span className="text-xs text-white/40 bg-white/10 px-2 py-0.5 rounded">
                {placement.loser}
              </span>
            )}
          </div>
          <span className="font-bold text-white">{match.score_b ?? "-"}</span>
        </div>
      </div>

      {/* Score entry (when expanded) */}
      {expanded && canPlay && (
        <div className="bg-white/10 p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/60 block mb-1">
                {match.team_a?.name} Score
              </label>
              <input
                type="number"
                value={scoreA}
                onChange={(e) => onScoreAChange(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-center"
              />
            </div>
            <div>
              <label className="text-xs text-white/60 block mb-1">
                {match.team_b?.name} Score
              </label>
              <input
                type="number"
                value={scoreB}
                onChange={(e) => onScoreBChange(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-center"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => match.team_a_id && onRecordResult(match.team_a_id)}
              className="py-2 bg-green-500/20 text-green-400 rounded-lg text-sm font-medium hover:bg-green-500/30"
            >
              {match.team_a?.name} Wins
            </button>
            <button
              onClick={() => match.team_b_id && onRecordResult(match.team_b_id)}
              className="py-2 bg-green-500/20 text-green-400 rounded-lg text-sm font-medium hover:bg-green-500/30"
            >
              {match.team_b?.name} Wins
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
