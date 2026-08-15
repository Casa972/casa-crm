import { useEffect, useRef, useState } from "react";
import type { Estimation } from "../schemas/estimation.schema";

interface UseAutosaveOptions {
  estimation: Estimation;
  onSave: (e: Estimation) => void;
  intervalMs?: number;
  enabled?: boolean;
}

/**
 * Sauvegarde automatique en brouillon toutes les 30 secondes.
 * Ne sauvegarde que si le contenu a changé depuis la dernière sauvegarde.
 */
export function useAutosave({ estimation, onSave, intervalMs = 30_000, enabled = true }: UseAutosaveOptions) {
  const lastSaved = useRef<string>(JSON.stringify(estimation));
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(() => {
      const current = JSON.stringify(estimation);
      if (current === lastSaved.current) return;
      setSaving(true);
      onSave({ ...estimation, statut: "Brouillon" });
      lastSaved.current = current;
      setLastSavedAt(new Date());
      timerRef.current = setTimeout(() => setSaving(false), 800);
    }, intervalMs);
    return () => {
      clearInterval(interval);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [estimation, onSave, intervalMs, enabled]);

  const saveNow = () => {
    setSaving(true);
    onSave({ ...estimation, statut: "Brouillon" });
    lastSaved.current = JSON.stringify(estimation);
    setLastSavedAt(new Date());
    timerRef.current = setTimeout(() => setSaving(false), 800);
  };

  return { lastSavedAt, saving, saveNow };
}
