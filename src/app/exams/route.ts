// app/api/exams/route.ts
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
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined;
    const subjectId = searchParams.get("subjectId");

    const where: any = {};
    
    if (subjectId && subjectId !== "all") {
      where.subjectId = parseInt(subjectId);
    }

    // Admins see all exams, others see only their own
    if (session.user.role !== "admin") {
      where.createdBy = parseInt(session.user.id);
    }

    const exams = await prisma.exam.findMany({
      where,
      include: {
        subject: { select: { id: true, name: true } },
        creator: { select: { id: true, username: true } },
        examQuestions: {
          include: {
            question: {
              select: {
                id: true,
                question: true,
                marks: true,
              }
            }
          }
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // Calculate total marks for each exam
    const examsWithMarks = exams.map(exam => ({
      ...exam,
      totalMarks: exam.examQuestions.reduce((sum, eq) => sum + eq.marks, 0),
    }));

    return NextResponse.json(examsWithMarks);
  } catch (error) {
    console.error("GET /api/exams error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["admin", "teacher"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      examName,
      description,
      subjectId,
      gradeLevel,
      duration,
      passingMarks,
      scheduleTime,
      isActive,
      retakeAllowed,
      questions,
    } = body;

    // Validate required fields
    if (!examName || !subjectId || !duration || !questions || questions.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields or no questions selected" },
        { status: 400 }
      );
    }

    // Create exam with questions in a transaction
    const exam = await prisma.$transaction(async (tx) => {
      const newExam = await tx.exam.create({
        data: {
          examName,
          description: description || null,
          subjectId: parseInt(subjectId),
          gradeLevel: gradeLevel || null,
          duration: parseInt(duration),
          passingMarks: passingMarks ? parseInt(passingMarks) : null,
          scheduleTime: scheduleTime ? new Date(scheduleTime) : null,
          isActive: isActive || false,
          retakeAllowed: retakeAllowed || false,
          createdBy: parseInt(session.user.id),
        },
      });

      // Add questions to exam
      if (questions && questions.length > 0) {
        await tx.examQuestion.createMany({
          data: questions.map((q: { questionId: number; marks: number }) => ({
            examId: newExam.id,
            questionId: q.questionId,
            marks: q.marks,
          })),
        });
      }

      return newExam;
    });

    return NextResponse.json(exam, { status: 201 });
  } catch (error) {
    console.error("POST /api/exams error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}