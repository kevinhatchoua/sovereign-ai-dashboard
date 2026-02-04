"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  LogOut,
  Check,
  X,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { supabase } from "@/app/lib/supabase";

type Dispute = {
  id: string;
  model_id: string;
  description: string;
  reporter_email: string | null;
  status: string;
  created_at: string;
};

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        router.replace("/admin/login");
        return;
      }
      setUser(session.user as { email?: string });
      fetchDisputes();
    });
  }, [router]);

  const fetchDisputes = async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from("compliance_disputes")
      .select("id, model_id, description, reporter_email, status, created_at")
      .order("created_at", { ascending: false });
    if (!error) setDisputes(data ?? []);
    setLoading(false);
  };

  const handleResolve = async (
    disputeId: string,
    status: "approved" | "rejected"
  ) => {
    if (!supabase || !user) return;
    setActioning(disputeId);
    try {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) return;
      await supabase.from("compliance_disputes").update({
        status,
        resolved_at: new Date().toISOString(),
        resolved_by: u.id,
      }).eq("id", disputeId);

      await supabase.from("security_log").insert({
        admin_id: u.id,
        admin_email: u.email,
        action: `dispute_${status}`,
        details: { dispute_id: disputeId },
      });

      setDisputes((prev) =>
        prev.map((d) =>
          d.id === disputeId ? { ...d, status } : d
        )
      );
    } catch {
      // RLS may block if not in admin_emails
    } finally {
      setActioning(null);
    }
  };

  const signOut = async () => {
    await supabase?.auth.signOut();
    router.replace("/admin/login");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    );
  }

  const pending = disputes.filter((d) => d.status === "pending");

  return (
    <div className="min-h-screen bg-zinc-950 text-slate-200">
      <header className="border-b border-slate-800 bg-zinc-900/50">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <h1 className="flex items-center gap-2 text-xl font-semibold text-white">
            <Shield className="h-6 w-6 text-amber-500" />
            Admin Dashboard
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400">{user?.email}</span>
            <button
              type="button"
              onClick={signOut}
              className="flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-medium text-slate-300">
            <AlertCircle className="h-5 w-5" />
            Pending Disputes ({pending.length})
          </h2>
          {pending.length === 0 ? (
            <p className="rounded-xl border border-slate-700/60 bg-slate-800/30 p-8 text-center text-slate-500">
              No pending compliance disputes.
            </p>
          ) : (
            <ul className="space-y-4">
              {pending.map((d) => (
                <li
                  key={d.id}
                  className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-4"
                >
                  <div className="mb-2 flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-white">{d.model_id}</p>
                      <p className="mt-1 text-sm text-slate-400">{d.description}</p>
                      {d.reporter_email && (
                        <p className="mt-1 text-xs text-slate-500">
                          Reporter: {d.reporter_email}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-slate-500">
                        {new Date(d.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => handleResolve(d.id, "approved")}
                        disabled={actioning === d.id}
                        className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                      >
                        {actioning === d.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResolve(d.id, "rejected")}
                        disabled={actioning === d.id}
                        className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
                      >
                        <X className="h-4 w-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {disputes.filter((d) => d.status !== "pending").length > 0 && (
          <section className="mt-8">
            <h2 className="mb-4 text-lg font-medium text-slate-300">
              Resolved ({disputes.filter((d) => d.status !== "pending").length})
            </h2>
            <ul className="space-y-2">
              {disputes
                .filter((d) => d.status !== "pending")
                .map((d) => (
                  <li
                    key={d.id}
                    className="flex items-center justify-between rounded-lg border border-slate-700/40 bg-slate-800/30 px-4 py-2 text-sm"
                  >
                    <span className="text-slate-400">{d.model_id}</span>
                    <span
                      className={
                        d.status === "approved"
                          ? "text-emerald-400"
                          : "text-red-400"
                      }
                    >
                      {d.status}
                    </span>
                  </li>
                ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
