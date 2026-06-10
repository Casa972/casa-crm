import { z } from "zod";

export const ficheCommercialeSchema = z.object({
  bienId: z.string(),

  // Description commerciale
  titreFiche: z.string().default(""),
  descriptionCommerciale: z.string().default(""),
  pointsForts: z.array(z.string()).default([]),

  // Photos (base64)
  photoPrincipale: z.string().default(""),
  photos: z.array(z.string()).default([]),

  // Infos pratiques
  dpe: z.string().default(""),
  ges: z.string().default(""),
  taxeFonciere: z.coerce.number().default(0),
  chargesCopro: z.coerce.number().default(0),
  anneeConstruction: z.string().default(""),
  chauffage: z.string().default(""),
  exposition: z.string().default(""),
  vue: z.string().default(""),
  digicode: z.string().default(""),
  contactNom: z.string().default("M. Luc CLEMENTE"),
  contactTel: z.string().default("0696 XX XX XX"),
  contactEmail: z.string().default("contact@casacaraibes.com"),
});

export type FicheCommerciale = z.infer<typeof ficheCommercialeSchema>;

export const POINTS_FORTS_SUGERES = [
  "Vue mer", "Vue montagne", "Vue dégagée", "Exposition sud", "Exposition est",
  "Piscine privée", "Jardin", "Grande terrasse", "Accès direct plage",
  "Vendu meublé", "Clé en main", "Aucuns travaux", "Rénové récemment",
  "Cave privative", "Parking sécurisé", "Gardiennage", "Résidence fermée",
  "Potentiel locatif saisonnier", "Rentabilité immédiate", "Idéal investisseur",
  "Proximité commerces", "Proche bourg", "Accès marina",
];
