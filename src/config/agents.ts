export const AGENTS_CONFIG = [
  { id: "dir",    name: "Luc",    formalName: "M. Luc CLEMENTE" },
  { id: "noham",  name: "Noham",  formalName: "M. Noham BODARD" },
  { id: "steeve", name: "Steeve", formalName: "M. Steeve" },
] as const;

export const AGENTS_NAMES = AGENTS_CONFIG.map((a) => a.name);

export const agentFormal = (id: string): string =>
  (AGENTS_CONFIG as readonly { id: string; formalName: string }[]).find(a => a.id === id)?.formalName ?? "";
