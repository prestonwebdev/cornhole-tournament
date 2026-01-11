"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { leaveTeam } from "@/lib/actions/team";
import { useToast } from "@/components/ui/use-toast";
import { UserMinus, Loader2, ChevronRight } from "lucide-react";

export function LeaveTeamButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function handleLeave() {
    setIsLoading(true);
    const result = await leaveTeam();
    setIsLoading(false);

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Left team",
      description: "You have left the team",
    });
    router.refresh();
  }

  if (showConfirm) {
    return (
      <div className="p-4 space-y-3">
        <p className="text-sm text-white/80">Are you sure you want to leave your team?</p>
        <div className="flex gap-2">
          <button
            onClick={() => setShowConfirm(false)}
            className="flex-1 py-2 px-4 bg-white/10 rounded-lg text-white text-sm font-medium"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleLeave}
            className="flex-1 py-2 px-4 bg-red-500/20 text-red-400 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Leave Team"
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="w-full p-4 flex items-center gap-3 text-red-400 hover:bg-white/5 transition-colors"
    >
      <UserMinus className="h-5 w-5" />
      <span className="flex-1 text-left">Leave Team</span>
      <ChevronRight className="h-5 w-5 text-white/30" />
    </button>
  );
}
