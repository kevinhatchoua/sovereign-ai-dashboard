"use client";

import { X } from "lucide-react";
import type { ComparisonModel } from "@/app/lib/registryNormalizer";
import {
  canGuestSelect,
  requiresPremium,
} from "@/app/lib/accessTiers";
import type { User } from "@/app/lib/AuthContext";

type SelectModelModalProps = {
  model: ComparisonModel;
  user: User | null;
  onClose: () => void;
};

export function SelectModelModal({ model, user, onClose }: SelectModelModalProps) {
  const isGuest = !user;
  const needsSignup = isGuest && !canGuestSelect(model.id);
  const needsPremium = requiresPremium(model.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Select ${model.name}`}
        className="glass-strong relative w-full max-w-md rounded-2xl border border-slate-700/50 p-6 shadow-2xl [.light_&]:border-slate-200/60"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded p-2 text-slate-400 hover:bg-slate-800 hover:text-white [.light_&]:hover:bg-slate-100 [.light_&]:hover:text-slate-900"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="mb-2 pr-8 text-lg font-semibold text-white [.light_&]:text-slate-900">
          Select {model.name}
        </h2>
        <p className="mb-4 text-sm text-slate-400 [.light_&]:text-slate-600">
          {model.provider} • {model.openness_level}
        </p>

        {needsPremium ? (
          <>
            <p className="mb-4 rounded-lg bg-slate-500/10 px-3 py-2 text-sm text-slate-400 [.light_&]:text-slate-700">
              This model requires a premium subscription. Upgrade options are not currently available.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-600 py-2 text-sm text-slate-400 hover:bg-slate-800 [.light_&]:text-slate-600 [.light_&]:hover:bg-slate-100"
            >
              Close
            </button>
          </>
        ) : needsSignup ? (
          <>
            <p className="mb-4 rounded-lg bg-slate-500/10 px-3 py-2 text-sm text-slate-400 [.light_&]:text-slate-700">
              This model requires an account. Account creation is not currently available.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-600 py-2 text-sm text-slate-400 hover:bg-slate-800 [.light_&]:text-slate-600 [.light_&]:hover:bg-slate-100"
            >
              Close
            </button>
          </>
        ) : (
          <>
            <p className="mb-4 text-sm text-slate-300 [.light_&]:text-slate-600">
              {user
                ? "You have access to this model. Add it to your workspace or start using it."
                : "This model is available for you to try. Select it to get started."}
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white hover:bg-emerald-500"
              >
                Got it
              </button>
              <p className="text-center text-xs text-slate-500">
                Model selection will be saved to your workspace when that feature is available.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
