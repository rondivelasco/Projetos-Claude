import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const rounds = await prisma.round.findMany({
    where: { projectId: params.id },
    orderBy: { number: "asc" },
    include: {
      candidates: {
        include: { score: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  return NextResponse.json(rounds);
}
