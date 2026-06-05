import { useState } from "react";
import { Building2 } from "lucide-react";
import { useSessionStore } from "../../store/session.store";
import { Field, Input } from "../ui/Field";
import type { SessionUser } from "../../types/domain";

/**
 * Comptes de démonstration. En production : migrer vers Supabase Auth
 * (cf. supabase/migrations/001_rls.sql qui attend app_metadata.role).
 */
const USERS: (SessionUser & { password: string })[] = [
  { id: "dir", role: "directeur", name: "Luc", email: "luc@casacaraibes.com", password: "casa2024!", label: "Directeur" },
  { id: "noham", role: "agent", name: "Noham", email: "noham@casacaraibes.com", password: "noham2024", label: "Agent commercial" },
  { id: "steeve", role: "agent", name: "Steeve", email: "steeve@casacaraibes.com", password: "steeve2024", label: "Agent commercial" },
];

export function Login() {
  const setUser = useSessionStore((s) => s.setUser);
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");

  const submit = () => {
    const u = USERS.find((x) => x.email === email.trim().toLowerCase() && x.password === pass);
    if (u) {
      const { password: _pw, ...session } = u;
      setUser(session);
    } else setErr("Identifiants incorrects.");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-4">
      <div className="card w-[360px] p-8">
        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-lg bg-primary">
            <Building2 size={22} className="text-white" />
          </div>
          <h1 className="font-heading text-xl font-semibold text-ink">Casa Caraïbes</h1>
        </div>
        <Field label="Email">
          <Input value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
        </Field>
        <Field label="Mot de passe">
          <Input type="password" value={pass} onChange={(e) => setPass(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
        </Field>
        {err && <p className="mb-2 text-[12px] text-danger">{err}</p>}
        <button className="btn-primary mt-2 w-full justify-center" onClick={submit}>Se connecter</button>
      </div>
    </div>
  );
}
