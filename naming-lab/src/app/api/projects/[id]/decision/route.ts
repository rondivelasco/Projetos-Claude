import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const decision = await prisma.decision.findUnique({ where: { projectId: params.id } });
  if (!decision) return NextResponse.json(null);
  return NextResponse.json(decision);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();

  const decision = await prisma.decision.upsert({
    where: { projectId: params.id },
    create: {
      projectId: params.id,
      chosenName: body.chosenName,
      candidateId: body.candidateId ?? null,
      justification: body.justification,
      shortlist: JSON.stringify(body.shortlist ?? []),
      discarded: JSON.stringify(body.discarded ?? []),
    },
    update: {
      chosenName: body.chosenName,
      candidateId: body.candidateId ?? null,
      justification: body.justification,
      shortlist: JSON.stringify(body.shortlist ?? []),
      discarded: JSON.stringify(body.discarded ?? []),
    },
  });

  return NextResponse.json(decision);
}
