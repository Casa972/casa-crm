-- Migration 006 : ajout colonne extra_json sur la table estimations
-- Stocke les nouveaux champs du rapport d'expertise (DDT, observations, locatif, annexes…)
ALTER TABLE estimations ADD COLUMN IF NOT EXISTS extra_json jsonb DEFAULT '{}'::jsonb;
