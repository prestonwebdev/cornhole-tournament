import { redirect } from "next/navigation";
import { getUser } from "@/lib/actions/auth";
import { BottomNav } from "@/components/layout/bottom-nav";

export const dynamic = 'force-dynamic';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white pb-20">
      <main className="px-4 py-6">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
