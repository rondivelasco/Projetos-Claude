import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateNamesWithLLM } from "@/lib/openai-generator";
import { generateNames } from "@/lib/naming-engine/generator";
import {
  analyzeSoundLayer,
  analyzeMeaningLayer,
  analyzeCulturalLayer,
  analyzeFunctionalLayer,
  computeScore,
} from "@/lib/naming-engine";
import type { GeneratorFilter, ProjectType } from "@/types";

// ─── POST /api/generate-names ─────────────────────────────────────────────────
// Generates names using OpenAI (with rule-based fallback).
// Creates a Round and persists Candidates with full layer analysis.
// Returns: { round, candidates, usedFallback }

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { projectId } = body;

  if (!projectId) {
    return NextResponse.json({ error: "projectId é obrigatório." }, { status: 400 });
  }

  // Load project from DB
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    return NextResponse.json({ error: "Projeto não encontrado." }, { status: 404 });
  }

  // Collect names already generated to avoid repetition
  const existingCandidates = await prisma.candidate.findMany({
    where: { projectId },
    select: { name: true },
  });
  const previousNames = existingCandidates.map((c) => c.name);

  // ─── 1. Call OpenAI with model cascade (fallback to local if all fail) ───────
  let llmCandidates: { name: string; category: string; reasoning: string }[] = [];
  let usedFallback = false;
  let fallbackReason: string | null = null;
  let modelUsed: string = "local";

  try {
    const result = await generateNamesWithLLM({
      projectName: project.name,
      type: project.type,
      context: project.context,
      audience: project.targetAudience,
      category: project.category,
      market: project.market,
      language: project.language,
      personality: project.personality,
      restrictions: project.restrictions,
      references: project.references,
      previousNames,
    });
    llmCandidates = result.candidates;
    modelUsed = result.modelUsed;
  } catch (err: any) {
    fallbackReason = err?.message ?? String(err);
    console.error("[generate-names] Todos os modelos falharam, usando gerador local:", fallbackReason);
    usedFallback = true;

    const filter: GeneratorFilter = (body.filter as GeneratorFilter) ?? "tech";
    const fallbackGenerated = generateNames(
      project.type as ProjectType,
      filter,
      project.language,
      project.market ?? "Brasil",
      12
    );
    llmCandidates = fallbackGenerated.map((g) => ({
      name: g.name,
      category: filter,
      reasoning: g.scoreDetails.justification,
    }));
  }

  // ─── 2. Deduplicate against existing ───────────────────────────────────────
  const prevSet = new Set(previousNames.map((n) => n.toLowerCase()));
  const unique = llmCandidates.filter((c) => !prevSet.has(c.name.toLowerCase()));

  // ─── 3. Create Round ───────────────────────────────────────────────────────
  const roundCount = await prisma.round.count({ where: { projectId } });
  const roundLabel = usedFallback
    ? `Rodada ${roundCount + 1} — Local (todos os modelos falharam)`
    : `Rodada ${roundCount + 1} — ${modelUsed}`;

  const round = await prisma.round.create({
    data: {
      projectId,
      number: roundCount + 1,
      label: roundLabel,
      filters: JSON.stringify({ source: usedFallback ? "local" : "openai" }),
    },
  });

  // ─── 4. Persist each candidate with full layer analysis ────────────────────
  const savedCandidates = await Promise.all(
    unique.map(async (llm) => {
      const sound = analyzeSoundLayer(llm.name);
      const meaning = analyzeMeaningLayer(llm.name);
      const cultural = analyzeCulturalLayer(llm.name, project.market ?? "Brasil", project.language);
      const functional = analyzeFunctionalLayer(llm.name, project.language);
      const score = computeScore(llm.name, { sound, meaning, cultural, functional }, project.personality ?? undefined);

      // Store LLM metadata in notes as JSON
      const notes = JSON.stringify({
        source: usedFallback ? "local" : "openai",
        llmCategory: llm.category,
        llmReasoning: llm.reasoning,
      });

      return prisma.candidate.create({
        data: {
          projectId,
          roundId: round.id,
          name: llm.name,
          notes,
          soundLayer: { create: sound },
          meaningLayer: { create: meaning },
          culturalLayer: { create: cultural },
          functionalLayer: { create: functional },
          score: { create: score },
        },
        include: {
          soundLayer: true,
          meaningLayer: true,
          culturalLayer: true,
          functionalLayer: true,
          score: true,
        },
      });
    })
  );

  return NextResponse.json(
    { round, candidates: savedCandidates, usedFallback, fallbackReason, modelUsed },
    { status: 201 }
  );
}
