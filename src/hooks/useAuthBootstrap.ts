import { useEffect } from "react";
import { supabase } from "../services/supabase.client";
import { resolveSessionUser } from "../services/auth.service";
import { useSessionStore } from "../store/session.store";

export function useAuthBootstrap() {
  const setUser = useSessionStore((s) => s.setUser);
  const setReady = useSessionStore((s) => s.setReady);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      void (async () => {
        if (!session?.user) {
          setUser(null);
          setReady(true);
          return;
        }
        try {
          const profile = await resolveSessionUser(session.user);
          setUser(profile);
        } catch {
          setUser({
            id: session.user.id,
            name: session.user.email?.split("@")[0] ?? "Agent",
            email: session.user.email ?? "",
            role: "agent",
            label: "Agent commercial",
          });
        } finally {
          setReady(true);
        }
      })();
    });
    return () => data.subscription.unsubscribe();
  }, [setUser, setReady]);
}
