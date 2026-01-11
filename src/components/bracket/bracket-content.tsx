"use client";

import { motion } from "motion/react";
import { Trophy, Clock } from "lucide-react";
import type { Match } from "@/lib/types/database";

type MatchWithTeams = Match & {
  team_a: { id: string; name: string } | null;
  team_b: { id: string; name: string } | null;
  winner: { id: string; name: string } | null;
};

interface BracketContentProps {
  matches: MatchWithTeams[];
}

export function BracketContent({ matches }: BracketContentProps) {
  // Group matches by bracket type and round
  const winnersMatches = matches.filter(m => m.bracket_type === "winners");
  const losersMatches = matches.filter(m => m.bracket_type === "losers");
  const grandFinals = matches.filter(m => m.bracket_type === "grand_finals");

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
          Double Elimination · {matches.length} match{matches.length !== 1 ? "es" : ""}
        </p>
      </motion.div>

      {/* Winners Bracket */}
      <motion.section
        className="space-y-3"
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
        }}
      >
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-400" />
          <h2 className="text-sm font-medium text-white/80">Winners Bracket</h2>
        </div>
        <div className="space-y-2">
          {winnersMatches.length === 0 ? (
            <p className="text-white/40 text-sm">No matches yet</p>
          ) : (
            winnersMatches.map((match, index) => (
              <MatchCard key={match.id} match={match} index={index} />
            ))
          )}
        </div>
      </motion.section>

      {/* Losers Bracket */}
      <motion.section
        className="space-y-3"
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.1 } }
        }}
      >
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-400" />
          <h2 className="text-sm font-medium text-white/80">Losers Bracket</h2>
        </div>
        <div className="space-y-2">
          {losersMatches.length === 0 ? (
            <p className="text-white/40 text-sm">No matches yet</p>
          ) : (
            losersMatches.map((match, index) => (
              <MatchCard key={match.id} match={match} index={index} />
            ))
          )}
        </div>
      </motion.section>

      {/* Grand Finals */}
      {grandFinals.length > 0 && (
        <motion.section
          className="space-y-3"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.2 } }
          }}
        >
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-400" />
            <h2 className="text-sm font-medium text-white/80">Grand Finals</h2>
          </div>
          <div className="space-y-2">
            {grandFinals.map((match, index) => (
              <MatchCard key={match.id} match={match} highlight index={index} />
            ))}
          </div>
        </motion.section>
      )}
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

function MatchCard({ match, highlight, index }: { match: MatchWithTeams; highlight?: boolean; index: number }) {
  return (
    <motion.div
      className={`rounded-xl overflow-hidden ${highlight ? "border border-yellow-400/30" : ""}`}
      initial={{ opacity: 0, x: -15 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ scale: 1.01 }}
    >
      <div className="text-xs text-white/40 px-4 py-1 bg-white/5">
        Round {match.round_number} - Match {match.match_number}
      </div>
      <div className="bg-white/5">
        <div className={`flex justify-between items-center px-4 py-3 transition-colors ${match.winner_id === match.team_a_id ? "bg-green-500/10" : ""}`}>
          <span className="font-medium text-white">{match.team_a?.name || "TBD"}</span>
          <span className="font-bold text-white">{match.score_a ?? "-"}</span>
        </div>
        <div className="h-px bg-white/10" />
        <div className={`flex justify-between items-center px-4 py-3 transition-colors ${match.winner_id === match.team_b_id ? "bg-green-500/10" : ""}`}>
          <span className="font-medium text-white">{match.team_b?.name || "TBD"}</span>
          <span className="font-bold text-white">{match.score_b ?? "-"}</span>
        </div>
      </div>
    </motion.div>
  );
}
