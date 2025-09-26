/*
  Warnings:

  - Added the required column `yearLevel` to the `Course` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Course" ADD COLUMN     "description" TEXT,
ADD COLUMN     "yearLevel" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Student" ADD COLUMN     "academicYearId" TEXT,
ADD COLUMN     "semesterId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."Student" ADD CONSTRAINT "Student_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "public"."AcademicYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Student" ADD CONSTRAINT "Student_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "public"."Semester"("id") ON DELETE SET NULL ON UPDATE CASCADE;
