import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase.client";
import type { SessionUser } from "../types/domain";
import type { RoleUtilisateur } from "../schemas/enums";

const KNOWN: Record<string, Pick<SessionUser, "id" | "name" | "role" | "label">> = {
  "luc@casacaraibes.com": { id: "dir", name: "Luc", role: "directeur", label: "Directeur" },
  "noham@casacaraibes.com": { id: "noham", name: "Noham", role: "agent", label: "Agent commercial" },
  "steeve@casacaraibes.com": { id: "steeve", name: "Steeve", role: "agent", label: "Agent commercial" },
};

function roleOf(value: unknown): RoleUtilisateur {
  return value === "directeur" ? "directeur" : "agent";
}

export async function resolveSessionUser(authUser: User): Promise<SessionUser> {
  const email = (authUser.email ?? "").trim().toLowerCase();

  const { data } = await supabase
    .from("profiles")
    .select("id, email, name, role, label, legacy_id")
    .eq("id", authUser.id)
    .maybeSingle();

  if (data) {
    return {
      id: String(data.legacy_id || data.id),
      name: String(data.name || email.split("@")[0] || "Agent"),
      email: String(data.email || email),
      role: roleOf(data.role),
      label: String(data.label || (data.role === "directeur" ? "Directeur" : "Agent commercial")),
    };
  }

  const known = KNOWN[email];
  if (known) return { ...known, email };

  const metaRole = roleOf(
    (authUser.app_metadata as { role?: unknown } | undefined)?.role
      ?? (authUser.user_metadata as { role?: unknown } | undefined)?.role,
  );
  const metaName = String(
    (authUser.user_metadata as { name?: unknown } | undefined)?.name ?? email.split("@")[0] ?? "Agent",
  );
  return {
    id: authUser.id,
    name: metaName,
    email,
    role: metaRole,
    label: metaRole === "directeur" ? "Directeur" : "Agent commercial",
  };
}

export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) {
    if (error.message.toLowerCase().includes("email not confirmed")) {
      throw new Error("Email non confirmé. Dans Supabase → Authentication → Providers → Email, désactivez « Confirm email ».");
    }
    if (error.message.toLowerCase().includes("invalid login")) {
      throw new Error("Identifiants incorrects. Le compte doit exister dans Supabase → Authentication → Users.");
    }
    throw new Error(error.message);
  }
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}
