import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "student") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const studentId = parseInt(session.user.id);
    const examId = parseInt(params.id);
    const exam = await prisma.exam.findUnique({
      where: { id: examId, isActive: true },
      select: { id: true, duration: true, retakeAllowed: true },
    });
    if (!exam) {
      return NextResponse.json({ error: "Exam not found or not active" }, { status: 404 });
    }
    const existing = await prisma.examAttempt.findFirst({
      where: { examId, studentId, isCompleted: true },
    });
    if (existing && !exam.retakeAllowed) {
      return NextResponse.json({ error: "You have already completed this exam" }, { status: 400 });
    }
    const inProgress = await prisma.examAttempt.findFirst({
      where: { examId, studentId, isCompleted: false },
    });
    if (inProgress) {
      const elapsed = Math.floor((Date.now() - new Date(inProgress.startedAt).getTime()) / 1000);
      const remaining = Math.max(0, exam.duration * 60 - elapsed);
      return NextResponse.json({ attemptId: inProgress.id, duration: exam.duration, remaining });
    }
    const attempt = await prisma.examAttempt.create({
      data: { examId, studentId, startedAt: new Date() },
    });
    return NextResponse.json({ attemptId: attempt.id, duration: exam.duration });
  } catch (error) {
    console.error("Start exam error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
