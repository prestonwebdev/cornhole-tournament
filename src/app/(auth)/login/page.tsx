import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Suspense
        fallback={
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-white/40" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
