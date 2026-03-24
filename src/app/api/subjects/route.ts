import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const scope        = searchParams.get("scope"); // "all" = every subject visible to this tenant
    const isSuperAdmin = session.user.role === "super_admin";
    const tenantId     = session.user.tenantId ? parseInt(session.user.tenantId) : null;

    // super_admin sees all subjects
    // admin/question_setter with scope=all sees their tenant's subjects (for dropdowns in forms)
    // default (no scope): same — return tenant subjects
    let where: Record<string, any> = {};

    if (!isSuperAdmin) {
      // Normal users only see subjects that belong to their tenant OR global subjects (tenantId null)
      where = {
        OR: [
          { tenantId: tenantId },
          { tenantId: null },
        ],
      };
    }

    const subjects = await prisma.subject.findMany({
      where,
      select: {
        id: true, name: true, description: true, createdAt: true, tenantId: true,
        _count: { select: { questions: true, exams: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(subjects);
  } catch (error) {
    console.error("GET /api/subjects error:", error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["admin", "super_admin"].includes(session.user.role))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { name, description } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    // super_admin creates global subjects (tenantId: null)
    // admin creates tenant-scoped subjects
    const tenantId = session.user.role === "super_admin"
      ? null
      : session.user.tenantId
        ? parseInt(session.user.tenantId)
        : null;

    // Check duplicate within same scope
    const existing = await prisma.subject.findFirst({
      where: { name: name.trim(), tenantId: tenantId },
    });
    if (existing)
      return NextResponse.json({ error: "Subject already exists in your tenant" }, { status: 400 });

    const subject = await prisma.subject.create({
      data: { name: name.trim(), description: description || null, tenantId },
    });
    return NextResponse.json(subject, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002")
      return NextResponse.json({ error: "Subject already exists" }, { status: 400 });
    console.error("POST /api/subjects error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}