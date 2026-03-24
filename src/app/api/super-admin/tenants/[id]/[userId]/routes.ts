import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string; userId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "super_admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const userId   = parseInt(params.userId);
  const tenantId = parseInt(params.id);

  // Verify user belongs to this tenant
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tenantId: true, role: true },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.tenantId !== tenantId)
    return NextResponse.json({ error: "User not in this tenant" }, { status: 400 });

  // Remove from tenant (detach, not delete)
  await prisma.user.update({
    where: { id: userId },
    data:  { tenantId: null },
  });

  return NextResponse.json({ success: true });
}