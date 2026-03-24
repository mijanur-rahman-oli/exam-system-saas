import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId") ?? session.user.id;

  const enrollments = await prisma.courseEnrollment.findMany({
    where: { studentId: parseInt(studentId) },
    include: {
      course: {
        include: {
          _count: { select: { exams: true } },
          exams: {
            where: { isActive: true },
            select: { id:true, examName:true, duration:true, totalMarks:true },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });
  return NextResponse.json(enrollments);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["admin","super_admin"].includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { courseId, studentId } = await req.json();
  if (!courseId || !studentId)
    return NextResponse.json({ error: "courseId and studentId required" }, { status: 400 });

  // Verify course belongs to admin's tenant
  if (session.user.role === "admin" && session.user.tenantId) {
    const course = await prisma.course.findUnique({
      where: { id: parseInt(courseId) },
      select: { tenantId: true },
    });
    if (!course || course.tenantId !== parseInt(session.user.tenantId))
      return NextResponse.json({ error: "Course not in your tenant" }, { status: 403 });
  }

  try {
    const enrollment = await prisma.courseEnrollment.create({
      data: { courseId: parseInt(courseId), studentId: parseInt(studentId) },
    });
    return NextResponse.json(enrollment, { status: 201 });
  } catch (e: any) {
    if (e?.code === "P2002") return NextResponse.json({ error: "Already enrolled" }, { status: 400 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["admin","super_admin"].includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { courseId, studentId } = await req.json();
  await prisma.courseEnrollment.deleteMany({
    where: { courseId: parseInt(courseId), studentId: parseInt(studentId) },
  });
  return NextResponse.json({ success: true });
}