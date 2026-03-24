// app/api/admin/users/[id]/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update user verification status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isVerified: true },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isVerified: true,
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: "User verified successfully",
      user: updatedUser 
    });
  } catch (error) {
    console.error("Verify user error:", error);
    return NextResponse.json(
      { error: "Failed to verify user" },
      { status: 500 }
    );
  }
}