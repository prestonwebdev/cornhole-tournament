"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { signUp } from "@/lib/actions/auth";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

export function SignupForm() {
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Preserve invite token in redirect
  const inviteToken = searchParams.get("token");
  const loginUrl = inviteToken ? `/login?token=${inviteToken}` : "/login";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await signUp(formData);

    // Only reaches here if there's an error (success redirects)
    setIsLoading(false);

    if (result?.error) {
      toast({
        title: "Sign up failed",
        description: result.error,
        variant: "destructive",
      });
    }
  }

  return (
    <motion.div
      className="w-full max-w-sm mx-auto"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: 0.1 }
        }
      }}
    >
      <motion.div
        className="text-center mb-8"
        variants={{
          hidden: { opacity: 0, y: -10 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
        }}
      >
        <h1 className="text-2xl font-bold text-white mb-2">Sign Up</h1>
        <p className="text-white/60 text-sm">Join the tournament happening on January 29th</p>
      </motion.div>

      <motion.form
        onSubmit={handleSubmit}
        className="space-y-6"
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
        }}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="displayName" className="block text-sm font-medium text-white/80">
              Display Name
            </label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              placeholder="Your name"
              required
              minLength={2}
              maxLength={50}
              disabled={isLoading}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent disabled:opacity-50 transition-all"
            />
            <p className="text-xs text-white/40">
              This is how other players will see you
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-white/80">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              disabled={isLoading}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent disabled:opacity-50 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-white/80">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              minLength={8}
              disabled={isLoading}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent disabled:opacity-50 transition-all"
            />
            <p className="text-xs text-white/40">
              At least 8 characters
            </p>
          </div>
        </div>

        <motion.button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 bg-white text-[#1a1a1a] rounded-xl font-medium text-lg disabled:opacity-50 flex items-center justify-center gap-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Creating account...
            </>
          ) : (
            "Sign Up"
          )}
        </motion.button>

        <p className="text-sm text-white/60 text-center">
          Already have an account?{" "}
          <Link href={loginUrl} className="text-white hover:underline">
            Log in
          </Link>
        </p>
      </motion.form>
    </motion.div>
  );
}
