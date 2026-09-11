import { Home, User, Key, FileText, ScrollText, Calendar, ExternalLink } from "lucide-react";
import { Modal } from "../ui/Modal";
import { StatusPill } from "../shared/StatusPill";
import { useAgencyData } from "../../hooks/queries/useAgencyData";
import { useDocuments } from "../../hooks/queries/useDocuments";
import { useBaux } from "../../hooks/queries/useBaux";
import { useUiStore } from "../../store/ui.store";
import { eur, fdate, daysDiff } from "../../lib/format";
import type { Bien } from "../../types/domain";

function norm(s?: string | null) {
  return (s ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function linkedToBien(bien: Bien, text?: string | null) {
  const t = norm(text);
  if (!t) return false;
  const ref = norm(bien.ref);
  const commune = norm(bien.commune);
  const adresse = norm(bien.adresse);
  return (ref.length > 1 && t.includes(ref))
    || (adresse.length > 4 && t.includes(adresse))
    || (commune.length > 2 && t.includes(commune));
}

export function DossierPanel({ bien, onClose }: { bien: Bien; onClose: () => void }) {
  const { data } = useAgencyData();
  const { data: docs = [] } = useDocuments();
  const { data: baux = [] } = useBaux();
  const setView = useUiStore((s) => s.setView);
  const setPrefill = useUiStore((s) => s.setPrefillRedacteur);
  const setFocusClient = useUiStore((s) => s.setFocusClientId);

  const mandat = data.mandats.find((m) => m.bienId === bien.id || m.bienId === bien.ref);
  const client = mandat
    ? data.clients.find((c) => c.id === mandat.clientId)
    : data.clients.find((c) => c.bienId === bien.id || c.bienId === bien.ref);

  const compromis = data.compromis.filter((c) =>
    linkedToBien(bien, `${c.bienDesc ?? ""} ${c.ref}`),
  );

  const docsLies = docs.filter((d) => linkedToBien(bien, `${d.bien ?? ""} ${d.numero ?? ""} ${d.nom}`));
  const bauxLies = baux.filter((b) =>
    linkedToBien(bien, `${b.adresseBien} ${b.commune} ${b.numero}`),
  );

  const joursMandat = mandat ? daysDiff(mandat.dateFin) : null;

  const go = (view: "redacteur" | "bail" | "valeur_locative" | "valeur_venale" | "clients" | "compte_rendu") => {
    if (view === "redacteur" && mandat) setPrefill({ docType: "mandat", sourceId: mandat.id });
    if (view === "clients" && client) setFocusClient(client.id);
    setView(view);
    onClose();
  };

  return (
    <Modal title={`Dossier ${bien.ref}`} wide onClose={onClose}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Home size={16} className="text-primary" />
              <span className="font-heading text-[16px] font-semibold text-ink">{bien.type} · {bien.commune}</span>
              <StatusPill label={bien.cat === "vente" ? "Vente" : "Location"} tone={bien.cat === "vente" ? "primary" : "emerald"} />
              <StatusPill label={bien.statut} />
            </div>
            {bien.adresse && <p className="mt-1 text-[13px] text-ink-sub">{bien.adresse}</p>}
          </div>
          <div className="text-right">
            <div className="font-heading text-xl font-semibold text-ink">{eur(bien.prix)}</div>
            <div className="text-[11px] text-ink-muted">{bien.surface ? `${bien.surface} m²` : ""}{bien.chambres ? ` · ${bien.chambres} ch.` : ""}</div>
          </div>
        </div>

        <section className="rounded-lg border border-line bg-bg p-3.5">
          <h4 className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-muted">
            <User size={12} /> Propriétaire
          </h4>
          {client || mandat ? (
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[13.5px] font-semibold text-ink">
                  {client ? `${client.prenom} ${client.nom}`.trim() : mandat?.mandant}
                </p>
                <p className="text-[12px] text-ink-sub">
                  {[client?.tel || mandat?.tel, client?.email || mandat?.email].filter(Boolean).join(" · ") || "Coordonnées absentes"}
                </p>
              </div>
              {client && (
                <button type="button" onClick={() => go("clients")} className="text-[12px] font-medium text-primary hover:underline">
                  Fiche client
                </button>
              )}
            </div>
          ) : (
            <p className="text-[13px] text-ink-muted">Aucun propriétaire lié. Créez un mandat pour rattacher le dossier.</p>
          )}
        </section>

        <section className="rounded-lg border border-line bg-bg p-3.5">
          <h4 className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-muted">
            <Key size={12} /> Mandat
          </h4>
          {mandat ? (
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-ink">{mandat.ref}</span>
                <StatusPill label={mandat.type} tone="primary" />
                <StatusPill label={mandat.statut} />
                {joursMandat !== null && joursMandat <= 30 && joursMandat >= 0 && (
                  <span className="rounded-full bg-amber-soft px-2 py-0.5 text-[10px] font-bold text-amber">{joursMandat}j restants</span>
                )}
                {joursMandat !== null && joursMandat < 0 && (
                  <span className="rounded-full bg-danger-soft px-2 py-0.5 text-[10px] font-bold text-danger">Expiré</span>
                )}
              </div>
              <p className="text-[12.5px] text-ink-sub">
                {fdate(mandat.dateDebut)} → {fdate(mandat.dateFin)} · Honoraires {mandat.honoraires}%
              </p>
              <button type="button" onClick={() => go("redacteur")} className="mt-1 inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:underline">
                <FileText size={12} /> Générer le mandat
              </button>
            </div>
          ) : (
            <p className="text-[13px] text-ink-muted">Pas de mandat. Utilisez « Nouveau mandat » depuis la liste des biens.</p>
          )}
        </section>

        {compromis.length > 0 && (
          <section className="rounded-lg border border-line bg-bg p-3.5">
            <h4 className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-muted">
              <FileText size={12} /> Vente en cours
            </h4>
            <ul className="space-y-1.5">
              {compromis.map((c) => (
                <li key={c.id} className="text-[13px] text-ink">
                  <span className="font-semibold">{c.ref}</span>
                  {c.acheteur ? ` · ${c.acheteur}` : ""} · {eur(c.prixVente)}
                  {c.dateActePrev ? ` · acte ${fdate(c.dateActePrev)}` : ""}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="rounded-lg border border-line bg-bg p-3.5">
          <h4 className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-muted">
            <ScrollText size={12} /> Documents liés
          </h4>
          {docsLies.length === 0 && bauxLies.length === 0 ? (
            <p className="text-[13px] text-ink-muted">Aucun acte ni bail rattaché à cette adresse / référence.</p>
          ) : (
            <ul className="space-y-1.5">
              {docsLies.map((d) => (
                <li key={d.id} className="text-[13px] text-ink">
                  {d.nom}{d.numero ? ` · ${d.numero}` : ""}
                </li>
              ))}
              {bauxLies.map((b) => (
                <li key={b.id} className="text-[13px] text-ink">
                  {b.typeBail}{b.numero ? ` · ${b.numero}` : ""} · {b.statut}
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="grid grid-cols-2 gap-2">
          <ActionBtn onClick={() => go("redacteur")} icon={FileText} label="Rédiger un acte" />
          <ActionBtn onClick={() => go("bail")} icon={ScrollText} label="Rédiger un bail" />
          <ActionBtn onClick={() => go("valeur_venale")} icon={Home} label="Valeur vénale" />
          <ActionBtn onClick={() => go("valeur_locative")} icon={Home} label="Valeur locative" />
          <ActionBtn onClick={() => go("compte_rendu")} icon={Calendar} label="Compte rendu" />
          {client && <ActionBtn onClick={() => go("clients")} icon={ExternalLink} label="Ouvrir le client" />}
        </div>
      </div>
    </Modal>
  );
}

function ActionBtn({
  onClick, icon: Icon, label,
}: { onClick: () => void; icon: typeof FileText; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-left text-[12.5px] font-medium text-ink-sub transition-colors hover:border-primary/40 hover:bg-primary-soft/40 hover:text-ink"
    >
      <Icon size={14} className="text-primary" />
      {label}
    </button>
  );
}
