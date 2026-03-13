"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn, Loader2 } from "lucide-react";
import { supabase } from "@/app/lib/supabase";
import { SiteHeader } from "@/app/components/SiteHeader";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/";
  const modelParam = searchParams.get("model");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setError("");
    setLoading(true);
    try {
      const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) {
        setError(err.message);
        return;
      }
      if (data.session) {
        const url = modelParam ? `${redirect}?model=${modelParam}` : redirect;
        router.replace(url);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!supabase) {
    return (
      <div className="min-h-screen bg-zinc-950 text-slate-200 [.light_&]:bg-white [.light_&]:text-slate-900">
        <SiteHeader />
        <main className="flex flex-1 items-center justify-center py-12">
          <p className="text-slate-500">Sign in is not available.</p>
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
            <LogIn className="h-8 w-8 text-amber-500" />
            <h1 className="text-xl font-semibold text-white [.light_&]:text-slate-900">Sign in</h1>
          </div>
          {modelParam && (
            <p className="mb-4 rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-400 [.light_&]:text-amber-800">
              Sign in to select and use <strong>{modelParam}</strong>.
            </p>
          )}
          <form onSubmit={handleSignIn} className="space-y-4">
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
                autoComplete="current-password"
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-200 placeholder-slate-500 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 font-medium text-white hover:bg-amber-500 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <Link
              href={`/auth/signup${modelParam ? `?model=${modelParam}` : ""}`}
              className="text-amber-400 hover:text-amber-300"
            >
              Sign up
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 [.light_&]:bg-white">
        <SiteHeader />
        <main className="flex flex-1 items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
        </main>
      </div>
    }>
      <SignInForm />
    </Suspense>
  );
}
