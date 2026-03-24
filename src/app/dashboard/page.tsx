import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role;

  if (role === "admin") redirect("/admin");
  if (role === "question_setter") redirect("/question-setter");
  if (role === "student") redirect("/student");

  // fallback
  redirect("/login");
}