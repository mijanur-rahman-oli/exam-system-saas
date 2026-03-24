// app/api/chapters/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get("subjectId");

    if (!subjectId) {
      return NextResponse.json({ error: "subjectId is required" }, { status: 400 });
    }

    const chapters = await prisma.chapter.findMany({
      where: { subjectId: parseInt(subjectId) },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(chapters);
  } catch (error) {
    console.error("GET /api/chapters error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { subjectId, name, description } = body;

    if (!subjectId || !name) {
      return NextResponse.json({ error: "subjectId and name are required" }, { status: 400 });
    }

    // Check for duplicate within subject
    const existing = await prisma.chapter.findFirst({
      where: {
        subjectId: parseInt(subjectId),
        name,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A chapter with this name already exists in this subject" },
        { status: 400 }
      );
    }

    const chapter = await prisma.chapter.create({
      data: {
        subjectId: parseInt(subjectId),
        name,
        description,
        createdBy: parseInt(session.user.id),
      },
    });

    return NextResponse.json(chapter, { status: 201 });
  } catch (error) {
    console.error("POST /api/chapters error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}