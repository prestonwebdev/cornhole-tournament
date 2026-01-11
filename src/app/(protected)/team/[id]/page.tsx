import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/actions/auth";
import { getTeamById } from "@/lib/actions/team";
import { InviteLinkShare } from "@/components/team/invite-link-share";
import { Users, CheckCircle, ChevronLeft, User } from "lucide-react";

interface TeamPageProps {
  params: Promise<{ id: string }>;
}

export default async function TeamPage({ params }: TeamPageProps) {
  const { id } = await params;

  const [profile, team] = await Promise.all([
    getProfile(),
    getTeamById(id),
  ]);

  if (!team) {
    notFound();
  }

  // Check if user is on this team or is admin
  const isTeamMember = profile?.id === team.player1_id || profile?.id === team.player2_id;
  const isAdmin = profile?.is_admin;

  if (!isTeamMember && !isAdmin) {
    redirect("/dashboard");
  }

  const isComplete = team.player1_id && team.player2_id;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-white/60 hover:text-white transition-colors"
      >
        <ChevronLeft className="h-5 w-5" />
        <span className="text-sm">Back</span>
      </Link>

      {/* Team Header */}
      <div className="bg-white/5 rounded-2xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
            <Users className="h-7 w-7 text-white/60" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{team.name}</h1>
            <p className="text-white/60 text-sm">
              {isComplete ? "Team complete" : "Waiting for teammate"}
            </p>
          </div>
        </div>

        {/* Team members */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-white/60 mb-3">Team Members</h3>

          {/* Player 1 */}
          <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <User className="h-5 w-5 text-white/60" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-white">
                {team.player1?.display_name || "Unknown"}
              </p>
              <p className="text-sm text-white/40">
                {team.player1?.email}
              </p>
            </div>
            <CheckCircle className="h-5 w-5 text-green-400" />
          </div>

          {/* Player 2 */}
          {team.player2 ? (
            <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <User className="h-5 w-5 text-white/60" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-white">
                  {team.player2?.display_name || "Unknown"}
                </p>
                <p className="text-sm text-white/40">
                  {team.player2?.email}
                </p>
              </div>
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 border-2 border-dashed border-white/10 rounded-xl">
              <div className="w-10 h-10 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center">
                <User className="h-5 w-5 text-white/20" />
              </div>
              <div className="flex-1">
                <p className="text-white/40">Waiting for teammate...</p>
                <p className="text-sm text-white/30">
                  Share the invite link below
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Invite link section */}
      {!team.player2 && (
        <div className="bg-white/5 rounded-2xl p-6">
          <h3 className="font-medium text-white mb-4">Invite Teammate</h3>
          <InviteLinkShare inviteToken={team.invite_token} teamName={team.name} />
        </div>
      )}

      {/* Team status */}
      {isComplete && (
        <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
          <CheckCircle className="h-6 w-6 text-green-400" />
          <div>
            <p className="font-medium text-green-400">Team Complete!</p>
            <p className="text-sm text-green-400/70">You&apos;re registered for the tournament.</p>
          </div>
        </div>
      )}
    </div>
  );
}
