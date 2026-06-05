import { useState } from "react";
import { Field, Input } from "../ui/Field";
import { PageHeader } from "../shared/PageHeader";
import { eur } from "../../lib/format";

export function CalculatriceView() {
  const [capital, setCapital] = useState("200000");
  const [taux, setTaux] = useState("3.5");
  const [duree, setDuree] = useState("20");

  const M = Number(capital), t = Number(taux) / 100 / 12, n = Number(duree) * 12;
  const mensualite = M && t && n ? Math.round((M * t * Math.pow(1 + t, n)) / (Math.pow(1 + t, n) - 1)) : 0;
  const total = mensualite * n;
  const interets = total - M;

  return (
    <div className="mx-auto max-w-[500px] px-6 py-6">
      <PageHeader title="Simulateur de crédit" subtitle="Estimation rapide hors assurance." />
      <div className="card space-y-1 p-5">
        <Field label="Capital emprunté (€)"><Input type="number" value={capital} onChange={(e) => setCapital(e.target.value)} /></Field>
        <Field label="Taux d'intérêt (%)"><Input type="number" value={taux} onChange={(e) => setTaux(e.target.value)} /></Field>
        <Field label="Durée (ans)"><Input type="number" value={duree} onChange={(e) => setDuree(e.target.value)} /></Field>
      </div>
      <div className="card mt-4 bg-primary-soft p-5 text-center">
        <div className="text-xs font-semibold uppercase tracking-wide text-primary">Mensualité estimée</div>
        <div className="mt-1 font-heading text-3xl font-semibold text-primary">{eur(mensualite)}<span className="text-base">/mois</span></div>
        <div className="mt-3 flex justify-around border-t border-primary/15 pt-3 text-xs text-ink-sub">
          <div>Coût total<br /><b className="text-ink">{eur(total)}</b></div>
          <div>Dont intérêts<br /><b className="text-ink">{eur(interets)}</b></div>
        </div>
      </div>
    </div>
  );
}
