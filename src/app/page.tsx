import Link from "next/link";
import Image from "next/image";
import { getUser } from "@/lib/actions/auth";
import { redirect } from "next/navigation";
import { LandingContent } from "@/components/animations/landing-animations";

export default async function HomePage() {
  const user = await getUser();

  // If logged in, go straight to dashboard
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col overflow-hidden">
      <LandingContent />
    </div>
  );
}
