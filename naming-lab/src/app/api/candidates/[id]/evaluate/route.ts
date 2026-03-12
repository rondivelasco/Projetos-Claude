import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  analyzeSoundLayer,
  analyzeMeaningLayer,
  analyzeCulturalLayer,
  analyzeFunctionalLayer,
  computeScore,
} from "@/lib/naming-engine";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const candidate = await prisma.candidate.findUnique({
    where: { id: params.id },
    include: { score: true },
  });
  if (!candidate) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const project = await prisma.project.findUnique({ where: { id: candidate.projectId } });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const sound = analyzeSoundLayer(candidate.name);
  const meaning = analyzeMeaningLayer(candidate.name);
  const cultural = analyzeCulturalLayer(candidate.name, project.market ?? "Brasil", project.language);
  const functional = analyzeFunctionalLayer(candidate.name, project.language);
  const score = computeScore(candidate.name, { sound, meaning, cultural, functional }, project.personality ?? undefined);

  // Upsert layers and score
  await prisma.soundLayer.upsert({
    where: { candidateId: params.id },
    create: { candidateId: params.id, ...sound },
    update: sound,
  });
  await prisma.meaningLayer.upsert({
    where: { candidateId: params.id },
    create: { candidateId: params.id, ...meaning },
    update: meaning,
  });
  await prisma.culturalLayer.upsert({
    where: { candidateId: params.id },
    create: { candidateId: params.id, ...cultural },
    update: cultural,
  });
  await prisma.functionalLayer.upsert({
    where: { candidateId: params.id },
    create: { candidateId: params.id, ...functional },
    update: functional,
  });
  await prisma.score.upsert({
    where: { candidateId: params.id },
    create: { candidateId: params.id, ...score },
    update: score,
  });

  const updated = await prisma.candidate.findUnique({
    where: { id: params.id },
    include: { soundLayer: true, meaningLayer: true, culturalLayer: true, functionalLayer: true, score: true },
  });

  return NextResponse.json(updated);
}
