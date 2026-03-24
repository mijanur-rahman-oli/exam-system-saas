import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const scope        = searchParams.get("scope"); // "all" = show all subjects (for create forms)
    const isSuperAdmin = session.user.role === "super_admin";
    const tenantId     = session.user.tenantId ? parseInt(session.user.tenantId) : null;

    // "all" scope: return every subject (used in create question / create exam forms)
    // default scope: return only subjects used by this tenant's questions
    let subjectIds: number[] | undefined = undefined;

    if (scope !== "all" && !isSuperAdmin && tenantId) {
      const questions = await prisma.question.findMany({
        where: { creator: { tenantId } },
        select: { subjectId: true },
        distinct: ["subjectId"],
      });
      subjectIds = questions.map(q => q.subjectId);
    }

    const subjects = await prisma.subject.findMany({
      where: subjectIds !== undefined ? { id: { in: subjectIds } } : undefined,
      select: {
        id: true, name: true, description: true, createdAt: true,
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
    if (!session?.user || !["admin","super_admin"].includes(session.user.role))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { name, description } = await req.json();
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const existing = await prisma.subject.findFirst({ where: { name } });
    if (existing) return NextResponse.json({ error: "Subject already exists" }, { status: 400 });

    const subject = await prisma.subject.create({ data: { name, description } });
    return NextResponse.json(subject, { status: 201 });
  } catch (error) {
    console.error("POST /api/subjects error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}