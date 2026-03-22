import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seed() {
  const students = await prisma.student.findMany();
  const lessons = await prisma.lesson.findMany();
  
  const classLessons = new Map<number, typeof lessons[0]>();
  lessons.forEach(l => {
     if (!classLessons.has(l.classId)) {
        classLessons.set(l.classId, l);
     }
  });

  const statuses = ["PRESENT", "ABSENT", "LATE", "EXCUSED", "HALF_DAY"];
  
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  await prisma.attendance.deleteMany({
    where: { date: { gte: yesterday, lte: tomorrow } }
  });

  const generateAttendance = async (targetDate: Date) => {
    let boyP = 0, girlP = 0, abs = 0;
    const data = students.map(s => {
      const clsLesson = classLessons.get(s.classId);
      if (!clsLesson) return null;
      
      const randStatus = statuses[Math.floor(Math.random() * statuses.length)];
      if (randStatus === "PRESENT" || randStatus === "LATE") {
        if (s.sex === "MALE") boyP++; else girlP++;
      } else {
        abs++;
      }

      return {
        date: targetDate,
        status: randStatus,
        present: randStatus === "PRESENT" || randStatus === "LATE" || randStatus === "EXCUSED",
        studentId: s.id,
        lessonId: clsLesson.id,
        teacherId: clsLesson.teacherId, // Natively correct
        markedBy: "admin",
        updatedBy: "admin"
      };
    }).filter(Boolean);

    await prisma.attendance.createMany({ data: data as any });
    console.log(`[${targetDate.toDateString()}] Seeded! Boys: ${boyP}, Girls: ${girlP}, Absent: ${abs}`);
  };

  await generateAttendance(yesterday);
  await generateAttendance(today);
  await generateAttendance(tomorrow);
  
  console.log("Global attendance seed sequence completed successfully.");
}

seed().catch(console.error).finally(() => prisma.$disconnect());
