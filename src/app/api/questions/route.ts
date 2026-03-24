import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

async function saveFile(file: File, dir: string): Promise<string> {
  const uploadDir = join(process.cwd(), "public", "uploads", dir);
  if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });
  const bytes    = await file.arrayBuffer();
  const buffer   = Buffer.from(bytes);
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filename = `${Date.now()}_${safeName}`;
  await writeFile(join(uploadDir, filename), buffer);
  return `/uploads/${dir}/${filename}`;
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const subjectId   = searchParams.get("subjectId");
  const tagNames    = searchParams.getAll("tags");
  const search      = searchParams.get("search");
  const difficulty  = searchParams.get("difficulty");
  const status      = searchParams.get("status");
  const createdByMe = searchParams.get("createdByMe");
  const limit       = searchParams.get("limit");

  const where: Record<string, any> = {};
  if (subjectId)             where.subjectId  = parseInt(subjectId);
  if (difficulty)            where.difficulty = difficulty;
  if (status)                where.status     = status;
  if (createdByMe === "true") where.createdBy  = parseInt(session.user.id);
  if (search)                where.question   = { contains: search, mode: "insensitive" };
  if (tagNames.length > 0)   where.tags       = { some: { tag: { name: { in: tagNames } } } };

  // Tenant isolation — admins and question_setters only see questions
  // created by users in their own tenant
  if (session.user.role !== "super_admin" && session.user.tenantId) {
    where.creator = {
      tenantId: parseInt(session.user.tenantId),
    };
  }

  try {
    const questions = await prisma.question.findMany({
      where,
      include: {
        subject: { select: { name: true } },
        tags:    { include: { tag: true } },
      },
      orderBy: { createdAt: "desc" },
      ...(limit ? { take: parseInt(limit) } : {}),
    });
    return NextResponse.json(questions);
  } catch (err) {
    console.error("[GET /api/questions]", err);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["question_setter","admin","super_admin"].includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const createdBy   = parseInt(session.user.id);
  const contentType = req.headers.get("content-type") ?? "";
  const fields: Record<string,string> = {};
  const files:  Record<string,File>   = {};

  if (contentType.includes("multipart/form-data")) {
    const fd = await req.formData();
    for (const [key, val] of fd.entries()) {
      if (val instanceof File && val.size > 0) files[key] = val;
      else if (typeof val === "string")        fields[key] = val;
    }
  } else {
    Object.assign(fields, await req.json());
  }

  const subjectIdRaw = fields["subjectId"];
  const questionText = fields["question"]?.trim();
  const optionsRaw   = fields["options"];
  const tagsRaw      = fields["tags"];

  if (!subjectIdRaw?.trim()) return NextResponse.json({ error: "subjectId required" }, { status: 400 });
  if (!questionText)         return NextResponse.json({ error: "Question text required" }, { status: 400 });

  let options: { text: string; isCorrect: boolean }[] = [];
  try { options = optionsRaw ? JSON.parse(optionsRaw) : []; }
  catch { return NextResponse.json({ error: "Options JSON malformed" }, { status: 400 }); }

  if (options.length < 2)                return NextResponse.json({ error: "At least 2 options required" }, { status: 400 });
  if (!options.some(o => o.isCorrect))   return NextResponse.json({ error: "Mark at least one correct answer" }, { status: 400 });

  const correctAnswer = options.map((o,i) => o.isCorrect ? String.fromCharCode(65+i) : null).filter(Boolean).join(",");

  let questionImageUrl: string | null = null;
  if (files["questionImage"]) questionImageUrl = await saveFile(files["questionImage"], "question-images");
  const optionImageUrls: (string|null)[] = [null,null,null,null];
  for (let i=0;i<4;i++) if (files[`optionImage_${i}`]) optionImageUrls[i] = await saveFile(files[`optionImage_${i}`], "option-images");
  let solutionImageUrl: string|null = null;
  if (files["solutionImage"]) solutionImageUrl = await saveFile(files["solutionImage"], "solution-images");

  const data: Record<string,any> = {
    subjectId:       parseInt(subjectIdRaw),
    status:          fields["status"] ?? "draft",
    question:        questionText,
    optionA:         options[0]?.text ?? "",
    optionB:         options[1]?.text ?? "",
    optionC:         options[2]?.text ?? null,
    optionD:         options[3]?.text ?? null,
    correctAnswer,
    isMultipleAnswer: fields["isMultipleAnswer"] === "true",
    explanation:     fields["explanation"]?.trim() || null,
    marks:           parseInt(fields["marks"] || "1") || 1,
    difficulty:      (fields["difficulty"] || "medium") as "easy"|"medium"|"hard",
    createdBy,
  };
  if (questionImageUrl)   data.questionImage = questionImageUrl;
  if (optionImageUrls[0]) data.optionAImage  = optionImageUrls[0];
  if (optionImageUrls[1]) data.optionBImage  = optionImageUrls[1];
  if (optionImageUrls[2]) data.optionCImage  = optionImageUrls[2];
  if (optionImageUrls[3]) data.optionDImage  = optionImageUrls[3];
  if (solutionImageUrl)   data.solutionImage = solutionImageUrl;

  let tagNames: string[] = [];
  try { tagNames = tagsRaw ? JSON.parse(tagsRaw) : []; } catch {}

  const question = await prisma.question.create({
    data: {
      ...data,
      tags: tagNames.length > 0 ? {
        create: await Promise.all(tagNames.map(async (name: string) => {
          const tag = await prisma.tag.upsert({
            where:  { name: name.toLowerCase().trim() },
            update: {},
            create: { name: name.toLowerCase().trim() },
          });
          return { tagId: tag.id };
        })),
      } : undefined,
    },
    include: { tags: { include: { tag: true } } },
  });

  return NextResponse.json(question, { status: 201 });
}