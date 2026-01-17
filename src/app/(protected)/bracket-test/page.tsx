"use client";

import { useState } from "react";
import { useMockBracket, type BracketScenario } from "@/lib/test-data";
import { Trophy, RotateCcw, Play, ChevronDown, ChevronUp } from "lucide-react";

export default function BracketTestPage() {
  const bracket = useMockBracket("8-team-fresh");
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);
  const [scoreA, setScoreA] = useState(21);
  const [scoreB, setScoreB] = useState(15);

  const winnersMatches = bracket.getWinnersMatches();
  const losersMatches = bracket.getLosersMatches();
  const grandFinals = bracket.getGrandFinals();
  const pendingMatches = bracket.getPendingMatches();
  const completedMatches = bracket.getCompletedMatches();

  // Group winners matches by round
  const winnersRounds = winnersMatches.reduce((acc, match) => {
    if (!acc[match.round_number]) acc[match.round_number] = [];
    acc[match.round_number].push(match);
    return acc;
  }, {} as Record<number, typeof winnersMatches>);

  // Group losers matches by round
  const losersRounds = losersMatches.reduce((acc, match) => {
    if (!acc[match.round_number]) acc[match.round_number] = [];
    acc[match.round_number].push(match);
    return acc;
  }, {} as Record<number, typeof losersMatches>);

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="pt-4">
        <h1 className="text-2xl font-bold text-white">Bracket Test Playground</h1>
        <p className="text-white/60 text-sm">
          Test bracket logic with mock data (no database changes)
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

      {/* Winners Bracket */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-400" />
          <h2 className="text-sm font-medium text-white/80">Winners Bracket</h2>
        </div>

        {Object.entries(winnersRounds).map(([round, matches]) => (
          <div key={`winners-${round}`} className="space-y-2">
            <p className="text-xs text-white/40 pl-2">Round {round}</p>
            {matches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
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
              />
            ))}
          </div>
        ))}
      </section>

      {/* Losers Bracket */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-400" />
          <h2 className="text-sm font-medium text-white/80">Losers Bracket</h2>
        </div>

        {Object.entries(losersRounds).map(([round, matches]) => (
          <div key={`losers-${round}`} className="space-y-2">
            <p className="text-xs text-white/40 pl-2">Round {round}</p>
            {matches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
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
              />
            ))}
          </div>
        ))}
      </section>

      {/* Grand Finals */}
      {grandFinals.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-400" />
            <h2 className="text-sm font-medium text-white/80">Grand Finals</h2>
          </div>
          {grandFinals.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              highlight
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
            />
          ))}
        </section>
      )}

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
  expanded: boolean;
  onToggle: () => void;
  scoreA: number;
  scoreB: number;
  onScoreAChange: (score: number) => void;
  onScoreBChange: (score: number) => void;
  onRecordResult: (winnerId: string) => void;
}

function MatchCard({
  match,
  highlight,
  expanded,
  onToggle,
  scoreA,
  scoreB,
  onScoreAChange,
  onScoreBChange,
  onRecordResult,
}: MatchCardProps) {
  const canPlay = match.team_a_id && match.team_b_id && !match.winner_id;
  const isComplete = !!match.winner_id;

  return (
    <div
      className={`rounded-xl overflow-hidden ${highlight ? "border border-yellow-400/30" : ""}`}
    >
      {/* Match header */}
      <div className="text-xs text-white/40 px-4 py-1 bg-white/5 flex justify-between items-center">
        <span>Match {match.match_number} ({match.id})</span>
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

      {/* Teams */}
      <div className="bg-white/5">
        <div
          className={`flex justify-between items-center px-4 py-3 ${
            match.winner_id === match.team_a_id ? "bg-green-500/10" : ""
          }`}
        >
          <span className="font-medium text-white">
            {match.team_a?.name || "TBD"}
          </span>
          <span className="font-bold text-white">{match.score_a ?? "-"}</span>
        </div>
        <div className="h-px bg-white/10" />
        <div
          className={`flex justify-between items-center px-4 py-3 ${
            match.winner_id === match.team_b_id ? "bg-green-500/10" : ""
          }`}
        >
          <span className="font-medium text-white">
            {match.team_b?.name || "TBD"}
          </span>
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
