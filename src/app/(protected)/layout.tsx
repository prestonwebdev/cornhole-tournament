import { BottomNav } from "@/components/layout/bottom-nav";

// Auth is handled by middleware - no need for redundant check here
// This allows the layout to render faster on navigation

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white pb-20">
      <main className="px-4 py-6">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
