import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "student")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const attempts = await prisma.examAttempt.findMany({
      where: { studentId: parseInt(session.user.id), isCompleted: true },
      include: {
        exam: {
          select: {
            id: true, examName: true, totalMarks: true,
            course: { select: { name: true } },
            subject: { select: { name: true } },
          },
        },
      },
      orderBy: { submittedAt: "desc" },
      take: 10,
    });

    return NextResponse.json(
      attempts.map(a => ({
        id:          a.id,
        score:       a.score,
        percentage:  a.exam.totalMarks && a.exam.totalMarks > 0
          ? Math.round(((a.score ?? 0) / a.exam.totalMarks) * 100) : 0,
        submittedAt: a.submittedAt,
        exam:        a.exam,
      }))
    );
  } catch (error) {
    console.error("GET /api/student/recent-results error:", error);
    return NextResponse.json([], { status: 200 });
  }
}