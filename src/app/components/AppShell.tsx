"use client";

import registryData from "@/data/registry.json";
import {
  normalizeRegistry,
  type ComparisonModel,
  type RawRegistryEntry,
} from "@/app/lib/registryNormalizer";
import { CatalogActionsProvider } from "@/app/lib/CatalogActionsContext";
import { CatalogChatbot } from "@/app/components/CatalogChatbot";

const models: ComparisonModel[] = normalizeRegistry(
  registryData as RawRegistryEntry[]
);

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <CatalogActionsProvider>
      {/* h-screen + overflow-hidden: layout never grows, so body never scrolls; AI panel stays fixed */}
      <div className="flex h-screen max-h-screen overflow-hidden">
        {/* Main content — scrolls independently */}
        <main
          id="main-content"
          className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden"
          tabIndex={-1}
        >
          {children}
        </main>
        {/* AI chat panel — sticks to screen, never scrolls with page */}
        <CatalogChatbot models={models} />
      </div>
    </CatalogActionsProvider>
  );
}
