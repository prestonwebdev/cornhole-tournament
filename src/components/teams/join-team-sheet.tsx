"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Users, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { joinOpenTeam } from "@/lib/actions/team";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

interface Player {
  id: string;
  display_name: string | null;
  email: string;
}

interface Team {
  id: string;
  name: string;
  player1: Player | null;
  is_open: boolean;
}

interface JoinTeamSheetProps {
  team: Team | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userHasTeam: boolean;
}

export function JoinTeamSheet({ team, open, onOpenChange, userHasTeam }: JoinTeamSheetProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  async function handleJoin() {
    if (!team) return;

    setIsLoading(true);
    const result = await joinOpenTeam(team.id);
    setIsLoading(false);

    if (result.error) {
      toast({
        title: "Failed to join team",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Joined team!",
        description: `You are now a member of ${team.name}`,
      });
      onOpenChange(false);
      router.refresh();
    }
  }

  if (!team) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom">
        <SheetHeader className="pb-4">
          <SheetTitle>Join Team</SheetTitle>
          <SheetDescription>
            This team is open for anyone to join
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {/* Team Info */}
          <motion.div
            className="bg-white/5 rounded-xl p-5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-white/60" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-lg">{team.name}</h3>
                <div className="flex items-center gap-1 text-white/40 text-sm">
                  <div className="w-3 h-3 rounded-full border-[1.5px] border-dashed border-current" />
                  <span>Open team</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-white/60 text-sm">Current member:</p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <span className="text-white/60 text-sm">
                    {team.player1?.display_name?.[0]?.toUpperCase() || "?"}
                  </span>
                </div>
                <span className="text-white">
                  {team.player1?.display_name || team.player1?.email?.split("@")[0] || "Player 1"}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Join Button */}
          {userHasTeam ? (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-center">
              <p className="text-yellow-400 text-sm">
                You're already on a team. Leave your current team first to join another.
              </p>
            </div>
          ) : (
            <motion.button
              onClick={handleJoin}
              disabled={isLoading}
              className="w-full py-4 bg-white text-[#1a1a1a] rounded-xl font-medium text-lg hover:bg-white/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Joining...
                </>
              ) : (
                "Join Team"
              )}
            </motion.button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
