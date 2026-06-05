import { Component, type ErrorInfo, type ReactNode } from "react";
import { ApiError } from "../services/api";

interface Props { children: ReactNode; }
interface State { error: Error | null; }

/** Capture les erreurs de rendu / API et affiche un écran de secours propre. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Point de branchement pour un logger (Sentry…)
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    const isApi = error instanceof ApiError;
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-bg p-6 text-center">
        <h1 className="font-heading text-xl font-semibold text-ink">Une erreur est survenue</h1>
        <p className="max-w-md text-sm text-ink-sub">
          {isApi
            ? `Opération « ${error.operation} » sur « ${error.table} » impossible. Vérifiez votre connexion ou réessayez.`
            : error.message}
        </p>
        <button className="btn-primary" onClick={() => this.setState({ error: null })}>
          Réessayer
        </button>
      </div>
    );
  }
}
