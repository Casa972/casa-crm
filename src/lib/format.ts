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

/**
 * Barème honoraires dégressif Casa Caraïbes.
 * Taux : 8%→4% par tranche de 100k€, fixe 4% au-delà de 500k€.
 */
export const baremeHonoraires = (prix: number): number => {
  if (prix <= 0) return 8;
  if (prix <= 100_000) return 8;
  if (prix <= 200_000) return 7;
  if (prix <= 300_000) return 6;
  if (prix <= 400_000) return 5;
  return 4;
};
