import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/student/exams
// Returns all active exams the student hasn't completed (or can retake)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "student") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const studentId = parseInt(session.user.id);

    const completedAttempts = await prisma.examAttempt.findMany({
      where: { studentId, isCompleted: true },
      select: { examId: true, exam: { select: { retakeAllowed: true } } },
    });

    const lockedExamIds = completedAttempts
      .filter((a) => !a.exam.retakeAllowed)
      .map((a) => a.examId);

    const exams = await prisma.exam.findMany({
      where: { isActive: true, id: { notIn: lockedExamIds } },
      include: { subject: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(exams);
  } catch (error) {
    console.error("Student exams list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}