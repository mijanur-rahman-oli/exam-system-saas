// app/api/admin/stats/route.ts (updated)
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [
      totalUsers,
      studentCount,
      teacherCount,
      questionSetterCount,
      adminCount,
      totalExams,
      totalQuestions,
      totalAttempts,
      totalSubjects,
      totalChapters,
      totalSubconcepts,
      activeExams,
      avgScore,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "student" } }),
      prisma.user.count({ where: { role: "teacher" } }),
      prisma.user.count({ where: { role: "question_setter" } }),
      prisma.user.count({ where: { role: "admin" } }),
      prisma.exam.count(),
      prisma.question.count(),
      prisma.examAttempt.count(),
      prisma.subject.count(),
      prisma.chapter.count(),
      prisma.subconcept.count(),
      prisma.exam.count({ where: { isActive: true } }),
      prisma.examAttempt.aggregate({ 
        _avg: { score: true },
        _count: true,
      }).then(r => ({
        avg: r._avg.score || 0,
        count: r._count
      })),
    ]);

    return NextResponse.json({
      totalUsers,
      studentCount,
      teacherCount,
      questionSetterCount,
      adminCount,
      totalExams,
      totalQuestions,
      totalAttempts,
      totalSubjects,
      totalChapters,
      totalSubconcepts,
      activeExams,
      avgScore: Math.round((avgScore.avg || 0) * 100) / 100,
      totalAttemptsCount: avgScore.count,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}