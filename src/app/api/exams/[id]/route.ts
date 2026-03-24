import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const exam = await prisma.exam.findUnique({
    where: { id: parseInt(params.id) },
    include: {
      subject:  true,
      course:   true,
      creator:  { select: { username: true } },
      examQuestions: {
        include: {
          question: {
            include: { tags: { include: { tag: true } } },
          },
        },
      },
      examAttempts: {
        include: { student: { select: { username: true } } },
        orderBy: { submittedAt: "desc" },
        take: 20,
      },
    },
  });

  if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });
  return NextResponse.json(exam);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["admin","super_admin"].includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id   = parseInt(params.id);
  const body = await req.json();
  const { questions, ...examData } = body;

  try {
    const exam = await prisma.$transaction(async (tx) => {
      const updated = await tx.exam.update({
        where: { id },
        data: {
          examName:     examData.examName     || undefined,
          description:  examData.description  ?? null,
          subjectId:    examData.subjectId    ? parseInt(examData.subjectId)  : undefined,
          courseId:     examData.courseId     ? parseInt(examData.courseId)   : undefined,
          duration:     examData.duration     ? parseInt(examData.duration)   : undefined,
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
  if (!session?.user || !["admin","super_admin"].includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = parseInt(params.id);
  await prisma.$transaction(async (tx) => {
    const attempts = await tx.examAttempt.findMany({ where: { examId: id }, select: { id: true } });
    const attemptIds = attempts.map(a => a.id);
    if (attemptIds.length > 0) await tx.examAnswer.deleteMany({ where: { attemptId: { in: attemptIds } } });
    await tx.examAttempt.deleteMany({ where: { examId: id } });
    await tx.examQuestion.deleteMany({ where: { examId: id } });
    await tx.exam.delete({ where: { id } });
  });

  return NextResponse.json({ success: true });
}