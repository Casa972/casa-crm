import { useState } from "react";
import { Field, Input } from "../ui/Field";
import { signIn } from "../../services/auth.service";
import logo from "../../assets/logo.png";

export function Login() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setErr("");
    setBusy(true);
    try {
      await signIn(email, pass);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Connexion impossible.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-4">
      <div className="card w-[360px] p-8">
        <div className="mb-6 flex flex-col items-center gap-3">
          <img src={logo} alt="Casa Caraïbes" className="h-12 w-auto object-contain" />
          <p className="text-center text-[12px] text-ink-muted">Connexion agence</p>
        </div>
        <Field label="Email">
          <Input
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void submit()}
          />
        </Field>
        <Field label="Mot de passe">
          <Input
            type="password"
            autoComplete="current-password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void submit()}
          />
        </Field>
        {err && <p className="mb-2 text-[12px] text-danger">{err}</p>}
        <button className="btn-primary mt-2 w-full justify-center" disabled={busy} onClick={() => void submit()}>
          {busy ? "Connexion…" : "Se connecter"}
        </button>
      </div>
    </div>
  );
}
