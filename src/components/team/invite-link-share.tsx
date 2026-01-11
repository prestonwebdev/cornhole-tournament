"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Copy, Share2, Check } from "lucide-react";

interface InviteLinkShareProps {
  inviteToken: string;
  teamName: string;
}

export function InviteLinkShare({ inviteToken, teamName }: InviteLinkShareProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const inviteUrl = typeof window !== "undefined"
    ? `${window.location.origin}/join-team/${inviteToken}`
    : `/join-team/${inviteToken}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Share this link with your teammate",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually",
        variant: "destructive",
      });
    }
  }

  async function shareLink() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${teamName}`,
          text: `Join my team "${teamName}" for the cornhole tournament!`,
          url: inviteUrl,
        });
      } catch (err) {
        // User cancelled or share failed
        if ((err as Error).name !== "AbortError") {
          copyLink(); // Fallback to copy
        }
      }
    } else {
      copyLink(); // Fallback for browsers without Web Share API
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-white/60">
        Share this link with your teammate to invite them:
      </p>
      <div className="flex gap-2">
        <input
          value={inviteUrl}
          readOnly
          className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-mono truncate focus:outline-none focus:ring-2 focus:ring-white/20"
          onClick={(e) => (e.target as HTMLInputElement).select()}
        />
        <button
          onClick={copyLink}
          className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-colors"
          title="Copy link"
        >
          {copied ? (
            <Check className="h-5 w-5 text-green-400" />
          ) : (
            <Copy className="h-5 w-5" />
          )}
        </button>
      </div>
      <button
        onClick={shareLink}
        className="w-full py-4 bg-white text-[#1a1a1a] rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-white/90 transition-colors"
      >
        <Share2 className="h-5 w-5" />
        Share Invite Link
      </button>
    </div>
  );
}
