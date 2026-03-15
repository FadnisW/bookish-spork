import prisma from "@/lib/prisma";
import Image from "next/image";

const StudentAttendanceCard = async ({ id }: { id: string }) => {
  // Get all attendance records for this student from the start of the current academic year
  const today = new Date();
  const academicYearStart = new Date(today.getFullYear(), 0, 1); // Jan 1st of current year

  const attendance = await prisma.attendance.findMany({
    where: {
      studentId: id,
      date: {
        gte: academicYearStart,
      },
    },
  });

  const totalDays = attendance.length;

  // Count present days using the status enum (PRESENT and LATE both count)
  const presentDays = attendance.filter(
    (day) => day.status === "PRESENT" || day.status === "LATE"
  ).length;

  const percentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  return (
    <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
      <Image
        src="/singleAttendance.png"
        alt=""
        width={24}
        height={24}
        className="w-6 h-6"
      />
      <div className="">
        <h1 className="text-xl font-semibold">
          {totalDays > 0 ? `${percentage}%` : "N/A"}
        </h1>
        <span className="text-sm text-gray-400">Attendance</span>
      </div>
    </div>
  );
};

export default StudentAttendanceCard;
