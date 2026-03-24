import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get("tenantId") ?? session.user.tenantId;

  if (!tenantId) return NextResponse.json({ error: "tenantId required" }, { status: 400 });

  const courses = await prisma.course.findMany({
    where: { tenantId: parseInt(tenantId) },
    include: { _count: { select: { exams: true, enrollments: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(courses);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["admin", "super_admin"].includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, description, tenantId } = await req.json();
  const tid = tenantId ?? session.user.tenantId;
  if (!name || !tid)
    return NextResponse.json({ error: "name and tenantId required" }, { status: 400 });

  try {
    const course = await prisma.course.create({
      data: { name, description, tenantId: parseInt(tid) },
    });
    return NextResponse.json(course, { status: 201 });
  } catch (e: any) {
    if (e?.code === "P2002")
      return NextResponse.json({ error: "Course name already exists in this tenant" }, { status: 400 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}