import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");
  const courseId  = searchParams.get("courseId");

  const where: Record<string, any> = {};
  if (studentId) where.studentId = parseInt(studentId);
  if (courseId)  where.courseId  = parseInt(courseId);

  // Students can only see their own enrollments
  if (session.user.role === "student") {
    where.studentId = parseInt(session.user.id);
  }

  const enrollments = await prisma.courseEnrollment.findMany({
    where,
    include: {
      course:  { select: { id: true, name: true, isActive: true } },
      student: { select: { id: true, username: true } },
    },
    orderBy: { enrolledAt: "desc" },
  });
  return NextResponse.json(enrollments);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["admin", "super_admin"].includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { courseId, studentId } = await req.json();
  if (!courseId || !studentId)
    return NextResponse.json({ error: "courseId and studentId are required" }, { status: 400 });

  const isSuperAdmin = session.user.role === "super_admin";
  const tenantId     = session.user.tenantId ? parseInt(session.user.tenantId) : null;

  // Verify the course belongs to this tenant
  const course = await prisma.course.findFirst({
    where: isSuperAdmin
      ? { id: parseInt(courseId) }
      : { id: parseInt(courseId), tenantId: tenantId ?? -1 },
  });
  if (!course)
    return NextResponse.json({ error: "Course not found in this tenant" }, { status: 404 });

  // Verify the student belongs to this tenant
  const student = await prisma.user.findFirst({
    where: isSuperAdmin
      ? { id: parseInt(studentId), role: "student" }
      : { id: parseInt(studentId), role: "student", tenantId: tenantId ?? -1 },
  });
  if (!student)
    return NextResponse.json({ error: "Student not found in this tenant" }, { status: 404 });

  try {
    const enrollment = await prisma.courseEnrollment.create({
      data: { courseId: parseInt(courseId), studentId: parseInt(studentId) },
      include: { course: { select: { id: true, name: true } } },
    });
    return NextResponse.json(enrollment, { status: 201 });
  } catch (e: any) {
    if (e?.code === "P2002")
      return NextResponse.json({ error: "Student already enrolled in this course" }, { status: 400 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["admin", "super_admin"].includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { courseId, studentId } = await req.json();
  if (!courseId || !studentId)
    return NextResponse.json({ error: "courseId and studentId are required" }, { status: 400 });

  const isSuperAdmin = session.user.role === "super_admin";
  const tenantId     = session.user.tenantId ? parseInt(session.user.tenantId) : null;

  // Verify the course belongs to this tenant before unenrolling
  const course = await prisma.course.findFirst({
    where: isSuperAdmin
      ? { id: parseInt(courseId) }
      : { id: parseInt(courseId), tenantId: tenantId ?? -1 },
  });
  if (!course)
    return NextResponse.json({ error: "Course not found in this tenant" }, { status: 404 });

  await prisma.courseEnrollment.deleteMany({
    where: { courseId: parseInt(courseId), studentId: parseInt(studentId) },
  });
  return NextResponse.json({ success: true });
}