import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["admin", "super_admin"].includes(session.user.role))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isSuperAdmin = session.user.role === "super_admin";
    const tenantId     = session.user.tenantId ? parseInt(session.user.tenantId) : null;

    // Tenant-scoped where clauses
    const tenantWhere   = isSuperAdmin ? {} : { tenantId: tenantId ?? -1 };
    const userWhere     = isSuperAdmin ? {} : { tenantId: tenantId ?? -1 };
    // Questions scoped via creator's tenantId
    const questionWhere = isSuperAdmin ? {} : { creator: { tenantId: tenantId ?? -1 } };

    const [
      totalUsers,
      studentCount,
      questionSetterCount,
      adminCount,
      totalExams,
      totalQuestions,
      totalAttempts,
      totalSubjects,
      totalTags,
      totalCourses,
      activeExams,
      attemptStats,
    ] = await Promise.all([
      prisma.user.count({ where: userWhere }),
      prisma.user.count({ where: { ...userWhere, role: "student" } }),
      prisma.user.count({ where: { ...userWhere, role: "question_setter" } }),
      prisma.user.count({ where: { ...userWhere, role: "admin" } }),
      prisma.exam.count({ where: tenantWhere }),
      prisma.question.count({ where: questionWhere }),
      prisma.examAttempt.count({
        where: isSuperAdmin ? {} : { exam: { tenantId: tenantId ?? -1 } },
      }),
      prisma.subject.count({
        where: isSuperAdmin ? {} : {
          OR: [{ tenantId: tenantId }, { tenantId: null }],
        },
      }),
      prisma.tag.count({
        where: isSuperAdmin ? {} : {
          OR: [{ tenantId: tenantId }, { tenantId: null }],
        },
      }),
      prisma.course.count({ where: tenantWhere }),
      prisma.exam.count({ where: { ...tenantWhere, isActive: true } }),
      prisma.examAttempt.aggregate({
        where: isSuperAdmin ? { isCompleted: true } : { isCompleted: true, exam: { tenantId: tenantId ?? -1 } },
        _avg: { score: true },
        _count: { _all: true },
      }),
    ]);

    return NextResponse.json({
      totalUsers,
      studentCount,
      questionSetterCount,
      adminCount,
      totalExams,
      totalQuestions,
      totalAttempts,
      totalSubjects,
      totalTags,
      totalCourses,
      activeExams,
      avgScore: Math.round((attemptStats._avg.score ?? 0) * 100) / 100,
      completedAttempts: attemptStats._count._all,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}