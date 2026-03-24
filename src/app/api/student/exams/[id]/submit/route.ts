import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "student") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const studentId = parseInt(session.user.id);
    const examId = parseInt(params.id);
    const { attemptId, answers } = await req.json();
    if (!attemptId || !Array.isArray(answers)) {
      return NextResponse.json({ error: "attemptId and answers are required" }, { status: 400 });
    }
    const attempt = await prisma.examAttempt.findFirst({
      where: { id: attemptId, studentId, examId, isCompleted: false },
    });
    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found or already submitted" }, { status: 404 });
    }
    const questions = await prisma.question.findMany({
      where: { id: { in: answers.map((a: any) => a.questionId) } },
      select: { id: true, correctAnswer: true, marks: true },
    });
    const qMap = new Map(questions.map((q) => [q.id, q]));
    let totalScore = 0;
    let totalMarks = 0;
    const answerRecords = answers.map((a: any) => {
      const q = qMap.get(a.questionId);
      const isCorrect = q ? q.correctAnswer === a.selectedAnswer : false;
      const marksEarned = isCorrect && q ? q.marks : 0;
      totalScore += marksEarned;
      if (q) totalMarks += q.marks;
      return { attemptId, questionId: a.questionId, selectedAnswer: a.selectedAnswer, isCorrect, marksEarned };
    });
    const [, updatedAttempt] = await prisma.$transaction([
      prisma.examAnswer.createMany({ data: answerRecords }),
      prisma.examAttempt.update({
        where: { id: attemptId },
        data: { isCompleted: true, score: totalScore, submittedAt: new Date() },
      }),
    ]);
    return NextResponse.json({
      resultId: updatedAttempt.id,
      score: totalScore,
      totalMarks,
      percentage: totalMarks > 0 ? Math.round((totalScore / totalMarks) * 100) : 0,
    });
  } catch (error) {
    console.error("Submit exam error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
