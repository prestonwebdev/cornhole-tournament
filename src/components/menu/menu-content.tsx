"use client";

import { motion } from "motion/react";
import { User, Users } from "lucide-react";
import { LeaveTeamButton } from "@/components/menu/leave-team-button";
import { SignOutButton } from "@/components/menu/sign-out-button";

interface Profile {
  display_name: string | null;
  email: string;
}

interface Team {
  name: string;
}

interface MenuContentProps {
  profile: Profile | null;
  team: Team | null;
}

export function MenuContent({ profile, team }: MenuContentProps) {
  // Get display name with multiple fallbacks
  const getDisplayName = () => {
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

      {/* Actions */}
      <motion.div
        className="bg-white/5 rounded-2xl overflow-hidden"
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.2 } }
        }}
      >
        <SignOutButton />
      </motion.div>

      {/* App Info */}
      <motion.div
        className="text-center pt-4"
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { duration: 0.5, delay: 0.3 } }
        }}
      >
        <p className="text-white/30 text-xs">Copperbend Cornhole Tournament</p>
        <p className="text-white/20 text-xs mt-1">Version 1.0</p>
      </motion.div>
    </motion.div>
  );
}
