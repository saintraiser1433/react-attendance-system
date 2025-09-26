/*
  Warnings:

  - A unique constraint covering the columns `[code,departmentId]` on the table `Section` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Section_code_departmentId_key" ON "public"."Section"("code", "departmentId");
