import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <div className="fixed top-0 left-0 p-4">
        <Link
          href="/"
          className="flex items-center gap-1 text-white/60 hover:text-white transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="text-sm">Back</span>
        </Link>
      </div>
      {children}
    </div>
  );
}
