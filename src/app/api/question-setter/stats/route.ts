// app/api/question-setter/stats/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "question_setter") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const createdBy = parseInt(session.user.id);
    
    // Get start of current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [total, thisMonth, subjects] = await Promise.all([
      prisma.question.count({ where: { createdBy } }),
      prisma.question.count({ 
        where: { 
          createdBy,
          createdAt: { gte: startOfMonth }
        } 
      }),
      prisma.question.findMany({
        where: { createdBy },
        select: { subjectId: true },
        distinct: ["subjectId"],
      }),
    ]);

    return NextResponse.json({ 
      total, 
      thisMonth,
      subjects: subjects.length 
    });
  } catch (error) {
    console.error("QS stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}