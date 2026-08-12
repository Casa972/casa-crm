-- Ajout des colonnes participant et rappel sur la table rdv
ALTER TABLE public.rdv
  ADD COLUMN IF NOT EXISTS participant_nom text,
  ADD COLUMN IF NOT EXISTS rappel_minutes integer;
