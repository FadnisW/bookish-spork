
import Image from "next/image";
import CountChart from "@/components/countChart";
import prisma from "@/lib/prisma";

const CountChartContainer = async ({ date }: { date?: string }) => {
  const demographicData = await prisma.student.groupBy({ by: ["sex"], _count: true });
  const totalBoys = demographicData.find((d) => d.sex === "MALE")?._count || 0;
  const totalGirls = demographicData.find((d) => d.sex === "FEMALE")?._count || 0;
  const totalStudents = totalBoys + totalGirls;

  // Real-time Attendance Logic
  const queryDate = date ? new Date(date) : new Date();
  queryDate.setHours(0,0,0,0);
  
  const endOfDay = new Date(queryDate);
  endOfDay.setHours(23,59,59,999);

  const attendanceToday = await prisma.attendance.findMany({
    where: {
      date: { gte: queryDate, lte: endOfDay },
      status: { in: ["PRESENT", "LATE"] }
    },
    select: { studentId: true, student: { select: { sex: true } } }
  });

  const uniquePresent = new Set();
  let boysPresent = 0;
  let girlsPresent = 0;

  attendanceToday.forEach(a => {
    if (!uniquePresent.has(a.studentId)) {
       uniquePresent.add(a.studentId);
       if (a.student.sex === "MALE") boysPresent++;
       else girlsPresent++;
    }
  });

  const totalAbsent = totalStudents - (boysPresent + girlsPresent);

  return (
    <div className="bg-white rounded-xl w-full h-full p-4 relative shadow-sm">
      {/* TITLE */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-lg font-semibold text-gray-700">Today&apos;s Registry</h1>
        <Image src="/moreDark.png" alt="" width={20} height={20} />
      </div>
      {/* CHART */}
      <CountChart 
        boysPresent={boysPresent} 
        girlsPresent={girlsPresent} 
        totalAbsent={totalAbsent} 
        totalStudents={totalStudents} 
      />
      {/* BOTTOM METRICS */}
      <div className="flex justify-center gap-8 mt-2">
        <div className="flex flex-col gap-1 items-center">
          <div className="w-5 h-5 bg-lamaSky rounded-full shadow-sm" />
          <h1 className="font-bold text-sm tracking-tight text-gray-800">{boysPresent}</h1>
          <h2 className="text-[11px] text-gray-400 font-semibold uppercase">Boys (P)</h2>
        </div>
        <div className="flex flex-col gap-1 items-center">
          <div className="w-5 h-5 bg-lamaYellow rounded-full shadow-sm" />
          <h1 className="font-bold text-sm tracking-tight text-gray-800">{girlsPresent}</h1>
          <h2 className="text-[11px] text-gray-400 font-semibold uppercase">Girls (P)</h2>
        </div>
        <div className="flex flex-col gap-1 items-center">
          <div className="w-5 h-5 bg-red-400 rounded-full shadow-sm" />
          <h1 className="font-bold text-sm tracking-tight text-gray-800">{totalAbsent}</h1>
          <h2 className="text-[11px] text-gray-400 font-semibold uppercase">Absent</h2>
        </div>
      </div>
    </div>
  );
};

export default CountChartContainer;
