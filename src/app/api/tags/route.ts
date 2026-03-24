import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const search       = searchParams.get("search") ?? "";
    const isSuperAdmin = session.user.role === "super_admin";
    const tenantId     = session.user.tenantId ? parseInt(session.user.tenantId) : null;

    const where: Record<string, any> = {};

    if (!isSuperAdmin) {
      // Show only tags belonging to this tenant OR global tags
      where.OR = [
        { tenantId: tenantId },
        { tenantId: null },
      ];
    }

    if (search) {
      const nameFilter = { name: { contains: search, mode: "insensitive" as const } };
      if (where.OR) {
        // Combine tenant scope AND search
        where.AND = [{ OR: where.OR }, nameFilter];
        delete where.OR;
      } else {
        where.name = { contains: search, mode: "insensitive" as const };
      }
    }

    const tags = await prisma.tag.findMany({
      where,
      select: {
        id: true, name: true, tenantId: true,
        _count: { select: { questions: true } },
      },
      orderBy: { name: "asc" },
      take: 50,
    });

    return NextResponse.json(tags);
  } catch (error) {
    console.error("GET /api/tags error:", error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["admin", "super_admin", "question_setter"].includes(session.user.role))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { name } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const tenantId = session.user.role === "super_admin"
      ? null
      : session.user.tenantId
        ? parseInt(session.user.tenantId)
        : null;

    const existing = await prisma.tag.findFirst({
      where: { name: name.trim().toLowerCase(), tenantId },
    });
    if (existing) return NextResponse.json({ error: "Tag already exists" }, { status: 400 });

    const tag = await prisma.tag.create({
      data: { name: name.trim().toLowerCase(), tenantId },
    });
    return NextResponse.json(tag, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002")
      return NextResponse.json({ error: "Tag already exists" }, { status: 400 });
    console.error("POST /api/tags error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}