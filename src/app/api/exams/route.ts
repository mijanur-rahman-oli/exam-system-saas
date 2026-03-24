import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const courseId     = searchParams.get("courseId");
    const isSuperAdmin = session.user.role === "super_admin";
    const tenantId     = session.user.tenantId ? parseInt(session.user.tenantId) : null;

    const where: Record<string, any> = {};

    if (!isSuperAdmin) {
      where.tenantId = tenantId ?? -1;
    }
    if (courseId) where.courseId = parseInt(courseId);

    const exams = await prisma.exam.findMany({
      where,
      include: {
        subject:       { select: { id: true, name: true } },
        course:        { select: { id: true, name: true } },
        creator:       { select: { id: true, username: true } },
        examQuestions: { select: { id: true, marks: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(exams);
  } catch (error) {
    console.error("GET /api/exams error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["admin", "super_admin"].includes(session.user.role))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const {
      examName, description, subjectId, courseId, duration,
      scheduleTime, retakeAllowed, isActive, questions,
      passingMarks, tenantId: bodyTenantId,
    } = body;

    if (!examName?.trim() || !subjectId || !courseId || !duration)
      return NextResponse.json(
        { error: "examName, subjectId, courseId, and duration are required" },
        { status: 400 },
      );

    const isSuperAdmin = session.user.role === "super_admin";
    const tenantId = isSuperAdmin && bodyTenantId
      ? parseInt(bodyTenantId)
      : session.user.tenantId
        ? parseInt(session.user.tenantId)
        : null;

    if (!tenantId)
      return NextResponse.json({ error: "tenantId is required" }, { status: 400 });

    // Verify the course belongs to this tenant
    const course = await prisma.course.findFirst({
      where: { id: parseInt(courseId), tenantId },
    });
    if (!course)
      return NextResponse.json({ error: "Course not found in this tenant" }, { status: 400 });

    const totalMarks = Array.isArray(questions)
      ? questions.reduce((s: number, q: any) => s + (q.marks || 1), 0)
      : 0;

    const exam = await prisma.exam.create({
      data: {
        examName:      examName.trim(),
        description:   description || null,
        tenantId,
        courseId:      parseInt(courseId),
        subjectId:     parseInt(subjectId),
        duration:      parseInt(duration),
        totalMarks,
        passingMarks:  passingMarks ? parseInt(passingMarks) : null,
        scheduleTime:  scheduleTime ? new Date(scheduleTime) : null,
        retakeAllowed: retakeAllowed ?? false,
        isActive:      isActive ?? false,
        createdBy:     parseInt(session.user.id),
        examQuestions: Array.isArray(questions) && questions.length > 0 ? {
          create: questions.map((q: any) => ({
            questionId: q.questionId,
            marks:      q.marks ?? 1,
          })),
        } : undefined,
      },
      include: {
        subject:       { select: { id: true, name: true } },
        course:        { select: { id: true, name: true } },
        examQuestions: { select: { id: true, marks: true } },
      },
    });

    return NextResponse.json(exam, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/exams error:", error);
    return NextResponse.json({ error: "Internal server error", detail: error.message }, { status: 500 });
  }
}