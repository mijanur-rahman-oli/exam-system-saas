import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "student")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const studentId = parseInt(session.user.id);

    const enrollments = await prisma.courseEnrollment.findMany({
      where: { studentId },
      select: { courseId: true },
    });
    const courseIds = enrollments.map(e => e.courseId);

    const completed = await prisma.examAttempt.findMany({
      where: { studentId, isCompleted: true },
      select: { examId: true, exam: { select: { retakeAllowed: true } } },
    });
    const lockedIds = completed.filter(a => !a.exam.retakeAllowed).map(a => a.examId);

    const exams = await prisma.exam.findMany({
      where: {
        isActive:  true,
        courseId:  { in: courseIds },
        id:        { notIn: lockedIds },
      },
      include: {
        subject: { select: { name: true } },
        course:  { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return NextResponse.json(exams);
  } catch (error) {
    console.error("GET upcoming-exams error:", error);
    return NextResponse.json([], { status: 200 });
  }
}