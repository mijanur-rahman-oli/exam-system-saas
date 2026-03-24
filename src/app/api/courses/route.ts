import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const isSuperAdmin = session.user.role === "super_admin";
    const tenantId     = session.user.tenantId ? parseInt(session.user.tenantId) : null;

    // Allow explicit tenantId override for super_admin only
    const requestedTenantId = searchParams.get("tenantId");
    const effectiveTenantId = isSuperAdmin && requestedTenantId
      ? parseInt(requestedTenantId)
      : tenantId;

    const where = isSuperAdmin && !requestedTenantId
      ? {}
      : { tenantId: effectiveTenantId ?? -1 };

    const courses = await prisma.course.findMany({
      where,
      include: { _count: { select: { exams: true, enrollments: true } } },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(courses);
  } catch (error) {
    console.error("GET /api/courses error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["admin", "super_admin"].includes(session.user.role))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { name, description, tenantId: bodyTenantId } = await req.json();
    if (!name?.trim())
      return NextResponse.json({ error: "Course name is required" }, { status: 400 });

    const isSuperAdmin = session.user.role === "super_admin";
    const tenantId = isSuperAdmin && bodyTenantId
      ? parseInt(bodyTenantId)
      : session.user.tenantId
        ? parseInt(session.user.tenantId)
        : null;

    if (!tenantId)
      return NextResponse.json({ error: "tenantId is required" }, { status: 400 });

    const course = await prisma.course.create({
      data: { name: name.trim(), description: description || null, tenantId },
    });
    return NextResponse.json(course, { status: 201 });
  } catch (e: any) {
    if (e?.code === "P2002")
      return NextResponse.json({ error: "Course name already exists in this tenant" }, { status: 400 });
    console.error("POST /api/courses error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}