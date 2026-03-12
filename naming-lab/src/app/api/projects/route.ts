import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const favorites = searchParams.get("favorites") === "true";

  const projects = await prisma.project.findMany({
    where: {
      ...(q ? { name: { contains: q } } : {}),
      ...(favorites ? { isFavorite: true } : {}),
    },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { candidates: true, diagnoses: true } },
      decision: { select: { chosenName: true } },
    },
  });

  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const project = await prisma.project.create({
    data: {
      name: body.name,
      type: body.type,
      context: body.context,
      targetAudience: body.targetAudience,
      market: body.market,
      language: body.language ?? "pt-BR",
      category: body.category,
      personality: body.personality,
      references: body.references,
      restrictions: body.restrictions,
      tags: body.tags ? JSON.stringify(body.tags) : null,
    },
  });

  return NextResponse.json(project, { status: 201 });
}
