/*
  Warnings:

  - The values [teacher] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `grade_level` on the `exams` table. All the data in the column will be lost.
  - You are about to drop the column `chapter_id` on the `questions` table. All the data in the column will be lost.
  - You are about to drop the column `grade_level` on the `questions` table. All the data in the column will be lost.
  - You are about to drop the column `subconcept_id` on the `questions` table. All the data in the column will be lost.
  - You are about to drop the column `grade` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `chapters` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `question_setter_details` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `student_details` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `subconcepts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `teacher_details` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `course_id` to the `exams` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenant_id` to the `exams` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "QuestionStatus" AS ENUM ('draft', 'published');

-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('super_admin', 'admin', 'question_setter', 'student');
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'student';
COMMIT;

-- DropForeignKey
ALTER TABLE "chapters" DROP CONSTRAINT "chapters_created_by_fkey";

-- DropForeignKey
ALTER TABLE "chapters" DROP CONSTRAINT "chapters_subject_id_fkey";

-- DropForeignKey
ALTER TABLE "question_setter_details" DROP CONSTRAINT "question_setter_details_user_id_fkey";

-- DropForeignKey
ALTER TABLE "questions" DROP CONSTRAINT "questions_chapter_id_fkey";

-- DropForeignKey
ALTER TABLE "questions" DROP CONSTRAINT "questions_subconcept_id_fkey";

-- DropForeignKey
ALTER TABLE "student_details" DROP CONSTRAINT "student_details_user_id_fkey";

-- DropForeignKey
ALTER TABLE "subconcepts" DROP CONSTRAINT "subconcepts_chapter_id_fkey";

-- DropForeignKey
ALTER TABLE "teacher_details" DROP CONSTRAINT "teacher_details_user_id_fkey";

-- AlterTable
ALTER TABLE "exams" DROP COLUMN "grade_level",
ADD COLUMN     "course_id" INTEGER NOT NULL,
ADD COLUMN     "tenant_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "questions" DROP COLUMN "chapter_id",
DROP COLUMN "grade_level",
DROP COLUMN "subconcept_id",
ADD COLUMN     "status" "QuestionStatus" NOT NULL DEFAULT 'draft';

-- AlterTable
ALTER TABLE "users" DROP COLUMN "grade",
ADD COLUMN     "tenant_id" INTEGER;

-- DropTable
DROP TABLE "chapters";

-- DropTable
DROP TABLE "question_setter_details";

-- DropTable
DROP TABLE "student_details";

-- DropTable
DROP TABLE "subconcepts";

-- DropTable
DROP TABLE "teacher_details";

-- CreateTable
CREATE TABLE "tenants" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_enrollments" (
    "id" SERIAL NOT NULL,
    "course_id" INTEGER NOT NULL,
    "student_id" INTEGER NOT NULL,
    "enrolled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_tags" (
    "question_id" INTEGER NOT NULL,
    "tag_id" INTEGER NOT NULL,

    CONSTRAINT "question_tags_pkey" PRIMARY KEY ("question_id","tag_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_name_key" ON "tenants"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "courses_tenant_id_name_key" ON "courses"("tenant_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "course_enrollments_course_id_student_id_key" ON "course_enrollments"("course_id", "student_id");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_tags" ADD CONSTRAINT "question_tags_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_tags" ADD CONSTRAINT "question_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
