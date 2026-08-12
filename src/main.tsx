// Polyfill Buffer pour react-pdf / fontkit (requiert l'API Node Buffer dans le navigateur)
import { Buffer } from "buffer";
if (typeof globalThis.Buffer === "undefined") {
  (globalThis as unknown as Record<string, unknown>).Buffer = Buffer;
}

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider, MutationCache } from "@tanstack/react-query";
import { toast } from "./store/toast.store";
import { App } from "./App";
import { ErrorBoundary } from "./context/ErrorBoundary";
import "./styles/globals.css";

const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (error) => {
      const msg = error instanceof Error ? error.message : "Erreur lors de la sauvegarde";
      toast.error(msg);
    },
  }),
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      // Affiche les erreurs de chargement via toast
      throwOnError: false,
    },
  },
});

const root = document.getElementById("root");
if (!root) throw new Error("Élément #root introuvable — v1.1.0");

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);
