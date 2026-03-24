import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function assertTenantAccess(examId: number, session: any) {
  if (session.user.role === "super_admin") return true;
  const tenantId = session.user.tenantId ? parseInt(session.user.tenantId) : null;
  const exam = await prisma.exam.findUnique({ where: { id: examId }, select: { tenantId: true } });
  if (!exam) return false;
  return exam.tenantId === tenantId;
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const examId = parseInt(params.id);
  if (isNaN(examId)) return NextResponse.json({ error: "Invalid exam ID" }, { status: 400 });

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      subject:  true,
      course:   true,
      creator:  { select: { id: true, username: true } },
      examQuestions: {
        include: {
          question: {
            include: { tags: { include: { tag: true } } },
          },
        },
        orderBy: { id: "asc" },
      },
      examAttempts: {
        include: { student: { select: { id: true, username: true } } },
        orderBy: { startedAt: "desc" },
        take: 20,
      },
    },
  });

  if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

  // Non-super-admins can only see their tenant's exams
  if (session.user.role !== "super_admin") {
    const tenantId = session.user.tenantId ? parseInt(session.user.tenantId) : null;
    // Students can see published exams in their enrolled courses
    if (session.user.role === "student") {
      if (!exam.isActive)
        return NextResponse.json({ error: "Exam not available" }, { status: 403 });
    } else if (exam.tenantId !== tenantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return NextResponse.json(exam);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["admin", "super_admin"].includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = parseInt(params.id);
  if (!(await assertTenantAccess(id, session)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { questions, ...examData } = body;

  try {
    const exam = await prisma.$transaction(async (tx) => {
      const updated = await tx.exam.update({
        where: { id },
        data: {
          examName:     examData.examName     || undefined,
          description:  examData.description  ?? null,
          subjectId:    examData.subjectId    ? parseInt(examData.subjectId)    : undefined,
          courseId:     examData.courseId     ? parseInt(examData.courseId)     : undefined,
          duration:     examData.duration     ? parseInt(examData.duration)     : undefined,
          totalMarks:   examData.totalMarks   ?? null,
          passingMarks: examData.passingMarks ? parseInt(examData.passingMarks) : null,
          scheduleTime: examData.scheduleTime ? new Date(examData.scheduleTime) : null,
          retakeAllowed: examData.retakeAllowed ?? false,
          isActive:     examData.isActive     ?? false,
        },
      });

      if (Array.isArray(questions)) {
        await tx.examQuestion.deleteMany({ where: { examId: id } });
        if (questions.length > 0) {
          await tx.examQuestion.createMany({
            data: questions.map((q: any) => ({
              examId:     id,
              questionId: q.questionId,
              marks:      q.marks ?? 1,
            })),
          });
        }
      }
      return updated;
    });

    return NextResponse.json(exam);
  } catch (err: any) {
    console.error("PATCH exam error:", err);
    return NextResponse.json({ error: "Internal server error", detail: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["admin", "super_admin"].includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = parseInt(params.id);
  if (!(await assertTenantAccess(id, session)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.$transaction(async (tx) => {
    const attempts    = await tx.examAttempt.findMany({ where: { examId: id }, select: { id: true } });
    const attemptIds  = attempts.map((a) => a.id);
    if (attemptIds.length > 0)
      await tx.examAnswer.deleteMany({ where: { attemptId: { in: attemptIds } } });
    await tx.examAttempt.deleteMany({ where: { examId: id } });
    await tx.examQuestion.deleteMany({ where: { examId: id } });
    await tx.exam.delete({ where: { id } });
  });

  return NextResponse.json({ success: true });
}