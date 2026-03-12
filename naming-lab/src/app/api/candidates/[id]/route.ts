import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const updated = await prisma.candidate.update({
    where: { id: params.id },
    data: {
      notes: body.notes,
      isShortlisted: body.isShortlisted,
      isDiscarded: body.isDiscarded,
    },
    include: { soundLayer: true, meaningLayer: true, culturalLayer: true, functionalLayer: true, score: true },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await prisma.candidate.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
