"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import type { ComparisonModel } from "@/app/lib/registryNormalizer";

export type CatalogActions = {
  filterByModels: (ids: string[]) => void;
  selectModel: (model: ComparisonModel | null) => void;
};

const CatalogActionsContext = createContext<{
  actions: CatalogActions | null;
  registerActions: (actions: CatalogActions | null) => void;
}>({ actions: null, registerActions: () => {} });

export function CatalogActionsProvider({ children }: { children: ReactNode }) {
  const [actions, setActions] = useState<CatalogActions | null>(null);
  const registerActions = useCallback((a: CatalogActions | null) => {
    setActions(a);
  }, []);
  return (
    <CatalogActionsContext.Provider value={{ actions, registerActions }}>
      {children}
    </CatalogActionsContext.Provider>
  );
}

export function useCatalogActions() {
  return useContext(CatalogActionsContext);
}
