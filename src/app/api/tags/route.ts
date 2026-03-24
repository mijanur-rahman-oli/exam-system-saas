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
    const scope        = searchParams.get("scope"); // "all" = super admin view
    const isSuperAdmin = session.user.role === "super_admin";
    const tenantId     = session.user.tenantId ? parseInt(session.user.tenantId) : null;

    // Super admin with scope=all sees everything
    // Tenants see only tags used by their questions
    // On create question forms: show tenant tags + allow creating new ones
    let tagIds: number[] | undefined = undefined;

    if (!isSuperAdmin && tenantId && scope !== "all") {
      const questionTags = await prisma.questionTag.findMany({
        where: { question: { creator: { tenantId } } },
        select: { tagId: true },
        distinct: ["tagId"],
      });
      tagIds = questionTags.map(qt => qt.tagId);
    }

    const where: any = {};
    if (tagIds !== undefined) where.id = { in: tagIds.length > 0 ? tagIds : [-1] };
    if (search) where.name = { contains: search, mode: "insensitive" };

    const tags = await prisma.tag.findMany({
      where,
      include: { _count: { select: { questions: true } } },
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
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name } = await req.json();
    if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

    const tag = await prisma.tag.upsert({
      where:  { name: name.toLowerCase().trim() },
      update: {},
      create: { name: name.toLowerCase().trim() },
    });
    return NextResponse.json(tag, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}