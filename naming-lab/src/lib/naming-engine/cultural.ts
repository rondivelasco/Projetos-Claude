import type { CulturalLayer, RiskLevel } from "@/types";

// ─── Risk word banks ──────────────────────────────────────────────────────────

// Words/patterns that have negative or awkward associations in Portuguese/BR
const NEGATIVE_PT = ["mal", "mor", "dor", "ode", "pus", "ixo", "eca", "nojo", "lixo"];
// Patterns that may sound awkward in English markets
const AWKWARD_EN = ["piss", "ass", "shit", "cum", "anus"];
// Generic/common words that reduce differentiation
const GENERIC_WORDS = ["smart", "plus", "pro", "easy", "fast", "best", "top", "mega", "super"];
// Tech clichés
const TECH_CLICHES = ["hub", "lab", "ly", "ify", "ble", "able"];

const POSITIVE_ASSOCIATIONS_PT = [
  "lux", "lum", "sol", "aur", "val", "arc", "via", "vox", "gen", "nex",
];

// ─── Analysis ─────────────────────────────────────────────────────────────────

function detectAssociations(name: string, market: string): string[] {
  const lower = name.toLowerCase();
  const found: string[] = [];

  for (const pos of POSITIVE_ASSOCIATIONS_PT) {
    if (lower.includes(pos)) found.push(`Raiz "${pos}" — evoca luz, valor ou conexão`);
  }

  if (/\d/.test(name)) found.push("Contém número — pode dificultar buscas textuais");
  if (/[^a-zA-Z0-9\s]/.test(name)) found.push("Caractere especial — risco de legibilidade");
  if (lower.length <= 4) found.push("Nome ultracurto — alto valor de domínio .com");

  return found.length ? found : ["Sem associações culturais evidentes detectadas"];
}

function detectAmbiguity(name: string, market: string): RiskLevel {
  const lower = name.toLowerCase();

  for (const word of NEGATIVE_PT) {
    if (lower.includes(word)) return "high";
  }
  for (const word of AWKWARD_EN) {
    if (lower.includes(word)) return "high";
  }
  // Double meaning risk
  if (lower.length <= 3) return "medium"; // very short = potential overlap
  if (GENERIC_WORDS.some((w) => lower.includes(w))) return "medium";
  return "low";
}

function detectCulturalRisk(name: string, market: string, language: string): RiskLevel {
  const lower = name.toLowerCase();

  // Hard negative patterns
  for (const word of [...NEGATIVE_PT, ...AWKWARD_EN]) {
    if (lower.includes(word)) return "high";
  }

  // Soft risks
  const isCliché = TECH_CLICHES.some((c) => lower.endsWith(c));
  const isGeneric = GENERIC_WORDS.some((g) => lower.includes(g));
  if (isCliché || isGeneric) return "medium";

  return "low";
}

function buildNotes(name: string, ambiguity: RiskLevel, risk: RiskLevel): string[] {
  const notes: string[] = [];
  const lower = name.toLowerCase();

  if (GENERIC_WORDS.some((g) => lower.includes(g)))
    notes.push("Contém palavra genérica — reduz diferenciação de marca");
  if (TECH_CLICHES.some((c) => lower.endsWith(c)))
    notes.push("Sufixo tech clichê — mercado saturado com esta terminação");
  if (ambiguity === "high")
    notes.push("Risco de ambiguidade — verificar conotações em todos os mercados-alvo");
  if (ambiguity === "low" && risk === "low")
    notes.push("Culturalmente seguro nos mercados analisados");
  if (!notes.length)
    notes.push("Análise cultural sem flags críticos");

  return notes;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function analyzeCulturalLayer(
  name: string,
  market = "Brasil",
  language = "pt-BR"
): Omit<CulturalLayer, "id" | "candidateId"> {
  const associations = detectAssociations(name, market);
  const ambiguityLevel = detectAmbiguity(name, market);
  const culturalRisk = detectCulturalRisk(name, market, language);
  const notes = buildNotes(name, ambiguityLevel, culturalRisk);

  const conflicts: string[] = [];
  if (ambiguityLevel === "high" && culturalRisk === "low")
    conflicts.push("Ambiguidade alta mas risco baixo — verificar manualmente");

  return {
    associations: JSON.stringify(associations),
    ambiguityLevel,
    culturalRisk,
    conflicts: conflicts.length ? JSON.stringify(conflicts) : null,
    notes: JSON.stringify(notes),
  };
}
