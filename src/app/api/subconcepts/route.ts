// app/api/subconcepts/route.ts
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
    const chapterId = searchParams.get("chapterId");

    if (!chapterId) {
      return NextResponse.json({ error: "chapterId is required" }, { status: 400 });
    }

    const subconcepts = await prisma.subconcept.findMany({
      where: { chapterId: parseInt(chapterId) },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(subconcepts);
  } catch (error) {
    console.error("GET /api/subconcepts error:", error);
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
    const { chapterId, name, description } = body;

    if (!chapterId || !name) {
      return NextResponse.json({ error: "chapterId and name are required" }, { status: 400 });
    }

    // Check for duplicate within chapter
    const existing = await prisma.subconcept.findFirst({
      where: {
        chapterId: parseInt(chapterId),
        name,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A subconcept with this name already exists in this chapter" },
        { status: 400 }
      );
    }

    const subconcept = await prisma.subconcept.create({
      data: {
        chapterId: parseInt(chapterId),
        name,
        description,
      },
    });

    return NextResponse.json(subconcept, { status: 201 });
  } catch (error) {
    console.error("POST /api/subconcepts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}