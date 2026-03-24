import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "student")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const studentId = parseInt(session.user.id);

  const enrollments = await prisma.courseEnrollment.findMany({
    where: { studentId },
    select: { courseId: true },
  });
  const courseIds = enrollments.map((e) => e.courseId);

  const [totalExams, completedAttempts] = await Promise.all([
    prisma.exam.count({ where: { isActive: true, courseId: { in: courseIds } } }),
    prisma.examAttempt.findMany({
      where: { studentId, isCompleted: true },
      include: { exam: { select: { totalMarks: true } } },
    }),
  ]);

  const scores = completedAttempts.map((a) => {
    const tm = a.exam.totalMarks;
    return tm && tm > 0 ? Math.round(((a.score ?? 0) / tm) * 100) : a.score ?? 0;
  });

  return NextResponse.json({
    totalExams,
    completedExams:  completedAttempts.length,
    pendingExams:    Math.max(0, totalExams - completedAttempts.length),
    averageScore:    scores.length > 0 ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : 0,
    enrolledCourses: courseIds.length,
  });
}