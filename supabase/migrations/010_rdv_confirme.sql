-- Confirmation RDV par le commercial (depuis l'email)
ALTER TABLE public.rdv
  ADD COLUMN IF NOT EXISTS confirme boolean;
