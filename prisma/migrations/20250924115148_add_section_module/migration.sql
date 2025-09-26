/*
  Warnings:

  - You are about to drop the column `section` on the `Schedule` table. All the data in the column will be lost.
  - You are about to drop the column `section` on the `Student` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Schedule" DROP COLUMN "section",
ADD COLUMN     "sectionId" TEXT;

-- AlterTable
ALTER TABLE "public"."Student" DROP COLUMN "section",
ADD COLUMN     "sectionId" TEXT;

-- CreateTable
CREATE TABLE "public"."Section" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Section" ADD CONSTRAINT "Section_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "public"."Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Student" ADD CONSTRAINT "Student_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "public"."Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Schedule" ADD CONSTRAINT "Schedule_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "public"."Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;
