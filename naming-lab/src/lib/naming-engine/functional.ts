import type { FunctionalLayer } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const HARD_CLUSTERS = /[bcdfghjklmnpqrstvwxyz]{3,}/i;
const SILENT_PATTERNS = /gh|kn|wr|mb|mn/i;
const AMBIGUOUS_LETTERS = /[qwxy]/i; // harder for non-English speakers

function scorePronunciation(name: string, language: string): number {
  let score = 10;
  if (HARD_CLUSTERS.test(name)) score -= 3;
  if (SILENT_PATTERNS.test(name)) score -= 2;
  if (language === "pt-BR" && AMBIGUOUS_LETTERS.test(name)) score -= 1;
  if (name.length > 10) score -= 1;
  return Math.max(0, score);
}

function scoreWritability(name: string): number {
  let score = 10;
  if (/[qwxy]/i.test(name)) score -= 1;
  if (/[aeiou]{3,}/i.test(name)) score -= 1; // triple vowels confuse spelling
  if (name.length > 10) score -= 2;
  if (HARD_CLUSTERS.test(name)) score -= 2;
  return Math.max(0, score);
}

function scoreMemorability(name: string): number {
  let score = 6;
  const len = name.length;
  // Sweet spot: 4-7 chars
  if (len >= 4 && len <= 7) score += 3;
  else if (len <= 9) score += 1;
  else score -= 2;
  // Repetition helps memory
  const lower = name.toLowerCase();
  const vowels = lower.match(/[aeiou]/g) || [];
  const uniqueVowels = new Set(vowels);
  if (uniqueVowels.size === 1 && vowels.length >= 2) score += 1; // assonance
  return Math.min(10, Math.max(0, score));
}

function phoneTest(name: string): boolean {
  // Passes if: can be spelled easily letter by letter with no ambiguous phonemes
  const ambiguous = /[ckg]|ph|th|ch|sh/i;
  return !ambiguous.test(name) && name.length <= 8;
}

function typoRisk(name: string): number {
  // 0 = no risk, 10 = high risk
  let risk = 0;
  if (name.length > 8) risk += 2;
  // Adjacent same letters
  if (/(.)\1/i.test(name)) risk += 2;
  // Easily confused letters
  if (/[mn]{2}|[ei]{2}|[ou]{2}/i.test(name)) risk += 2;
  if (HARD_CLUSTERS.test(name)) risk += 3;
  return Math.min(10, risk);
}

function scoreReadability(name: string): number {
  let score = 10;
  if (/[^a-zA-Z]/g.test(name)) score -= 2; // special chars hurt readability
  if (name.length > 9) score -= 1;
  if (HARD_CLUSTERS.test(name)) score -= 2;
  return Math.max(0, score);
}

function buildNotes(
  pronunciation: number,
  writability: number,
  memorability: number,
  phone: boolean,
  typo: number
): string[] {
  const notes: string[] = [];
  if (pronunciation >= 8) notes.push("Alta clareza fonética — pronúncia intuitiva");
  if (pronunciation < 6) notes.push("Pronúncia não óbvia — considere testes com público");
  if (phone) notes.push("Passa o teste do telefone — letreamento claro");
  else notes.push("Pode falhar no teste do telefone — ambiguidade de letras");
  if (memorability >= 8) notes.push("Altamente memorável pelo padrão sonoro");
  if (typo >= 6) notes.push("Risco de erro de digitação — verifique alternativas ortográficas");
  if (writability >= 9) notes.push("Fácil de escrever corretamente");
  return notes.length ? notes : ["Funcionalidade dentro da média para a categoria"];
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function analyzeFunctionalLayer(
  name: string,
  language = "pt-BR"
): Omit<FunctionalLayer, "id" | "candidateId"> {
  const pronunciation = scorePronunciation(name, language);
  const writability = scoreWritability(name);
  const memorability = scoreMemorability(name);
  const phone = phoneTest(name);
  const typo = typoRisk(name);
  const readability = scoreReadability(name);
  const notes = buildNotes(pronunciation, writability, memorability, phone, typo);

  const conflicts: string[] = [];
  if (pronunciation >= 8 && typo >= 6)
    conflicts.push("Boa pronúncia mas alto risco de digitação errada");
  if (memorability >= 8 && writability < 6)
    conflicts.push("Memorável sonoramente mas difícil de escrever");

  return {
    pronunciation,
    writability,
    memorability,
    phoneTest: phone,
    typoRisk: typo,
    readability,
    conflicts: conflicts.length ? JSON.stringify(conflicts) : null,
    notes: JSON.stringify(notes),
  };
}
