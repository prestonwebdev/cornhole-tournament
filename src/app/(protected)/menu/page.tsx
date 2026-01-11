import { getProfile } from "@/lib/actions/auth";
import { getUserTeam } from "@/lib/actions/team";
import { MenuContent } from "@/components/menu/menu-content";

export const dynamic = 'force-dynamic';

export default async function MenuPage() {
  const [profile, team] = await Promise.all([
    getProfile(),
    getUserTeam(),
  ]);

  return (
    <MenuContent
      profile={profile}
      team={team}
    />
  );
}
