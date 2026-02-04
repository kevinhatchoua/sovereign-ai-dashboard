"use client";

import { useState, useRef } from "react";
import { X, Send, Loader2 } from "lucide-react";
import { supabase } from "@/app/lib/supabase";

type DisputeModalProps = {
  modelId: string;
  modelName: string;
  onClose: () => void;
};

export function DisputeModal({ modelId, modelName, onClose }: DisputeModalProps) {
  const [description, setDescription] = useState("");
  const [reporterEmail, setReporterEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const honeypotRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      onClose();
      return;
    }
    if (honeypotRef.current?.value) return; // Honeypot
    if (!description.trim()) return;

    setSubmitting(true);
    try {
      await supabase.from("compliance_disputes").insert({
        model_id: modelId,
        description: description.trim(),
        reporter_email: reporterEmail.trim() || null,
      });
      setDone(true);
    } catch {
      // Show error in UI if needed
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="mx-4 w-full max-w-md rounded-xl border border-slate-700 bg-zinc-900 p-6 shadow-xl">
          <p className="text-center text-slate-200">
            Thank you. Your compliance dispute has been submitted for review.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-4 w-full rounded-lg bg-slate-700 py-2 text-sm font-medium text-white hover:bg-slate-600"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-xl border border-slate-700 bg-zinc-900 p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">
            Report Compliance Dispute
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mb-4 text-sm text-slate-400">
          Model: <span className="font-medium text-slate-300">{modelName}</span>
        </p>

        <form onSubmit={handleSubmit}>
          <input
            ref={honeypotRef}
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            className="absolute -left-[9999px] h-0 w-0 opacity-0"
            aria-hidden
          />
          <div className="mb-4">
            <label
              htmlFor="dispute-desc"
              className="mb-1 block text-sm font-medium text-slate-400"
            >
              Description *
            </label>
            <textarea
              id="dispute-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-200 placeholder-slate-500 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              placeholder="Describe the compliance issue (e.g., Terms of Service update, data residency change)..."
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="dispute-email"
              className="mb-1 block text-sm font-medium text-slate-400"
            >
              Your email (optional)
            </label>
            <input
              id="dispute-email"
              type="email"
              value={reporterEmail}
              onChange={(e) => setReporterEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-200 placeholder-slate-500 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              placeholder="For follow-up"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-600 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-amber-600 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
