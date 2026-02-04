"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { supabase } from "@/app/lib/supabase";
import { getBrowserFingerprint } from "@/app/lib/fingerprint";
import { canVote, recordVote, getCooldownRemaining } from "@/app/lib/rateLimit";

const USER_ID_KEY = "sovereign-voter-id";

function simpleHash(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    h = (h << 5) - h + c;
    h = h & h;
  }
  return Math.abs(h).toString(36);
}

function getOrCreateUserIdentifier(): string {
  if (typeof window === "undefined") return "";
  const fp = getBrowserFingerprint();
  let id = localStorage.getItem(USER_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(USER_ID_KEY, id);
  }
  return fp ? simpleHash(`${fp}|${id}`) : id;
}

type VoteData = {
  score: number;
  total: number;
  userVote: 1 | -1 | null;
};

type VoteButtonsProps = {
  modelId: string;
  compact?: boolean;
  showSentiment?: boolean;
};

export function VoteButtons({
  modelId,
  compact = false,
  showSentiment = false,
}: VoteButtonsProps) {
  const [data, setData] = useState<VoteData>({ score: 0, total: 0, userVote: null });
  const [loading, setLoading] = useState(true);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const honeypotRef = useRef<HTMLInputElement>(null);

  const fetchVotes = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    try {
      const userId = getOrCreateUserIdentifier();
      const [aggRes, userRes] = await Promise.all([
        supabase
          .from("model_votes")
          .select("vote_type")
          .eq("model_id", modelId),
        supabase
          .from("model_votes")
          .select("vote_type")
          .eq("model_id", modelId)
          .eq("user_identifier", userId)
          .maybeSingle(),
      ]);

      const votes = aggRes.data ?? [];
      const score = votes.reduce((s, r) => s + r.vote_type, 0);
      const userVote = userRes.data?.vote_type ?? null;

      setData({
        score,
        total: votes.length,
        userVote: userVote === 1 ? 1 : userVote === -1 ? -1 : null,
      });
    } catch {
      setData((d) => d);
    } finally {
      setLoading(false);
    }
  }, [modelId]);

  useEffect(() => {
    fetchVotes();
  }, [fetchVotes]);

  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const t = setInterval(() => {
      const r = getCooldownRemaining();
      setCooldownRemaining(r);
      if (r <= 0) clearInterval(t);
    }, 1000);
    return () => clearInterval(t);
  }, [cooldownRemaining]);

  const handleVote = async (voteType: 1 | -1) => {
    if (!supabase) return;

    // Honeypot: bots fill hidden fields; humans don't see them
    if (honeypotRef.current?.value) return;

    // Rate limit: 30-second cooldown between votes
    if (!canVote()) {
      setCooldownRemaining(getCooldownRemaining());
      return;
    }

    const userId = getOrCreateUserIdentifier();

    const newUserVote = data.userVote === voteType ? null : voteType;
    const delta =
      newUserVote === null
        ? -data.userVote!
        : data.userVote === null
          ? newUserVote
          : voteType - data.userVote;

    setData((prev) => ({
      score: prev.score + delta,
      total:
        prev.total +
        (newUserVote === null ? -1 : prev.userVote === null ? 1 : 0),
      userVote: newUserVote,
    }));

    try {
      if (newUserVote === null) {
        await supabase
          .from("model_votes")
          .delete()
          .eq("model_id", modelId)
          .eq("user_identifier", userId);
      } else {
        await supabase.from("model_votes").upsert(
          {
            model_id: modelId,
            user_identifier: userId,
            vote_type: newUserVote,
          },
          { onConflict: "model_id,user_identifier" }
        );
      }
      recordVote();
    } catch {
      setData((prev) => prev);
      fetchVotes();
    }
  };

  if (!supabase) return null;

  if (loading) {
    return (
      <div className="flex items-center gap-1 text-slate-500">
        <span className="text-xs">—</span>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-1"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Honeypot: hidden from humans, bots fill it */}
      <input
        ref={honeypotRef}
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="absolute -left-[9999px] w-0 h-0 opacity-0 pointer-events-none"
        aria-hidden
      />
      <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => handleVote(1)}
        className={`rounded p-0.5 transition ${
          data.userVote === 1
            ? "text-emerald-400"
            : "text-slate-500 hover:text-slate-400"
        }`}
        aria-label="Upvote"
      >
        <ThumbsUp className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
      </button>
      <span
        className="min-w-[1.5rem] text-center text-xs text-slate-500"
        title={cooldownRemaining > 0 ? `Wait ${Math.ceil(cooldownRemaining / 1000)}s` : undefined}
      >
        {data.score}
      </span>
      <button
        type="button"
        onClick={() => handleVote(-1)}
        className={`rounded p-0.5 transition ${
          data.userVote === -1
            ? "text-red-400"
            : "text-slate-500 hover:text-slate-400"
        }`}
        aria-label="Downvote"
      >
        <ThumbsDown className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
      </button>
      </div>
      {showSentiment && data.total > 0 && (
        <p className="mt-2 text-xs text-slate-500">
          {Math.round(((data.score + data.total) / (2 * data.total)) * 100)}% of
          users trust this model&apos;s residency claims
        </p>
      )}
    </div>
  );
}
