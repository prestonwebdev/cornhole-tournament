"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { User, Users, BookOpen, ChevronRight } from "lucide-react";
import { LeaveTeamButton } from "@/components/menu/leave-team-button";
import { SignOutButton } from "@/components/menu/sign-out-button";
import { RulesSheet } from "@/components/menu/rules-sheet";

interface Profile {
  id: string;
  display_name: string | null;
  email: string;
}

interface Player {
  id: string;
  display_name: string | null;
  email: string;
}

interface Team {
  name: string;
  player1: Player | null;
  player2: Player | null;
}

interface MenuContentProps {
  profile: Profile | null;
  team: Team | null;
}

export function MenuContent({ profile, team }: MenuContentProps) {
  const [rulesSheetOpen, setRulesSheetOpen] = useState(false);

  // Get display name with multiple fallbacks
  // Priority: team player data (most reliable) -> profile -> email username
  const getDisplayName = () => {
    // First try team player data
    if (team && profile) {
      if (team.player1?.id === profile.id) {
        if (team.player1.display_name) return team.player1.display_name;
        if (team.player1.email) return team.player1.email.split("@")[0];
      }
      if (team.player2?.id === profile.id) {
        if (team.player2.display_name) return team.player2.display_name;
        if (team.player2.email) return team.player2.email.split("@")[0];
      }
    }
    // Then try profile data
    if (profile?.display_name) return profile.display_name;
    if (profile?.email) return profile.email.split("@")[0];
    return "Player";
  };
  const displayName = getDisplayName();

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
        <h1 className="text-2xl font-bold text-white">Menu</h1>
      </motion.div>

      {/* Profile Card */}
      <motion.div
        className="bg-white/5 rounded-2xl p-6"
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
        }}
      >
        <div className="flex items-center gap-4">
          <motion.div
            className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
          >
            <User className="h-8 w-8 text-white/60" />
          </motion.div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-white">{displayName}</h2>
            <p className="text-white/60 text-sm">{profile?.email}</p>
          </div>
        </div>
      </motion.div>

      {/* Team Section */}
      {team && (
        <motion.div
          className="bg-white/5 rounded-2xl overflow-hidden"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.1 } }
          }}
        >
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-white/60" />
              <div>
                <p className="text-sm text-white/60">Your Team</p>
                <p className="font-semibold text-white">{team.name}</p>
              </div>
            </div>
          </div>
          <LeaveTeamButton />
        </motion.div>
      )}

      {/* Rules */}
      <motion.div
        className="bg-white/5 rounded-2xl overflow-hidden"
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.2 } }
        }}
      >
        <button
          onClick={() => setRulesSheetOpen(true)}
          className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-white/60" />
            <span className="text-white">Cornhole Rules</span>
          </div>
          <ChevronRight className="h-5 w-5 text-white/40" />
        </button>
      </motion.div>

      {/* Actions */}
      <motion.div
        className="bg-white/5 rounded-2xl overflow-hidden"
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.3 } }
        }}
      >
        <SignOutButton />
      </motion.div>

      {/* App Info */}
      <motion.div
        className="text-center pt-4"
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { duration: 0.5, delay: 0.4 } }
        }}
      >
        <p className="text-white/30 text-xs">Copperbend Cornhole Tournament</p>
        <p className="text-white/20 text-xs mt-1">Version 1.0</p>
      </motion.div>

      <RulesSheet open={rulesSheetOpen} onOpenChange={setRulesSheetOpen} />
    </motion.div>
  );
}
