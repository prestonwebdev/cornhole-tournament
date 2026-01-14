import { getTeamByToken, getUserTeam } from "@/lib/actions/team";
import { getUser } from "@/lib/actions/auth";
import { JoinTeamHandler } from "@/components/team/join-team-handler";

interface JoinTeamPageProps {
  params: Promise<{ token: string }>;
}

export default async function JoinTeamPage({ params }: JoinTeamPageProps) {
  const { token } = await params;

  // Fetch team and user data in parallel
  const [team, user, userTeam] = await Promise.all([
    getTeamByToken(token),
    getUser(),
    getUserTeam(),
  ]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#1a1a1a]">
      <JoinTeamHandler
        team={team}
        token={token}
        isLoggedIn={!!user}
        currentUserId={user?.id}
        userTeam={userTeam}
      />
    </div>
  );
}
