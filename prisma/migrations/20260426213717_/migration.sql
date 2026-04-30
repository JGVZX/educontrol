/*
  Warnings:

  - You are about to drop the column `completivo` on the `Grade` table. All the data in the column will be lost.
  - You are about to drop the column `extraordinario` on the `Grade` table. All the data in the column will be lost.
  - You are about to drop the column `p1` on the `Grade` table. All the data in the column will be lost.
  - You are about to drop the column `p2` on the `Grade` table. All the data in the column will be lost.
  - You are about to drop the column `p3` on the `Grade` table. All the data in the column will be lost.
  - You are about to drop the column `p4` on the `Grade` table. All the data in the column will be lost.
  - You are about to drop the column `matricula` on the `Student` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[studentId,subjectId,year,mes]` on the table `Grade` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[rne]` on the table `Student` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `folio` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rne` to the `Student` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('PENDIENTE', 'REVISION', 'RESUELTO');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('ALTA', 'MEDIA', 'BAJA');

-- DropIndex
DROP INDEX "Grade_studentId_subjectId_year_key";

-- DropIndex
DROP INDEX "Student_matricula_key";

-- AlterTable
ALTER TABLE "Grade" DROP COLUMN "completivo",
DROP COLUMN "extraordinario",
DROP COLUMN "p1",
DROP COLUMN "p2",
DROP COLUMN "p3",
DROP COLUMN "p4",
ADD COLUMN     "disciplina" INTEGER,
ADD COLUMN     "examenFinal" INTEGER,
ADD COLUMN     "isLocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mes" TEXT NOT NULL DEFAULT 'SEPTIEMBRE',
ADD COLUMN     "practica" INTEGER,
ADD COLUMN     "tarea" INTEGER,
ADD COLUMN     "teoria" INTEGER;

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "matricula",
ADD COLUMN     "actaNacimientoUrl" TEXT,
ADD COLUMN     "certificadoMedicoUrl" TEXT,
ADD COLUMN     "folio" TEXT NOT NULL,
ADD COLUMN     "rne" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "issue" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'PENDIENTE',
    "priority" "TicketPriority" NOT NULL DEFAULT 'BAJA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "docenteId" TEXT NOT NULL,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Grade_studentId_subjectId_year_mes_key" ON "Grade"("studentId", "subjectId", "year", "mes");

-- CreateIndex
CREATE UNIQUE INDEX "Student_rne_key" ON "Student"("rne");

-- CreateIndex
CREATE INDEX "Student_rne_idx" ON "Student"("rne");

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_docenteId_fkey" FOREIGN KEY ("docenteId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
