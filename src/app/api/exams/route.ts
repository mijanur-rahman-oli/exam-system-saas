import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get("courseId");

  const where: Record<string, any> = {};

  // Super admin sees all; others scoped to their tenant
  if (session.user.role !== "super_admin" && session.user.tenantId) {
    where.tenantId = parseInt(session.user.tenantId);
  }
  if (courseId) where.courseId = parseInt(courseId);

  const exams = await prisma.exam.findMany({
    where,
    include: {
      subject:      { select: { name: true } },
      course:       { select: { name: true } },
      creator:      { select: { username: true } },
      examQuestions: { select: { id: true, marks: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(exams);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["admin", "super_admin"].includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { examName, description, subjectId, courseId, duration,
          scheduleTime, retakeAllowed, isActive, questions,
          passingMarks, tenantId } = body;

  if (!examName || !subjectId || !courseId || !duration)
    return NextResponse.json({ error: "examName, subjectId, courseId, and duration are required" }, { status: 400 });

  const tid = tenantId ?? session.user.tenantId;
  if (!tid) return NextResponse.json({ error: "tenantId required" }, { status: 400 });

  const totalMarks = Array.isArray(questions)
    ? questions.reduce((s: number, q: any) => s + (q.marks || 1), 0)
    : 0;

  const exam = await prisma.exam.create({
    data: {
      examName,
      description,
      tenantId:     parseInt(tid),
      courseId:     parseInt(courseId),
      subjectId:    parseInt(subjectId),
      duration:     parseInt(duration),
      totalMarks,
      passingMarks: passingMarks ? parseInt(passingMarks) : null,
      scheduleTime: scheduleTime ? new Date(scheduleTime) : null,
      retakeAllowed: retakeAllowed ?? false,
      isActive:     isActive ?? false,
      createdBy:    parseInt(session.user.id),
      examQuestions: Array.isArray(questions) && questions.length > 0 ? {
        create: questions.map((q: any) => ({ questionId: q.questionId, marks: q.marks || 1 })),
      } : undefined,
    },
    include: {
      subject:       { select: { name: true } },
      course:        { select: { name: true } },
      examQuestions: { select: { id: true, marks: true } },
    },
  });

  return NextResponse.json(exam, { status: 201 });
}