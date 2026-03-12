import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const candidates = await prisma.candidate.findMany({
    where: { projectId: params.id },
    orderBy: { createdAt: "desc" },
    include: {
      soundLayer: true,
      meaningLayer: true,
      culturalLayer: true,
      functionalLayer: true,
      score: true,
    },
  });
  return NextResponse.json(candidates);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();

  const candidate = await prisma.candidate.create({
    data: {
      projectId: params.id,
      roundId: body.roundId ?? null,
      name: body.name,
      notes: body.notes ?? null,
    },
    include: { soundLayer: true, meaningLayer: true, culturalLayer: true, functionalLayer: true, score: true },
  });

  return NextResponse.json(candidate, { status: 201 });
}
