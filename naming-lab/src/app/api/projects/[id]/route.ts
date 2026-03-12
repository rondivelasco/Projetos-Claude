import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      diagnoses: { orderBy: { createdAt: "desc" }, take: 1 },
      rounds: { orderBy: { number: "asc" } },
      decision: true,
      _count: { select: { candidates: true } },
    },
  });

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(project);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const project = await prisma.project.update({
    where: { id: params.id },
    data: {
      name: body.name,
      type: body.type,
      context: body.context,
      targetAudience: body.targetAudience,
      market: body.market,
      language: body.language,
      category: body.category,
      personality: body.personality,
      references: body.references,
      restrictions: body.restrictions,
      tags: body.tags ? JSON.stringify(body.tags) : undefined,
      isFavorite: body.isFavorite,
    },
  });
  return NextResponse.json(project);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await prisma.project.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
