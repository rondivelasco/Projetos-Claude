import type { GeneratorFilter, MeaningType, ProjectType } from "@/types";
import { analyzeSoundLayer } from "./sound";
import { analyzeMeaningLayer } from "./meaning";
import { analyzeCulturalLayer } from "./cultural";
import { analyzeFunctionalLayer } from "./functional";
import { computeScore } from "./scorer";

// ─── Name fragment banks ──────────────────────────────────────────────────────

const ROOTS: Record<string, string[]> = {
  tech: ["nex", "vex", "kron", "zyn", "xal", "vol", "dex", "hex", "vox", "nox", "axon", "kore", "zeta", "kyno", "vect"],
  nature: ["aur", "lum", "sol", "ven", "arc", "mer", "vor", "kal", "zel", "lux", "terra", "aeon"],
  movement: ["flux", "vel", "cur", "mot", "kin", "vib", "swift", "torq"],
  power: ["val", "alt", "mag", "max", "prim", "gen", "fort", "omni", "rex"],
  clarity: ["clar", "vid", "spec", "view", "lucid", "veri", "cert"],
  connection: ["link", "nex", "via", "pont", "junc", "bind", "sync", "rela"],
  premium: ["aur", "velv", "alc", "emer", "ivo", "carm", "ador", "gala"],
};

const SUFFIXES: Record<string, string[]> = {
  saas: ["io", "ly", "fy", "hub", "ix", "ex", "ai", "lab", "flow", "yx"],
  brand: ["a", "o", "um", "us", "ia", "or", "ix", "ax", "an", "en", "is"],
  product: ["er", "pro", "max", "plus", "x", "ar", "on", "it"],
  service: ["ance", "ify", "ment"],
};

const PREFIXES: Record<string, string[]> = {
  premium: ["a", "e", "v", "l", "re"],
  tech: ["n", "k", "z", "x", "cy", "vi", "di"],
  human: ["m", "em", "in", "on"],
};

// Phoneme templates by filter
const PHONEME_SETS: Record<string, { c: string[]; v: string[] }> = {
  tech: { c: ["k", "v", "z", "x", "n", "t", "d"], v: ["e", "i", "a", "o"] },
  premium: { c: ["v", "l", "r", "m", "f", "n"], v: ["a", "o", "e", "u"] },
  human: { c: ["m", "n", "l", "s", "r"], v: ["a", "i", "o", "e"] },
  clinical: { c: ["p", "b", "g", "c", "f"], v: ["a", "e", "o", "i"] },
  bold: { c: ["k", "x", "z", "b", "d", "g"], v: ["a", "o", "u", "e"] },
  sophisticated: { c: ["v", "l", "r", "f", "s", "m"], v: ["a", "o", "e", "u"] },
  simple: { c: ["m", "n", "t", "l", "s", "p"], v: ["a", "i", "o", "e"] },
  memorable: { c: ["k", "v", "l", "r", "m"], v: ["a", "o", "i", "e"] },
};

// ─── Word generation ──────────────────────────────────────────────────────────

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function fromRoots(
  projectType: ProjectType,
  filter: GeneratorFilter,
  count: number
): string[] {
  const results = new Set<string>();

  const rootCategory = mapFilterToRoot(filter);
  const roots = ROOTS[rootCategory] ?? ROOTS.tech;
  const typeSuffixes = SUFFIXES[projectType] ?? SUFFIXES.brand;

  for (const root of roots) {
    for (const suffix of typeSuffixes) {
      const name = capitalize(root + suffix);
      if (name.length >= 4 && name.length <= 10) results.add(name);
      if (results.size >= count * 2) break;
    }
  }

  return [...results].slice(0, count);
}

function fromPhonemes(filter: GeneratorFilter, count: number): string[] {
  const set = PHONEME_SETS[filter] ?? PHONEME_SETS.tech;
  const results = new Set<string>();

  const patterns = ["CVCV", "CVCCV", "VCVC", "CVC", "CVCVC"];

  for (const pattern of patterns) {
    for (let i = 0; i < 5; i++) {
      let name = "";
      let ci = 0;
      let vi = 0;
      for (const p of pattern) {
        if (p === "C") {
          name += set.c[ci % set.c.length];
          ci++;
        } else {
          name += set.v[vi % set.v.length];
          vi++;
        }
      }
      if (name.length >= 3 && name.length <= 7) results.add(capitalize(name));
      if (results.size >= count * 3) break;
    }
  }
  return [...results].slice(0, count);
}

function mapFilterToRoot(filter: GeneratorFilter): string {
  const map: Record<GeneratorFilter, string> = {
    tech: "tech",
    premium: "premium",
    human: "connection",
    clinical: "clarity",
    memorable: "nature",
    simple: "movement",
    bold: "power",
    sophisticated: "premium",
  };
  return map[filter] ?? "tech";
}

// ─── Main generator ───────────────────────────────────────────────────────────

export interface GeneratedCandidate {
  name: string;
  score: number;
  layers: {
    sound: ReturnType<typeof analyzeSoundLayer>;
    meaning: ReturnType<typeof analyzeMeaningLayer>;
    cultural: ReturnType<typeof analyzeCulturalLayer>;
    functional: ReturnType<typeof analyzeFunctionalLayer>;
  };
  scoreDetails: ReturnType<typeof computeScore>;
}

export function generateNames(
  projectType: ProjectType,
  filter: GeneratorFilter,
  language: string,
  market: string,
  count = 6
): GeneratedCandidate[] {
  const half = Math.ceil(count / 2);
  const rootBased = fromRoots(projectType, filter, half * 2);
  const phonemeBased = fromPhonemes(filter, half * 2);

  const pool = [...new Set([...rootBased, ...phonemeBased])];

  const evaluated: GeneratedCandidate[] = pool.slice(0, count * 2).map((name) => {
    const sound = analyzeSoundLayer(name);
    const meaning = analyzeMeaningLayer(name);
    const cultural = analyzeCulturalLayer(name, market, language);
    const functional = analyzeFunctionalLayer(name, language);
    const scoreDetails = computeScore(name, { sound, meaning, cultural, functional });
    return { name, score: scoreDetails.total, layers: { sound, meaning, cultural, functional }, scoreDetails };
  });

  // Sort by score and return top N
  evaluated.sort((a, b) => b.score - a.score);
  return evaluated.slice(0, count);
}
