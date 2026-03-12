import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateNames } from "@/lib/naming-engine";
import type { GeneratorFilter, ProjectType } from "@/types";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({ where: { id: params.id } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const filter: GeneratorFilter = body.filter ?? "tech";
  const count: number = Math.min(body.count ?? 6, 12);

  const generated = generateNames(
    project.type as ProjectType,
    filter,
    project.language,
    project.market ?? "Brasil",
    count
  );

  // Get or create a round
  const roundCount = await prisma.round.count({ where: { projectId: params.id } });
  const round = await prisma.round.create({
    data: {
      projectId: params.id,
      number: roundCount + 1,
      label: `Rodada ${roundCount + 1} — ${filter}`,
      filters: JSON.stringify({ filter, count }),
    },
  });

  // Persist each candidate with its layers
  const candidates = await Promise.all(
    generated.map(async (g) => {
      const candidate = await prisma.candidate.create({
        data: {
          projectId: params.id,
          roundId: round.id,
          name: g.name,
          soundLayer: { create: g.layers.sound },
          meaningLayer: { create: g.layers.meaning },
          culturalLayer: { create: g.layers.cultural },
          functionalLayer: { create: g.layers.functional },
          score: { create: g.scoreDetails },
        },
        include: {
          soundLayer: true,
          meaningLayer: true,
          culturalLayer: true,
          functionalLayer: true,
          score: true,
        },
      });
      return candidate;
    })
  );

  return NextResponse.json({ round, candidates }, { status: 201 });
}
