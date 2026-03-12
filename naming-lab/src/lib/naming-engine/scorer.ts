import type { Score, SoundLayer, MeaningLayer, CulturalLayer, FunctionalLayer } from "@/types";

interface LayerInputs {
  sound: Omit<SoundLayer, "id" | "candidateId">;
  meaning: Omit<MeaningLayer, "id" | "candidateId">;
  cultural: Omit<CulturalLayer, "id" | "candidateId">;
  functional: Omit<FunctionalLayer, "id" | "candidateId">;
}

const RISK_PENALTY: Record<string, number> = { low: 0, medium: -1.5, high: -3 };

export function computeScore(
  name: string,
  layers: LayerInputs,
  projectPersonality?: string
): Omit<Score, "id" | "candidateId"> {
  const { sound, meaning, cultural, functional } = layers;
  const soundProfile = JSON.parse(sound.profile) as Record<string, number>;

  // ─ Sound Fit (0-10) ─────────────────────────────────────────────────
  const soundFit = Math.round(
    sound.clarityScore * 0.4 +
      (soundProfile.depth + soundProfile.light + soundProfile.flow) * 5 +
      (sound.hasRepetition ? 0.5 : 0)
  );

  // ─ Semantic Clarity (0-10) ──────────────────────────────────────────
  const semanticClarity = Math.round(
    meaning.clarity * 0.7 + meaning.symbolicDensity * 0.3
  );

  // ─ Cultural Fit (0-10) ──────────────────────────────────────────────
  const culturalBase = 8;
  const culturalFit = Math.max(
    0,
    culturalBase +
      RISK_PENALTY[cultural.ambiguityLevel] +
      RISK_PENALTY[cultural.culturalRisk]
  );

  // ─ Functionality (0-10) ─────────────────────────────────────────────
  const functionality = Math.round(
    functional.pronunciation * 0.25 +
      functional.writability * 0.2 +
      functional.memorability * 0.3 +
      functional.readability * 0.15 +
      (functional.phoneTest ? 1 : 0) +
      (functional.typoRisk > 5 ? -1 : 0)
  );

  // ─ Memorability (0-10) ──────────────────────────────────────────────
  const memorability = Math.round(
    functional.memorability * 0.6 +
      sound.clarityScore * 0.2 +
      (sound.hasRepetition ? 1 : 0) +
      (name.length <= 6 ? 1.5 : name.length <= 8 ? 0.5 : -0.5)
  );

  // ─ Differentiation (0-10) ───────────────────────────────────────────
  const diffBase =
    meaning.type === "abstract" ? 9 :
    meaning.type === "portmanteau" ? 7 :
    meaning.type === "metaphorical" ? 6 :
    4;
  const differentiation = Math.max(0, Math.min(10, diffBase + (sound.dominantTone === "mixed" ? -1 : 0)));

  // ─ Brand Potential (0-10) ───────────────────────────────────────────
  const brandPotential = Math.round(
    (soundFit + semanticClarity + culturalFit + functionality + memorability + differentiation) / 6
  );

  // ─ Total ────────────────────────────────────────────────────────────
  const rawTotal =
    soundFit * 0.15 +
    semanticClarity * 0.15 +
    culturalFit * 0.15 +
    functionality * 0.2 +
    memorability * 0.2 +
    differentiation * 0.1 +
    brandPotential * 0.05;
  const total = Math.round(Math.min(10, Math.max(0, rawTotal)) * 10) / 10;

  // ─ Narrative ────────────────────────────────────────────────────────
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const risks: string[] = [];

  if (soundFit >= 7) strengths.push("Perfil sonoro forte e coerente");
  if (memorability >= 8) strengths.push("Alta memorabilidade");
  if (differentiation >= 8) strengths.push("Elevado potencial de diferenciação");
  if (culturalFit >= 8) strengths.push("Seguro culturalmente");
  if (functional.phoneTest) strengths.push("Passa no teste do telefone");
  if (meaning.type === "abstract") strengths.push("Blank slate — posicionamento flexível");

  if (soundFit < 5) weaknesses.push("Perfil sonoro fraco ou inconsistente");
  if (memorability < 5) weaknesses.push("Memorabilidade abaixo do ideal");
  if (meaning.clarity < 5) weaknesses.push("Clareza semântica baixa");
  if (functional.writability < 5) weaknesses.push("Difícil de escrever corretamente");

  if (cultural.culturalRisk === "high") risks.push("Risco cultural alto — auditoria necessária");
  if (cultural.ambiguityLevel === "high") risks.push("Ambiguidade — pode ser mal interpretado");
  if (functional.typoRisk >= 7) risks.push("Erro de digitação frequente esperado");

  const justification = buildJustification(name, total, strengths, weaknesses);

  return {
    soundFit: Math.min(10, Math.max(0, soundFit)),
    semanticClarity: Math.min(10, Math.max(0, semanticClarity)),
    culturalFit: Math.min(10, Math.max(0, culturalFit)),
    functionality: Math.min(10, Math.max(0, functionality)),
    memorability: Math.min(10, Math.max(0, memorability)),
    differentiation: Math.min(10, Math.max(0, differentiation)),
    brandPotential: Math.min(10, Math.max(0, brandPotential)),
    total,
    justification,
    strengths: JSON.stringify(strengths),
    weaknesses: JSON.stringify(weaknesses),
    risks: JSON.stringify(risks),
  };
}

function buildJustification(
  name: string,
  total: number,
  strengths: string[],
  weaknesses: string[]
): string {
  const level =
    total >= 8 ? "Nome forte com alto potencial estratégico" :
    total >= 6 ? "Nome com bom potencial, refinamento recomendado" :
    total >= 4 ? "Nome funcional com limitações estratégicas claras" :
    "Nome com problemas estruturais — revisar direção";

  const main = strengths[0] ?? "perfil equilibrado";
  const weak = weaknesses[0] ? ` Principal limitação: ${weaknesses[0].toLowerCase()}.` : "";

  return `${level}. ${name} apresenta ${main.toLowerCase()}.${weak}`;
}
