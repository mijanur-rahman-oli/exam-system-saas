import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ─── GET /api/questions ───────────────────────────────────────────────────────
// Returns questions scoped to the current user's tenant.
// Supports filters: search, tags, subjectId, status, difficulty, limit
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const search     = searchParams.get("search");
    const tagNames   = searchParams.getAll("tags").filter(Boolean);
    const subjectId  = searchParams.get("subjectId");
    const status     = searchParams.get("status");
    const difficulty = searchParams.get("difficulty");
    const limit      = Math.min(parseInt(searchParams.get("limit") ?? "100"), 200);

    const isSuperAdmin = session.user.role === "super_admin";
    const tenantId     = session.user.tenantId ? parseInt(session.user.tenantId) : null;

    const where: Record<string, any> = {};

    // ── Tenant scoping ─────────────────────────────────────────────────────
    // Questions don't have tenantId directly; they are scoped via their creator.
    // We restrict to questions created by users in the same tenant.
    if (!isSuperAdmin && tenantId) {
      where.creator = { tenantId };
    }

    if (subjectId) where.subjectId = parseInt(subjectId);
    if (status)    where.status    = status;
    if (difficulty) where.difficulty = difficulty;

    if (search) {
      where.OR = [
        { question: { contains: search, mode: "insensitive" } },
        { optionA:  { contains: search, mode: "insensitive" } },
        { optionB:  { contains: search, mode: "insensitive" } },
      ];
    }

    if (tagNames.length > 0) {
      where.tags = {
        some: {
          tag: { name: { in: tagNames, mode: "insensitive" } },
        },
      };
    }

    const questions = await prisma.question.findMany({
      where,
      include: {
        subject: { select: { id: true, name: true } },
        creator: { select: { id: true, username: true } },
        tags:    { include: { tag: { select: { id: true, name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json(questions);
  } catch (error) {
    console.error("GET /api/questions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── POST /api/questions ──────────────────────────────────────────────────────
// Creates a question scoped to the creator's tenant.
// Accepts multipart/form-data (supports image uploads) OR JSON.
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["admin", "super_admin", "question_setter"].includes(session.user.role))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const contentType = req.headers.get("content-type") ?? "";
    let body: Record<string, any> = {};

    if (contentType.includes("multipart/form-data")) {
      // ── Parse FormData ────────────────────────────────────────────────────
      const formData  = await req.formData();
      const rawOpts   = formData.get("options");
      const rawTags   = formData.get("tags");
      const optsParsed = rawOpts  ? JSON.parse(rawOpts as string)  : [];
      const tagsParsed = rawTags  ? JSON.parse(rawTags as string)  : [];

      // Image upload helper — in production, upload to S3/Cloudinary and return URL.
      // Here we accept URL strings passed via the form for simplicity.
      const getImageUrl = async (key: string): Promise<string | null> => {
        const file = formData.get(key);
        if (!file || typeof file === "string") return null;
        // TODO: Upload (file as File) to your storage provider and return the URL.
        // For now we skip binary storage and return null.
        return null;
      };

      body = {
        subjectId:       formData.get("subjectId"),
        question:        formData.get("question"),
        explanation:     formData.get("explanation") ?? "",
        difficulty:      formData.get("difficulty")  ?? "medium",
        marks:           formData.get("marks")       ?? "1",
        status:          formData.get("status")      ?? "draft",
        isMultipleAnswer: formData.get("isMultipleAnswer") === "true",
        questionImageUrl: await getImageUrl("questionImage"),
        solutionImageUrl: await getImageUrl("solutionImage"),
        optionAImageUrl:  await getImageUrl("optionImage_0"),
        optionBImageUrl:  await getImageUrl("optionImage_1"),
        optionCImageUrl:  await getImageUrl("optionImage_2"),
        optionDImageUrl:  await getImageUrl("optionImage_3"),
        options:  optsParsed,
        tags:     tagsParsed,
      };
    } else {
      body = await req.json();
    }

    const {
      subjectId, question, explanation, difficulty, marks, status,
      isMultipleAnswer, options, tags,
      questionImageUrl, solutionImageUrl,
      optionAImageUrl, optionBImageUrl, optionCImageUrl, optionDImageUrl,
    } = body;

    if (!subjectId || !question?.trim())
      return NextResponse.json({ error: "subjectId and question are required" }, { status: 400 });

    const optList: Array<{ text: string; isCorrect: boolean }> = (options ?? []).filter((o: any) => o.text?.trim() || o.img);
    if (optList.length < 2)
      return NextResponse.json({ error: "At least 2 options are required" }, { status: 400 });
    if (!optList.some((o) => o.isCorrect))
      return NextResponse.json({ error: "At least one correct answer must be selected" }, { status: 400 });

    const [optA, optB, optC, optD] = optList;
    const correctAnswer = optList
      .map((o, i) => (o.isCorrect ? String.fromCharCode(65 + i) : null))
      .filter(Boolean)
      .join(",");

    // ── Resolve tenant-scoped tags ────────────────────────────────────────
    const tenantId = session.user.role === "super_admin"
      ? null
      : session.user.tenantId
        ? parseInt(session.user.tenantId)
        : null;

    const tagConnections: { questionId?: number; tagId: number }[] = [];
    if (Array.isArray(tags) && tags.length > 0) {
      for (const tagName of tags as string[]) {
        const name = tagName.toLowerCase().trim();
        if (!name) continue;
        // Upsert tag within this tenant scope
        let tag = await prisma.tag.findFirst({ where: { name, tenantId } });
        if (!tag) {
          tag = await prisma.tag.create({ data: { name, tenantId } });
        }
        tagConnections.push({ tagId: tag.id });
      }
    }

    const newQuestion = await prisma.question.create({
      data: {
        subjectId:    parseInt(subjectId),
        question:     question.trim(),
        questionImage: questionImageUrl ?? null,
        optionA:  optA?.text ?? "",
        optionB:  optB?.text ?? "",
        optionC:  optC?.text ?? null,
        optionD:  optD?.text ?? null,
        optionAImage: optionAImageUrl ?? null,
        optionBImage: optionBImageUrl ?? null,
        optionCImage: optionCImageUrl ?? null,
        optionDImage: optionDImageUrl ?? null,
        correctAnswer,
        isMultipleAnswer: isMultipleAnswer ?? false,
        explanation:  explanation || null,
        solutionImage: solutionImageUrl ?? null,
        marks:        parseInt(marks) || 1,
        difficulty:   difficulty ?? "medium",
        status:       status ?? "draft",
        createdBy:    parseInt(session.user.id),
        tags: tagConnections.length > 0 ? {
          create: tagConnections,
        } : undefined,
      },
      include: {
        subject: { select: { id: true, name: true } },
        tags:    { include: { tag: true } },
      },
    });

    return NextResponse.json(newQuestion, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/questions error:", error);
    return NextResponse.json({ error: "Internal server error", detail: error.message }, { status: 500 });
  }
}