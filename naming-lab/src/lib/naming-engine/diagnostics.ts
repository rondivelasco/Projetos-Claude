import type { NamingState, Project } from "@/types";

// ─── State definitions ────────────────────────────────────────────────────────

interface StateDefinition {
  state: NamingState;
  label: string;
  symptoms: string[];
  causes: string[];
  impact: string;
}

const STATE_DEFS: StateDefinition[] = [
  {
    state: "N1",
    label: "Não parece certo",
    symptoms: [
      "Desconforto subjetivo ao pronunciar",
      "Sensação de que algo está fora do lugar",
      "Resistência interna de stakeholders",
      "O nome não 'soa' como a marca deveria soar",
    ],
    causes: [
      "Desalinhamento entre personalidade da marca e perfil sonoro",
      "Nome escolhido por conveniência, não por estratégia",
      "Ausência de processo de validação sensorial",
    ],
    impact: "Leva a hesitação na apresentação da marca. Fundadores evitam falar o nome em voz alta.",
  },
  {
    state: "N2",
    label: "Não pertencem juntos",
    symptoms: [
      "Nome e categoria não se reconhecem mutuamente",
      "Público não associa o nome ao produto",
      "Nome parece pertencer a outra indústria",
    ],
    causes: [
      "Naming sem ancoragem na categoria",
      "Referências de mercado ignoradas",
      "Excesso de originalidade descontextualizada",
    ],
    impact: "Custo de aquisição alto. A marca precisa explicar o que é antes de vender.",
  },
  {
    state: "N3",
    label: "Esquecível",
    symptoms: [
      "Ninguém lembra o nome após primeiro contato",
      "Nome confundido com concorrentes",
      "Baixa memorabilidade espontânea",
      "Dificuldade de boca a boca",
    ],
    causes: [
      "Nome muito genérico ou descritivo",
      "Ausência de gancho fonético",
      "Padrão sonoro comum demais na categoria",
    ],
    impact: "CAC elevado. Marketing caro para compensar baixa memorabilidade.",
  },
  {
    state: "N4",
    label: "Envia sinais errados",
    symptoms: [
      "Público interpreta posicionamento diferente do pretendido",
      "Nome soa premium quando produto é popular (ou vice-versa)",
      "Associações culturais negativas ou inadequadas",
    ],
    causes: [
      "Desalinhamento entre perfil sonoro e posicionamento",
      "Conotações culturais não mapeadas",
      "Naming feito sem análise de percepção",
    ],
    impact: "Posicionamento comprometido. Difícil cobrar preço correto.",
  },
  {
    state: "N5",
    label: "Não funciona na prática",
    symptoms: [
      "Difícil de soletrar ao telefone",
      "Erros frequentes de grafia ou digitação",
      "URL/domínio indisponível ou confuso",
      "Problemas em mercados internacionais",
      "Marca registrada conflitante",
    ],
    causes: [
      "Nome validado apenas esteticamente, não operacionalmente",
      "Ausência de teste de usabilidade fonética",
      "Pesquisa de viabilidade de domínio não realizada",
    ],
    impact: "Fricção operacional. Afeta SEO, suporte, boca a boca e crescimento orgânico.",
  },
];

// ─── Diagnosis logic ──────────────────────────────────────────────────────────

interface DiagnosisInput {
  project: Pick<Project, "type" | "context" | "personality" | "category" | "market" | "language">;
  existingName?: string;
}

interface DiagnosisResult {
  states: NamingState[];
  symptoms: string[];
  causes: string[];
  impact: string;
  direction: string;
}

export function diagnose(input: DiagnosisInput): DiagnosisResult {
  const { project, existingName } = input;
  const detectedStates: NamingState[] = [];
  const allSymptoms: string[] = [];
  const allCauses: string[] = [];
  const impacts: string[] = [];

  // Context-based heuristics
  const ctx = (project.context ?? "").toLowerCase();
  const personality = (project.personality ?? "").toLowerCase();

  // N3 — Esquecível: if context mentions "generic", "common", or no personality defined
  if (!project.personality || personality.length < 10) {
    detectedStates.push("N3");
  }

  // N4 — Sinais errados: conflicting personality signals
  if (
    (personality.includes("premium") && personality.includes("acessível")) ||
    (personality.includes("tech") && personality.includes("artesanal"))
  ) {
    detectedStates.push("N4");
  }

  // N2 — Não pertencem juntos: no category defined
  if (!project.category) {
    detectedStates.push("N2");
  }

  // N1 — Não parece certo: generic for all projects without strong context
  if (!project.context || project.context.length < 50) {
    detectedStates.push("N1");
  }

  // N5 — Funcional: international market without language consideration
  if (project.market && project.market !== "Brasil" && project.language === "pt-BR") {
    detectedStates.push("N5");
  }

  // If no state detected, default to N1 + N3 (most common pair)
  if (detectedStates.length === 0) {
    detectedStates.push("N1", "N3");
  }

  // Build output from detected states
  for (const state of detectedStates) {
    const def = STATE_DEFS.find((d) => d.state === state)!;
    allSymptoms.push(...def.symptoms.slice(0, 2));
    allCauses.push(...def.causes.slice(0, 2));
    impacts.push(def.impact);
  }

  const direction = buildDirection(detectedStates, project);

  return {
    states: [...new Set(detectedStates)],
    symptoms: [...new Set(allSymptoms)],
    causes: [...new Set(allCauses)],
    impact: impacts.join(" "),
    direction,
  };
}

function buildDirection(
  states: NamingState[],
  project: DiagnosisInput["project"]
): string {
  const type = project.type;
  const lang = project.language;

  if (states.includes("N3") && states.includes("N1")) {
    return `Priorizar nomes com forte gancho fonético e perfil sonoro alinhado à personalidade da marca. Para ${type} em ${lang}: explorar nomes inventados (abstract) ou portmanteau com âncora semântica clara.`;
  }
  if (states.includes("N4")) {
    return `Mapear o posicionamento pretendido antes de gerar candidatos. Sons suaves (l, r, m) para premium/humano; sons duros (k, x, z) para tech/ousado. Evitar mistura de sinais.`;
  }
  if (states.includes("N2")) {
    return `Pesquisar o campo léxico da categoria antes de criar. Nomes devem carregar âncora semântica da indústria, mesmo que sejam inventados.`;
  }
  if (states.includes("N5")) {
    return `Validar domínio .com, registro de marca e pronúncia em todos os mercados-alvo antes de avançar. Priorizar nomes curtos (4-6 letras) e foneticamente universais.`;
  }
  return `Explorar direções de naming com base em análise de camadas. Criar shortlist de 5-10 candidatos e avaliá-los sistematicamente.`;
}

export { STATE_DEFS };
