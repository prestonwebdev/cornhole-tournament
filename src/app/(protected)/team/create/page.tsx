import { redirect } from "next/navigation";
import { getProfile } from "@/lib/actions/auth";
import { getAllTeams } from "@/lib/actions/team";
import { CreateTeamForm } from "@/components/team/create-team-form";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function CreateTeamPage() {
  const [profile, teams] = await Promise.all([
    getProfile(),
    getAllTeams(),
  ]);

  // Redirect if already on a team
  if (profile?.team_id) {
    redirect("/dashboard");
  }

  // Get list of taken team names
  const takenTeamNames = teams.map((team) => team.name);

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-white/60 hover:text-white transition-colors"
      >
        <ChevronLeft className="h-5 w-5" />
        <span className="text-sm">Back</span>
      </Link>
      <CreateTeamForm takenTeamNames={takenTeamNames} />
    </div>
  );
}
