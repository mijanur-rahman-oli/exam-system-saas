import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function assertTenantAccess(questionId: number, session: any) {
  if (session.user.role === "super_admin") return true;
  const tenantId = session.user.tenantId ? parseInt(session.user.tenantId) : null;
  const q = await prisma.question.findUnique({
    where: { id: questionId },
    select: { creator: { select: { tenantId: true } } },
  });
  if (!q) return false;
  return q.creator.tenantId === tenantId;
}

async function fileToDataUrl(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  return `data:${file.type};base64,${base64}`;
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = parseInt(params.id);
  const q = await prisma.question.findUnique({
    where: { id },
    include: {
      subject: { select: { id: true, name: true } },
      creator: { select: { id: true, username: true } },
      tags:    { include: { tag: true } },
    },
  });
  if (!q) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!(await assertTenantAccess(id, session)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json(q);
}

// ─── PUT /api/questions/[id] — full update with optional image replacement ────
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["admin", "super_admin", "question_setter"].includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = parseInt(params.id);
  if (!(await assertTenantAccess(id, session)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const contentType = req.headers.get("content-type") ?? "";
  let body: Record<string, any> = {};

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();

    const getImageUrl = async (key: string): Promise<string | null | undefined> => {
      const val = formData.get(key);
      if (!val) return undefined; // undefined = don't update this field
      if (val instanceof File && val.size > 0) return fileToDataUrl(val);
      if (typeof val === "string") {
        if (val === "__clear__") return null; // explicit clear
        if (val.startsWith("data:") || val.startsWith("http")) return val; // keep existing
      }
      return undefined;
    };

    const rawOpts = formData.get("options");
    const rawTags = formData.get("tags");
    body = {
      subjectId:        formData.get("subjectId"),
      question:         formData.get("question"),
      explanation:      formData.get("explanation"),
      difficulty:       formData.get("difficulty"),
      marks:            formData.get("marks"),
      status:           formData.get("status"),
      isMultipleAnswer: formData.get("isMultipleAnswer") === "true",
      options:          rawOpts ? JSON.parse(rawOpts as string) : undefined,
      tags:             rawTags ? JSON.parse(rawTags as string) : undefined,
      questionImageUrl: await getImageUrl("questionImage"),
      solutionImageUrl: await getImageUrl("solutionImage"),
      optionAImageUrl:  await getImageUrl("optionImage_0"),
      optionBImageUrl:  await getImageUrl("optionImage_1"),
      optionCImageUrl:  await getImageUrl("optionImage_2"),
      optionDImageUrl:  await getImageUrl("optionImage_3"),
    };
  } else {
    body = await req.json();
  }

  // Build correctAnswer from options array if provided
  let correctAnswer = body.correctAnswer;
  let optionA = body.optionA, optionB = body.optionB;
  let optionC = body.optionC ?? null, optionD = body.optionD ?? null;

  if (Array.isArray(body.options)) {
    const opts = body.options;
    const LETTERS = ["A", "B", "C", "D"];
    correctAnswer = opts.map((o: any, i: number) => o.isCorrect ? LETTERS[i] : null).filter(Boolean).join(",");
    optionA = opts[0]?.text ?? "";
    optionB = opts[1]?.text ?? "";
    optionC = opts[2]?.text || null;
    optionD = opts[3]?.text || null;
  }

  // Handle tags update
  const tenantId = session.user.role === "super_admin"
    ? null
    : session.user.tenantId ? parseInt(session.user.tenantId) : null;

  const updateData: any = {
    ...(body.subjectId   && { subjectId: parseInt(body.subjectId) }),
    ...(body.question    && { question: body.question }),
    ...(optionA !== undefined && { optionA }),
    ...(optionB !== undefined && { optionB }),
    optionC, optionD,
    ...(correctAnswer    && { correctAnswer }),
    ...(body.difficulty  && { difficulty: body.difficulty }),
    ...(body.marks       && { marks: parseInt(body.marks) }),
    ...(body.status      && { status: body.status }),
    explanation: body.explanation ?? null,
    isMultipleAnswer: body.isMultipleAnswer ?? false,
  };

  // Only update image fields if they were explicitly provided
  if (body.questionImageUrl !== undefined) updateData.questionImage = body.questionImageUrl;
  if (body.solutionImageUrl !== undefined) updateData.solutionImage = body.solutionImageUrl;
  if (body.optionAImageUrl  !== undefined) updateData.optionAImage  = body.optionAImageUrl;
  if (body.optionBImageUrl  !== undefined) updateData.optionBImage  = body.optionBImageUrl;
  if (body.optionCImageUrl  !== undefined) updateData.optionCImage  = body.optionCImageUrl;
  if (body.optionDImageUrl  !== undefined) updateData.optionDImage  = body.optionDImageUrl;

  // Handle tags
  if (Array.isArray(body.tags)) {
    const tagConnections: { tagId: number }[] = [];
    for (const tagName of body.tags as string[]) {
      const name = tagName.toLowerCase().trim();
      if (!name) continue;
      let tag = await prisma.tag.findFirst({ where: { name, tenantId } });
      if (!tag) tag = await prisma.tag.create({ data: { name, tenantId } });
      tagConnections.push({ tagId: tag.id });
    }
    updateData.tags = {
      deleteMany: {},
      create: tagConnections,
    };
  }

  const updated = await prisma.question.update({
    where: { id },
    data: updateData,
    include: {
      subject: { select: { id: true, name: true } },
      tags:    { include: { tag: true } },
    },
  });

  return NextResponse.json(updated);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["admin", "super_admin", "question_setter"].includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = parseInt(params.id);
  if (!(await assertTenantAccess(id, session)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();

  const updated = await prisma.question.update({
    where: { id },
    data: {
      ...(body.status           !== undefined && { status: body.status }),
      ...(body.difficulty       !== undefined && { difficulty: body.difficulty }),
      ...(body.marks            !== undefined && { marks: parseInt(body.marks) }),
      ...(body.explanation      !== undefined && { explanation: body.explanation }),
      ...(body.question         !== undefined && { question: body.question }),
      ...(body.optionA          !== undefined && { optionA: body.optionA }),
      ...(body.optionB          !== undefined && { optionB: body.optionB }),
      ...(body.optionC          !== undefined && { optionC: body.optionC ?? null }),
      ...(body.optionD          !== undefined && { optionD: body.optionD ?? null }),
      ...(body.correctAnswer    !== undefined && { correctAnswer: body.correctAnswer }),
      ...(body.isMultipleAnswer !== undefined && { isMultipleAnswer: body.isMultipleAnswer }),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["admin", "super_admin", "question_setter"].includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = parseInt(params.id);
  if (!(await assertTenantAccess(id, session)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await prisma.question.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (e?.code === "P2003")
      return NextResponse.json({ error: "Question is used in exams and cannot be deleted" }, { status: 400 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}