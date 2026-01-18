"use client";

import { motion } from "motion/react";
import { Trophy, Medal, XCircle } from "lucide-react";
import Link from "next/link";

interface TournamentStatusProps {
  placement: 1 | 2 | 3 | 4 | null;
  isEliminated: boolean;
  teamName?: string;
}

const placementConfig = {
  1: {
    label: "Champions!",
    icon: Trophy,
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/20",
    borderColor: "border-yellow-400/30",
    gradient: "from-yellow-500/20 to-yellow-500/5",
  },
  2: {
    label: "2nd Place",
    icon: Medal,
    color: "text-gray-300",
    bgColor: "bg-gray-400/20",
    borderColor: "border-gray-400/30",
    gradient: "from-gray-400/20 to-gray-400/5",
  },
  3: {
    label: "3rd Place",
    icon: Medal,
    color: "text-orange-400",
    bgColor: "bg-orange-500/20",
    borderColor: "border-orange-400/30",
    gradient: "from-orange-500/20 to-orange-500/5",
  },
  4: {
    label: "4th Place",
    icon: Medal,
    color: "text-orange-300",
    bgColor: "bg-orange-400/20",
    borderColor: "border-orange-400/30",
    gradient: "from-orange-400/20 to-orange-400/5",
  },
};

export function TournamentStatus({ placement, isEliminated, teamName }: TournamentStatusProps) {
  // Show placement trophy/medal
  if (placement) {
    const config = placementConfig[placement];
    const Icon = config.icon;

    return (
      <motion.div
        className={`bg-gradient-to-br ${config.gradient} rounded-2xl p-6 space-y-4 border ${config.borderColor}`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
      >
        <div className="flex flex-col items-center text-center space-y-3">
          <motion.div
            className={`w-20 h-20 rounded-full ${config.bgColor} flex items-center justify-center`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
          >
            <Icon className={`h-10 w-10 ${config.color}`} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <p className={`text-3xl font-bold ${config.color}`}>{config.label}</p>
            {teamName && (
              <p className="text-white/60 text-sm mt-1">{teamName}</p>
            )}
          </motion.div>

          <motion.p
            className="text-white/40 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Tournament Complete
          </motion.p>
        </div>

        <Link
          href="/bracket"
          className="block text-center text-white/60 hover:text-white text-sm transition-colors"
        >
          View final bracket
        </Link>
      </motion.div>
    );
  }

  // Show eliminated state
  if (isEliminated) {
    return (
      <motion.div
        className="bg-gradient-to-br from-red-500/10 to-red-500/5 rounded-2xl p-6 space-y-4 border border-red-400/20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col items-center text-center space-y-3">
          <motion.div
            className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
          >
            <XCircle className="h-8 w-8 text-red-400" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-xl font-semibold text-white">Eliminated</p>
            <p className="text-white/60 text-sm mt-1">
              Better luck next time!
            </p>
          </motion.div>
        </div>

        <Link
          href="/bracket"
          className="block text-center text-white/60 hover:text-white text-sm transition-colors"
        >
          Watch remaining matches
        </Link>
      </motion.div>
    );
  }

  // This shouldn't happen normally, but return null if neither condition
  return null;
}
