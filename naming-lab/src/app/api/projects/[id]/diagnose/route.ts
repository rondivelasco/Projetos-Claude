import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { diagnose } from "@/lib/naming-engine";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({ where: { id: params.id } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const result = diagnose({ project });

  const diagnosis = await prisma.diagnosis.create({
    data: {
      projectId: params.id,
      states: JSON.stringify(result.states),
      symptoms: JSON.stringify(result.symptoms),
      causes: JSON.stringify(result.causes),
      impact: result.impact,
      direction: result.direction,
    },
  });

  return NextResponse.json(diagnosis, { status: 201 });
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const diagnoses = await prisma.diagnosis.findMany({
    where: { projectId: params.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(diagnoses);
}
