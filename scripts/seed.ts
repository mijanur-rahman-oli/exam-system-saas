import { PrismaClient, Role, Difficulty, QuestionStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding SaaS platform...");

  // ── 1. Super Admin (no tenant) ─────────────────────────────────────────────
  const superAdminPassword = await bcrypt.hash("superadmin@123", 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: "sheikhmijanurrahmanoli@gmail.com" },
    update: {},
    create: {
      username:   "superadmin",
      email:      "sheikhmijanurrahmanoli@gmail.com",
      password:   superAdminPassword,
      role:       Role.super_admin,
      isVerified: true,
    },
  });
  console.log("✅ Super admin:", superAdmin.email);

  // ── 2. Default Tenant ──────────────────────────────────────────────────────
  const tenant = await prisma.tenant.upsert({
    where: { slug: "default" },
    update: {},
    create: {
      name:     "Meson Academy",
      slug:     "default",
      isActive: true,
    },
  });
  console.log("✅ Tenant:", tenant.name);

  // ── 3. Tenant Admin ────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@default.com" },
    update: {},
    create: {
      tenantId:   tenant.id,
      username:   "admin",
      email:      "admin@default.com",
      password:   adminPassword,
      role:       Role.admin,
      isVerified: true,
    },
  });
  console.log("✅ Admin:", admin.email);

  // ── 4. Question Setter ─────────────────────────────────────────────────────
  const qsPassword = await bcrypt.hash("setter123", 10);
  const setter = await prisma.user.upsert({
    where: { email: "setter@default.com" },
    update: {},
    create: {
      tenantId:   tenant.id,
      username:   "question_setter",
      email:      "setter@default.com",
      password:   qsPassword,
      role:       Role.question_setter,
      isVerified: true,
    },
  });
  console.log("✅ Question setter:", setter.email);

  // ── 5. Student ─────────────────────────────────────────────────────────────
  const studentPassword = await bcrypt.hash("student123", 10);
  const student = await prisma.user.upsert({
    where: { email: "student@default.com" },
    update: {},
    create: {
      tenantId:   tenant.id,
      username:   "student_one",
      email:      "student@default.com",
      password:   studentPassword,
      role:       Role.student,
      isVerified: true,
    },
  });
  console.log("✅ Student:", student.email);

  // ── 6. Courses ─────────────────────────────────────────────────────────────
  const courseNames = ["SAT Prep", "Medical Entrance", "Grade 10 Math"];
  const courses = await Promise.all(
    courseNames.map((name) =>
      prisma.course.upsert({
        where: { tenantId_name: { tenantId: tenant.id, name } },
        update: {},
        create: { tenantId: tenant.id, name, isActive: true },
      })
    )
  );
  console.log("✅ Courses:", courses.map((c) => c.name).join(", "));

  // ── 7. Enroll student in all courses ──────────────────────────────────────
  for (const course of courses) {
    await prisma.courseEnrollment.upsert({
      where: { courseId_studentId: { courseId: course.id, studentId: student.id } },
      update: {},
      create: { courseId: course.id, studentId: student.id },
    });
  }
  console.log("✅ Student enrolled in all courses");

  // ── 8. Tags ────────────────────────────────────────────────────────────────
  const tagNames = [
    "algebra", "geometry", "calculus", "trigonometry",
    "physics", "chemistry", "biology",
    "english", "reading-comprehension", "vocabulary",
    "hard", "medium", "easy",
    "sat", "medical", "grade10",
  ];
  const tags = await Promise.all(
    tagNames.map((name) =>
      prisma.tag.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  );
  console.log("✅ Tags:", tags.length, "created");

  // ── 9. Subject ─────────────────────────────────────────────────────────────
  const subject = await prisma.subject.upsert({
    where: { id: 1 },
    update: {},
    create: { name: "Mathematics", description: "Core mathematics" },
  }).catch(() =>
    prisma.subject.create({ data: { name: "Mathematics", description: "Core mathematics" } })
  );
  console.log("✅ Subject:", subject.name);

  // ── 10. Sample question ────────────────────────────────────────────────────
  const q = await prisma.question.create({
    data: {
      subjectId:       subject.id,
      status:          QuestionStatus.published,
      question:        "If $x^2 + 5x + 6 = 0$, what are the values of $x$?",
      optionA:         "x = 2, x = 3",
      optionB:         "x = -2, x = -3",
      optionC:         "x = 1, x = 6",
      optionD:         "x = -1, x = -6",
      correctAnswer:   "B",
      isMultipleAnswer: false,
      explanation:     "Factor: $(x+2)(x+3) = 0$, so $x = -2$ or $x = -3$",
      marks:           2,
      difficulty:      Difficulty.medium,
      createdBy:       setter.id,
    },
  });

  // Tag the question
  const algebraTag = tags.find((t) => t.name === "algebra")!;
  const satTag     = tags.find((t) => t.name === "sat")!;
  await prisma.questionTag.createMany({
    data: [
      { questionId: q.id, tagId: algebraTag.id },
      { questionId: q.id, tagId: satTag.id },
    ],
    skipDuplicates: true,
  });
  console.log("✅ Sample question created with tags");

  // ── 11. Sample exam ────────────────────────────────────────────────────────
  const exam = await prisma.exam.create({
    data: {
      tenantId:     tenant.id,
      courseId:     courses[0].id,
      subjectId:    subject.id,
      examName:     "SAT Math Practice #1",
      description:  "Practice exam for SAT Math section",
      duration:     60,
      totalMarks:   2,
      passingMarks: 1,
      isActive:     true,
      retakeAllowed: true,
      createdBy:    admin.id,
      examQuestions: {
        create: [{ questionId: q.id, marks: 2 }],
      },
    },
  });
  console.log("✅ Sample exam created:", exam.examName);

  console.log("\n🎉 Seed complete!");
  console.log("─────────────────────────────");
  console.log("Super Admin : superadmin@platform.com / superadmin123");
  console.log("Admin       : admin@default.com       / admin123");
  console.log("Setter      : setter@default.com      / setter123");
  console.log("Student     : student@default.com     / student123");
  console.log("─────────────────────────────");
}

main()
  .catch((e) => { console.error("❌ Seed failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());