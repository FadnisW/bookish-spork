/*
  Warnings:

  - Added the required column `teacherId` to the `Attendance` table without a default value. This is not possible if the table is not empty.
  - Made the column `markedBy` on table `Attendance` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "teacherId" TEXT NOT NULL,
ALTER COLUMN "markedBy" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
