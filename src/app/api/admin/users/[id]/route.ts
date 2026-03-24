import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["admin","super_admin"].includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = parseInt(params.id);
  // Prevent self-delete
  if (id === parseInt(session.user.id))
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}