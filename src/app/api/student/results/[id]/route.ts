import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "student") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const attempt = await prisma.examAttempt.findFirst({
      where: {
        id: parseInt(params.id),
        studentId: parseInt(session.user.id),
        isCompleted: true,
      },
      include: {
        exam: {
          select: {
            id: true,
            examName: true,
            totalMarks: true,
            passingMarks: true,
            duration: true,
            course: { select: { name: true } },
          },
        },
        answers: {
          include: {
            question: {
              select: {
                question: true,
                questionImage: true,
                optionA: true,
                optionB: true,
                optionC: true,
                optionD: true,
                optionAImage: true,
                optionBImage: true,
                optionCImage: true,
                optionDImage: true,
                correctAnswer: true,
                explanation: true,
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json({ error: "Result not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: attempt.id,
      exam: attempt.exam,
      score: attempt.score,
      totalMarks: attempt.exam.totalMarks,
      passingMarks: attempt.exam.passingMarks,
      submittedAt: attempt.submittedAt,
      answers: attempt.answers,
    });
  } catch (error) {
    console.error("Get result error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}