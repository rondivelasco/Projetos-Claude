import type { MeaningLayer, MeaningType } from "@/types";

// ─── Word detection helpers ───────────────────────────────────────────────────

const PORTUGUESE_COMMON = new Set([
  "alfa", "beta", "gama", "delta", "omega", "nova", "vox", "lux", "flux",
  "via", "sol", "mar", "ter", "luz", "oro", "prata", "ouro", "casa", "vida",
  "mente", "forma", "vista", "mundo", "terra", "base", "nexo", "arco",
  "verso", "verso", "clara", "alto", "forte", "verde", "azul",
]);

const LATIN_ROOTS = new Set([
  "lux", "nox", "vox", "pax", "rex", "max", "ver", "arc", "mag", "alt",
  "pri", "omni", "spec", "vid", "vor", "gen", "port", "cap", "fac",
]);

const ENGLISH_TECH = new Set([
  "flow", "hub", "lab", "sync", "link", "core", "base", "cloud", "dash",
  "gate", "grid", "loop", "node", "path", "pipe", "pool", "rack", "root",
  "scan", "snap", "spot", "stack", "swap", "tag", "tap", "task", "track",
]);

function isPortmanteau(name: string): boolean {
  const lower = name.toLowerCase();
  // Check if two recognizable roots are combined
  for (const word of [...PORTUGUESE_COMMON, ...ENGLISH_TECH, ...LATIN_ROOTS]) {
    if (lower.startsWith(word) || lower.endsWith(word)) {
      const rest = lower.startsWith(word)
        ? lower.slice(word.length)
        : lower.slice(0, lower.length - word.length);
      if (rest.length >= 2) return true;
    }
  }
  return false;
}

function isDescriptive(name: string): boolean {
  const lower = name.toLowerCase();
  return (
    PORTUGUESE_COMMON.has(lower) ||
    ENGLISH_TECH.has(lower) ||
    LATIN_ROOTS.has(lower)
  );
}

function classifyType(name: string): MeaningType {
  const lower = name.toLowerCase();
  if (isDescriptive(lower)) return "descriptive";
  if (isPortmanteau(lower)) return "portmanteau";
  // Metaphorical: has a recognizable root with meaning
  for (const root of LATIN_ROOTS) {
    if (lower.includes(root)) return "metaphorical";
  }
  for (const root of PORTUGUESE_COMMON) {
    if (lower.includes(root)) return "metaphorical";
  }
  return "abstract";
}

function computeClarity(name: string, type: MeaningType): number {
  switch (type) {
    case "descriptive": return 9;
    case "portmanteau": return 7;
    case "metaphorical": return 6;
    case "abstract": return 4;
  }
}

function computeSymbolicDensity(name: string, type: MeaningType): number {
  // Abstract and metaphorical names tend to have higher density
  const base =
    type === "abstract" ? 8 :
    type === "metaphorical" ? 7 :
    type === "portmanteau" ? 5 :
    3;
  return Math.min(10, base + (name.length > 6 ? -1 : 1));
}

function buildSuggestion(name: string, type: MeaningType): string {
  const suggestions: Record<MeaningType, string> = {
    descriptive: `"${name}" carrega significado imediato e legível. Alta clareza, menor diferenciação.`,
    portmanteau: `"${name}" combina dois campos semânticos. Flexibilidade criativa com ancora de sentido.`,
    metaphorical: `"${name}" transporta conceito de outra área. Riqueza evocativa dependente de contexto.`,
    abstract: `"${name}" é uma invenção fonética sem significado pré-existente. Blank slate — branding define tudo.`,
  };
  return suggestions[type];
}

// ─── Main analysis ────────────────────────────────────────────────────────────

export function analyzeMeaningLayer(name: string): Omit<MeaningLayer, "id" | "candidateId"> {
  const type = classifyType(name);
  const clarity = computeClarity(name, type);
  const symbolicDensity = computeSymbolicDensity(name, type);
  const suggestion = buildSuggestion(name, type);

  const notes: string[] = [];
  if (type === "abstract")
    notes.push("Nome inventado — significado construído inteiramente pela marca");
  if (type === "portmanteau")
    notes.push("Portmanteau: fusão de dois campos semânticos");
  if (type === "metaphorical")
    notes.push("Transferência metafórica: evoca conceito de outro domínio");
  if (type === "descriptive")
    notes.push("Nome descritivo: autoexplicativo, mas menos proteção de marca");

  const conflicts: string[] = [];
  if (type === "descriptive" && clarity < 6)
    conflicts.push("Nome descritivo mas com clareza baixa — contradição");

  return {
    type,
    clarity,
    suggestion,
    symbolicDensity,
    conflicts: conflicts.length ? JSON.stringify(conflicts) : null,
    notes: JSON.stringify(notes),
  };
}
