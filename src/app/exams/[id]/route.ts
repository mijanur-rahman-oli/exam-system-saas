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

    const exam = await prisma.exam.findUnique({
      where: { id: parseInt(params.id), isActive: true },
      include: {
        subject: true,
        examQuestions: {
          include: {
            question: {
              select: {
                id: true,
                question: true,
                optionA: true,
                optionB: true,
                optionC: true,
                optionD: true,
                marks: true,
              },
            },
          },
        },
      },
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found or not active" }, { status: 404 });
    }

    return NextResponse.json(exam);
  } catch (error) {
    console.error("Get exam error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}