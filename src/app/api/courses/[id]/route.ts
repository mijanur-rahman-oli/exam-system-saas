import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function assertTenantAccess(courseId: number, session: any) {
  if (session.user.role === "super_admin") return true;
  const tenantId = session.user.tenantId ? parseInt(session.user.tenantId) : null;
  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { tenantId: true } });
  if (!course) return false;
  return course.tenantId === tenantId;
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const course = await prisma.course.findUnique({
    where: { id: parseInt(params.id) },
    include: { _count: { select: { exams: true, enrollments: true } } },
  });
  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(course);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["admin", "super_admin"].includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = parseInt(params.id);
  if (!(await assertTenantAccess(id, session)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const course = await prisma.course.update({
    where: { id },
    data: {
      name:        body.name,
      description: body.description,
      isActive:    body.isActive,
    },
  });
  return NextResponse.json(course);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["admin", "super_admin"].includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = parseInt(params.id);
  if (!(await assertTenantAccess(id, session)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await prisma.course.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (e?.code === "P2003")
      return NextResponse.json({ error: "Course has enrolled students or exams; cannot delete" }, { status: 400 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}