import OpenAI from "openai";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LLMGenerateInput {
  projectName: string;
  type: string;
  context?: string | null;
  audience?: string | null;
  category?: string | null;
  market?: string | null;
  language?: string | null;
  personality?: string | null;
  restrictions?: string | null;
  references?: string | null;
  previousNames?: string[];
}

export interface LLMCandidate {
  name: string;
  category: string;
  reasoning: string;
}

// ─── Prompts ──────────────────────────────────────────────────────────────────

function buildSystemPrompt(): string {
  return `Você é um especialista sênior em branding e naming estratégico com mais de 20 anos de experiência criando nomes para marcas globais, startups e produtos digitais.

Suas competências incluem:
- Fonética e impacto sonoro dos nomes
- Semântica e posicionamento de marca
- Criatividade lexical (portmanteau, neologismos, metáforas)
- Análise cultural e adaptação por mercado
- Naming para diferentes setores (tech, saúde, finanças, consumer, B2B)

Você sempre retorna respostas em JSON válido, sem texto adicional fora do JSON.`;
}

function buildUserPrompt(input: LLMGenerateInput): string {
  const prevSection =
    input.previousNames && input.previousNames.length > 0
      ? `\nNOMES JÁ GERADOS (NÃO repetir e evitar padrões similares): ${input.previousNames.join(", ")}`
      : "";

  const fields = [
    input.context && `CONTEXTO: ${input.context}`,
    input.category && `CATEGORIA / SETOR: ${input.category}`,
    input.audience && `PÚBLICO-ALVO: ${input.audience}`,
    input.market && `MERCADO: ${input.market}`,
    input.language && `IDIOMA PRINCIPAL: ${input.language}`,
    input.personality && `PERSONALIDADE DA MARCA: ${input.personality}`,
    input.restrictions && `RESTRIÇÕES OBRIGATÓRIAS: ${input.restrictions}`,
    input.references && `REFERÊNCIAS / CONCORRENTES (estilo, não copiar): ${input.references}`,
  ]
    .filter(Boolean)
    .join("\n");

  return `Crie 30 candidatos de nome para o seguinte projeto de naming:

NOME DO PROJETO: ${input.projectName}
TIPO: ${input.type}
${fields}${prevSection}

Gere EXATAMENTE 3 nomes para cada uma das 10 categorias estratégicas abaixo (total = 30):

1. descritivo       — Descreve diretamente o produto ou serviço
2. evocativo        — Evoca uma emoção, sensação ou conceito ligado à marca
3. composto         — Portmanteau ou fusão criativa de duas palavras/raízes
4. institucional    — Tom corporativo, formal e confiável
5. premium          — Transmite exclusividade, qualidade ou sofisticação
6. tecnológico      — Sonoridade moderna, inovadora, tech-forward
7. humano           — Próximo, acessível, com carga emocional positiva
8. curto            — Máximo 5 letras, altamente impactante e memorável
9. inventado        — Brandable: palavra inventada com identidade sonora forte
10. abstrato        — Sem significado literal direto, apenas sonoridade estratégica

REGRAS OBRIGATÓRIAS:
- Não repetir nenhum nome listado acima
- Não usar nomes genéricos (Smart, Easy, Pro, Plus, Best, Top, Super, Mega)
- Variar padrões fonéticos entre os 30 candidatos
- Adequar o idioma e sonoridade ao mercado especificado
- Cada reasoning deve ter 1-2 frases, explicando por que o nome funciona estrategicamente

Retorne SOMENTE o JSON abaixo, sem texto adicional:
{
  "candidates": [
    {
      "name": "ExemploNome",
      "category": "descritivo",
      "reasoning": "Explica por que este nome funciona para este projeto específico."
    }
  ]
}`;
}

// ─── Model cascade ────────────────────────────────────────────────────────────

const MODEL_CASCADE = ["gpt-4.1-mini", "gpt-4o", "gpt-3.5-turbo"] as const;

export interface LLMResult {
  candidates: LLMCandidate[];
  modelUsed: string;
}

// ─── OpenAI call with cascade ─────────────────────────────────────────────────

export async function generateNamesWithLLM(
  input: LLMGenerateInput
): Promise<LLMResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === "sk-...") {
    throw new Error("OPENAI_API_KEY não configurada. Edite o arquivo .env.");
  }

  const client = new OpenAI({ apiKey });
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(input);
  const lastError: string[] = [];

  for (const model of MODEL_CASCADE) {
    console.log(`[openai] Tentando modelo: ${model}`);
    try {
      const response = await client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.92,
        max_tokens: 4000,
      });

      const raw = response.choices[0]?.message?.content;
      if (!raw) throw new Error("Resposta vazia.");

      let parsed: { candidates: LLMCandidate[] };
      try {
        parsed = JSON.parse(raw);
      } catch {
        throw new Error("Resposta não é JSON válido.");
      }

      if (!Array.isArray(parsed?.candidates) || parsed.candidates.length === 0) {
        throw new Error("Formato de resposta inesperado.");
      }

      const candidates = parsed.candidates
        .filter((c) => c.name && typeof c.name === "string" && c.name.trim().length > 0)
        .map((c) => ({
          name: c.name.trim(),
          category: c.category?.trim() ?? "inventado",
          reasoning: c.reasoning?.trim() ?? "",
        }));

      console.log(`[openai] Sucesso com modelo: ${model} — ${candidates.length} candidatos`);
      return { candidates, modelUsed: model };
    } catch (err: any) {
      const reason = err?.message ?? String(err);
      console.warn(`[openai] Modelo ${model} falhou: ${reason}`);
      lastError.push(`${model}: ${reason}`);
    }
  }

  // All models failed
  throw new Error(`Todos os modelos falharam.\n${lastError.join("\n")}`);
}
