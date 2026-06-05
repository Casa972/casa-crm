/** Formatage FR centralisé — utilisé par l'UI et les rapports. */

export const eur = (n: number): string =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n || 0);

export const fdate = (d: string): string =>
  d ? new Date(d + "T12:00").toLocaleDateString("fr-FR") : "—";

export const fdateShort = (d: string): string =>
  d
    ? new Date(d + "T12:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
    : "—";

/** Jours entre aujourd'hui et une date ISO (négatif = passé). */
export const daysDiff = (d: string): number | null =>
  d ? Math.round((new Date(d + "T12:00").getTime() - Date.now()) / 86_400_000) : null;
