"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { UserPlus, Loader2 } from "lucide-react";
import { supabase } from "@/app/lib/supabase";
import { SiteHeader } from "@/app/components/SiteHeader";

function SignUpForm() {
  const searchParams = useSearchParams();
  const modelParam = searchParams.get("model");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError("Sign up is not configured. Contact support.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (err) {
        setError(err.message);
        return;
      }
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  if (!supabase) {
    return (
      <div className="min-h-screen bg-zinc-950 text-slate-200 [.light_&]:bg-white [.light_&]:text-slate-900">
        <SiteHeader />
        <main className="flex flex-1 items-center justify-center py-12">
          <p className="text-slate-500">Sign up is not available. Configure Supabase.</p>
        </main>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-zinc-950 text-slate-200 [.light_&]:bg-white [.light_&]:text-slate-900">
        <SiteHeader />
        <main className="flex flex-1 flex-col items-center justify-center gap-6 py-12 px-4">
          <div className="w-full max-w-sm rounded-xl border border-slate-700/60 bg-slate-800/50 p-6 text-center">
            <h1 className="mb-2 text-xl font-semibold text-white [.light_&]:text-slate-900">
              Check your email
            </h1>
            <p className="mb-4 text-sm text-slate-400 [.light_&]:text-slate-600">
              We sent a confirmation link to <strong>{email}</strong>. Click it to activate your
              account.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500"
            >
              Back to catalog
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-slate-200 [.light_&]:bg-white [.light_&]:text-slate-900">
      <SiteHeader />
      <main id="main-content" className="flex flex-1 items-center justify-center py-12" tabIndex={-1}>
        <div className="w-full max-w-sm rounded-xl border border-slate-700/60 bg-slate-800/50 p-6 shadow-xl">
          <div className="mb-6 flex items-center gap-2">
            <UserPlus className="h-8 w-8 text-amber-500" />
            <h1 className="text-xl font-semibold text-white [.light_&]:text-slate-900">
              Create account
            </h1>
          </div>
          {modelParam && (
            <p className="mb-4 rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-400 [.light_&]:text-amber-800">
              Sign up to select and use <strong>{modelParam}</strong> and other models.
            </p>
          )}
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-400">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-200 placeholder-slate-500 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-400">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-200 placeholder-slate-500 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 font-medium text-white hover:bg-amber-500 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Create account"
              )}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link href={`/auth/signin${modelParam ? `?model=${modelParam}` : ""}`} className="text-amber-400 hover:text-amber-300">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 [.light_&]:bg-white">
        <SiteHeader />
        <main className="flex flex-1 items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
        </main>
      </div>
    }>
      <SignUpForm />
    </Suspense>
  );
}
