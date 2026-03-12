// ─── Project ──────────────────────────────────────────────────────────────────

export type ProjectType =
  | "brand"
  | "product"
  | "saas"
  | "character"
  | "place"
  | "title"
  | "product-line";

export interface Project {
  id: string;
  name: string;
  type: ProjectType;
  context?: string | null;
  targetAudience?: string | null;
  market?: string | null;
  language: string;
  category?: string | null;
  personality?: string | null;
  references?: string | null;
  restrictions?: string | null;
  tags?: string | null;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { candidates: number; diagnoses: number };
}

// ─── Naming States ────────────────────────────────────────────────────────────

export type NamingState = "N1" | "N2" | "N3" | "N4" | "N5";

export const NAMING_STATE_LABELS: Record<NamingState, string> = {
  N1: "Não parece certo",
  N2: "Não pertencem juntos",
  N3: "Esquecível",
  N4: "Envia sinais errados",
  N5: "Não funciona na prática",
};

export interface Diagnosis {
  id: string;
  projectId: string;
  states: string; // JSON NamingState[]
  symptoms: string; // JSON string[]
  causes: string; // JSON string[]
  impact: string;
  direction?: string | null;
  createdAt: string;
}

// ─── Layers ───────────────────────────────────────────────────────────────────

export type SoundTone =
  | "premium"
  | "tech"
  | "human"
  | "clinical"
  | "bold"
  | "mixed";
export type SoundRhythm =
  | "monosyllabic"
  | "balanced"
  | "flowing"
  | "complex";
export type MeaningType =
  | "descriptive"
  | "metaphorical"
  | "abstract"
  | "portmanteau";
export type RiskLevel = "low" | "medium" | "high";

export interface SoundLayer {
  id: string;
  candidateId: string;
  profile: string; // JSON {depth,light,impact,flow,tech}
  dominantTone: SoundTone;
  rhythm: SoundRhythm;
  syllableCount: number;
  hasRepetition: boolean;
  repetitionNote?: string | null;
  clarityScore: number;
  conflicts?: string | null;
  notes: string; // JSON string[]
}

export interface MeaningLayer {
  id: string;
  candidateId: string;
  type: MeaningType;
  clarity: number;
  suggestion: string;
  symbolicDensity: number;
  conflicts?: string | null;
  notes: string;
}

export interface CulturalLayer {
  id: string;
  candidateId: string;
  associations: string; // JSON string[]
  ambiguityLevel: RiskLevel;
  culturalRisk: RiskLevel;
  conflicts?: string | null;
  notes: string;
}

export interface FunctionalLayer {
  id: string;
  candidateId: string;
  pronunciation: number;
  writability: number;
  memorability: number;
  phoneTest: boolean;
  typoRisk: number;
  readability: number;
  conflicts?: string | null;
  notes: string;
}

export interface Score {
  id: string;
  candidateId: string;
  soundFit: number;
  semanticClarity: number;
  culturalFit: number;
  functionality: number;
  memorability: number;
  differentiation: number;
  brandPotential: number;
  total: number;
  justification: string;
  strengths: string; // JSON string[]
  weaknesses: string; // JSON string[]
  risks: string; // JSON string[]
}

// ─── Candidate ────────────────────────────────────────────────────────────────

export interface Candidate {
  id: string;
  projectId: string;
  roundId?: string | null;
  name: string;
  notes?: string | null;
  isShortlisted: boolean;
  isDiscarded: boolean;
  createdAt: string;
  updatedAt: string;
  soundLayer?: SoundLayer | null;
  meaningLayer?: MeaningLayer | null;
  culturalLayer?: CulturalLayer | null;
  functionalLayer?: FunctionalLayer | null;
  score?: Score | null;
}

// ─── Round ────────────────────────────────────────────────────────────────────

export interface Round {
  id: string;
  projectId: string;
  number: number;
  label?: string | null;
  filters?: string | null;
  createdAt: string;
  candidates?: Candidate[];
}

// ─── Decision ─────────────────────────────────────────────────────────────────

export interface Decision {
  id: string;
  projectId: string;
  chosenName: string;
  candidateId?: string | null;
  justification: string;
  shortlist: string; // JSON string[]
  discarded: string; // JSON {name, reason}[]
  createdAt: string;
  updatedAt: string;
}

// ─── Engine Inputs ────────────────────────────────────────────────────────────

export type GeneratorFilter =
  | "premium"
  | "tech"
  | "human"
  | "clinical"
  | "memorable"
  | "simple"
  | "bold"
  | "sophisticated";

export interface GenerateRequest {
  projectId: string;
  count?: number;
  filter?: GeneratorFilter;
  semanticStyle?: MeaningType;
  language?: string;
}
