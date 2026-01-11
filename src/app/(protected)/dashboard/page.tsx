import { getProfile } from "@/lib/actions/auth";
import { getUserTeam, getAllTeams } from "@/lib/actions/team";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [profile, team, allTeams] = await Promise.all([
    getProfile(),
    getUserTeam(),
    getAllTeams(),
  ]);

  const takenTeamNames = allTeams.map((t) => t.name);

  return (
    <DashboardContent
      profile={profile}
      team={team}
      takenTeamNames={takenTeamNames}
    />
  );
}
