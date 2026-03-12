import type { SoundLayer, SoundTone, SoundRhythm } from "@/types";

// ─── Phoneme category maps ────────────────────────────────────────────────────

const DEPTH_PHONEMES = new Set(["a", "o", "u", "m", "n"]);
const LIGHT_PHONEMES = new Set(["i", "e", "l", "s"]);
const IMPACT_PHONEMES = new Set(["k", "c", "t", "p", "x", "b", "d", "q"]);
const FLOW_PHONEMES = new Set(["l", "r", "w"]);
const TECH_PATTERNS = ["xi", "xu", "xe", "xo", "xa", "zi", "zu", "ze", "zo", "za", "ix", "ex", "ax"];
const VOWELS = new Set(["a", "e", "i", "o", "u"]);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function countSyllables(name: string): number {
  const lower = name.toLowerCase();
  const matches = lower.match(/[aeiou]+/g);
  return matches ? matches.length : 1;
}

function detectRhythm(name: string): SoundRhythm {
  const syllables = countSyllables(name);
  if (syllables === 1) return "monosyllabic";
  if (syllables <= 2) return "balanced";
  if (syllables <= 3) return "flowing";
  return "complex";
}

function detectRepetition(name: string): { present: boolean; note: string } {
  const lower = name.toLowerCase();

  // Alliteration: same consonant at start of adjacent syllables
  const parts = lower.split(/[aeiou]+/).filter(Boolean);
  const hasAlliteration = parts.length >= 2 && parts[0][0] === parts[1]?.[0];

  // Assonance: same vowel repeats
  const vowels = lower.split("").filter((c) => VOWELS.has(c));
  const vowelCounts = new Map<string, number>();
  for (const v of vowels) vowelCounts.set(v, (vowelCounts.get(v) ?? 0) + 1);
  const hasAssonance = [...vowelCounts.values()].some((c) => c >= 2);

  if (hasAlliteration)
    return { present: true, note: "Aliteração — repete consoante inicial" };
  if (hasAssonance)
    return { present: true, note: "Assonância — vogal repetida" };
  return { present: false, note: "" };
}

// ─── Main analysis ────────────────────────────────────────────────────────────

export function analyzeSoundLayer(name: string): Omit<SoundLayer, "id" | "candidateId"> {
  const lower = name.toLowerCase().replace(/\s+/g, "");
  const chars = lower.split("");

  let depth = 0, light = 0, impact = 0, flow = 0, tech = 0;
  const total = chars.length || 1;

  for (const c of chars) {
    if (DEPTH_PHONEMES.has(c)) depth++;
    if (LIGHT_PHONEMES.has(c)) light++;
    if (IMPACT_PHONEMES.has(c)) impact++;
    if (FLOW_PHONEMES.has(c)) flow++;
  }

  // Tech patterns get double weight
  for (const pat of TECH_PATTERNS) {
    if (lower.includes(pat)) tech += 2;
  }

  const profile = {
    depth: Math.min(1, depth / total),
    light: Math.min(1, light / total),
    impact: Math.min(1, impact / total),
    flow: Math.min(1, flow / total),
    tech: Math.min(1, tech / total),
  };

  // Dominant tone
  const scores: [SoundTone, number][] = [
    ["tech", profile.tech * 1.5 + profile.impact * 0.5],
    ["premium", profile.depth * 0.6 + profile.flow * 0.4],
    ["human", profile.light * 0.5 + profile.flow * 0.5],
    ["bold", profile.impact],
    ["clinical", profile.light * 0.4 + profile.impact * 0.3],
  ];
  scores.sort((a, b) => b[1] - a[1]);
  const topScore = scores[0][1];
  const secondScore = scores[1][1];
  const dominantTone: SoundTone =
    topScore - secondScore < 0.1 ? "mixed" : scores[0][0];

  const rhythm = detectRhythm(name);
  const syllableCount = countSyllables(name);
  const rep = detectRepetition(lower);

  // Clarity: penalize excessive consonant clusters, long names
  let clarityScore = 10;
  if (syllableCount > 4) clarityScore -= 2;
  if (name.length > 9) clarityScore -= 1;
  // Consecutive consonants
  const consonantClusters = lower.match(/[^aeiou]{3,}/g);
  if (consonantClusters) clarityScore -= consonantClusters.length * 2;
  clarityScore = Math.max(0, Math.min(10, clarityScore));

  const notes: string[] = [];
  if (dominantTone === "tech")
    notes.push("Sons duros (k, x, z) transmitem inovação e tecnologia");
  if (dominantTone === "premium")
    notes.push("Vogais abertas (a, o) e fluidos (l, r) criam sensação premium");
  if (dominantTone === "human")
    notes.push("Sons suaves e nasais (m, n) evocam proximidade e confiança");
  if (dominantTone === "bold")
    notes.push("Consoantes explosivas criam impacto memorável");
  if (syllableCount <= 2)
    notes.push("Nome curto — alto impacto e memorabilidade fonética");
  if (rep.present) notes.push(rep.note);

  const conflicts: string[] = [];
  if (dominantTone === "tech" && profile.depth > 0.4)
    conflicts.push("Sons graves conflitam com perfil tech desejado");

  return {
    profile: JSON.stringify(profile),
    dominantTone,
    rhythm,
    syllableCount,
    hasRepetition: rep.present,
    repetitionNote: rep.note || null,
    clarityScore,
    conflicts: conflicts.length ? JSON.stringify(conflicts) : null,
    notes: JSON.stringify(notes),
  };
}
