export const AGENTS_CONFIG = [
  { id: "dir",    name: "Luc" },
  { id: "noham",  name: "Noham" },
  { id: "steeve", name: "Steeve" },
] as const;

export const AGENTS_NAMES = AGENTS_CONFIG.map((a) => a.name);
