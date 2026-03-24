import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["admin", "super_admin"].includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = parseInt(params.id);
  const isSuperAdmin = session.user.role === "super_admin";
  const tenantId = session.user.tenantId ? parseInt(session.user.tenantId) : null;

  // Admin can only delete their own tenant's tags
  if (!isSuperAdmin) {
    const tag = await prisma.tag.findUnique({ where: { id } });
    if (!tag) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (tag.tenantId !== tenantId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.tag.delete({ where: { id } });
  return NextResponse.json({ success: true });
}