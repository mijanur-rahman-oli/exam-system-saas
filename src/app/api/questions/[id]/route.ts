import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Helper: verify the question belongs to the current user's tenant
async function assertTenantAccess(questionId: number, session: any) {
  if (session.user.role === "super_admin") return true;
  const tenantId = session.user.tenantId ? parseInt(session.user.tenantId) : null;
  const q = await prisma.question.findUnique({
    where: { id: questionId },
    select: { creator: { select: { tenantId: true } } },
  });
  if (!q) return false;
  return q.creator.tenantId === tenantId;
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = parseInt(params.id);
  const q = await prisma.question.findUnique({
    where: { id },
    include: {
      subject: { select: { id: true, name: true } },
      creator: { select: { id: true, username: true } },
      tags:    { include: { tag: true } },
    },
  });
  if (!q) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Tenant guard
  if (!(await assertTenantAccess(id, session)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json(q);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["admin", "super_admin", "question_setter"].includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = parseInt(params.id);
  if (!(await assertTenantAccess(id, session)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();

  const updated = await prisma.question.update({
    where: { id },
    data: {
      status:       body.status,
      difficulty:   body.difficulty,
      marks:        body.marks     ? parseInt(body.marks)     : undefined,
      explanation:  body.explanation,
      question:     body.question,
      optionA:      body.optionA,
      optionB:      body.optionB,
      optionC:      body.optionC   ?? null,
      optionD:      body.optionD   ?? null,
      correctAnswer: body.correctAnswer,
      isMultipleAnswer: body.isMultipleAnswer,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["admin", "super_admin", "question_setter"].includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = parseInt(params.id);
  if (!(await assertTenantAccess(id, session)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await prisma.question.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (e?.code === "P2003")
      return NextResponse.json({ error: "Question is used in exams and cannot be deleted" }, { status: 400 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}