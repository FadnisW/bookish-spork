/*
  Warnings:

  - A unique constraint covering the columns `[studentId,lessonId,date]` on the table `Attendance` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'HALF_DAY');

-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "markedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "markedBy" TEXT,
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "status" "AttendanceStatus" NOT NULL DEFAULT 'ABSENT';

-- CreateIndex
CREATE INDEX "Attendance_date_idx" ON "Attendance"("date");

-- CreateIndex
CREATE INDEX "Attendance_studentId_idx" ON "Attendance"("studentId");

-- CreateIndex
CREATE INDEX "Attendance_lessonId_idx" ON "Attendance"("lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_studentId_lessonId_date_key" ON "Attendance"("studentId", "lessonId", "date");
