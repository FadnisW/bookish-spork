import FormModal from "@/components/formModal";
import Pagination from "@/components/pagination";
import Table from "@/components/table";
import TableSearch from "@/components/tableSearch";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { ITEMS_PER_PAGE } from "@/lib/settings";
import { Attendance, Prisma, Student, Lesson, Teacher } from "@prisma/client";
import Image from "next/image";
import AttendanceFilters from "@/components/AttendanceFilters";
import AttendanceSpreadsheet from "@/components/AttendanceSpreadsheet";
import ConsumerAttendanceDashboard from "@/components/ConsumerAttendanceDashboard";

type AttendanceList = Attendance & {
  student: Student;
  lesson: Lesson & {
    subject: { name: string };
    class: { name: string };
  };
  teacher: Teacher;
};

const columns = [
  { header: "Date", accessor: "date" },
  { header: "Student", accessor: "info" },
  { header: "Class", accessor: "class", className: "hidden md:table-cell" },
  { header: "Lesson", accessor: "lesson", className: "hidden lg:table-cell" },
  { header: "Status", accessor: "status" },
  { header: "Time", accessor: "markedAt", className: "hidden lg:table-cell" },
  { header: "Remark", accessor: "remark", className: "hidden lg:table-cell" },
];

const getStatusColor = (status: string): string => {
  switch (status) {
    case "PRESENT": return "bg-green-100 text-green-800";
    case "ABSENT": return "bg-red-100 text-red-800";
    case "LATE": return "bg-yellow-100 text-yellow-800";
    case "EXCUSED": return "bg-blue-100 text-blue-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

const renderRow = (item: AttendanceList) => (
  <tr key={item.id} className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight">
    <td className="p-4">
      {new Intl.DateTimeFormat("en-IN", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(item.date))}
    </td>
    <td className="flex items-center gap-4 p-4">
      <div className="w-8 h-8 rounded-full bg-lamaSky flex items-center justify-center text-sm font-semibold">
        {item.student.name.charAt(0)}
      </div>
      <div className="flex flex-col">
        <h3 className="font-semibold">{item.student.name} {item.student.surname}</h3>
      </div>
    </td>
    <td className="hidden md:table-cell p-4">{item.lesson.class.name}</td>
    <td className="hidden lg:table-cell p-4">{item.lesson.subject.name}</td>
    <td className="p-4">
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(item.status)}`}>
        {item.status}
      </span>
    </td>
    <td className="hidden lg:table-cell p-4 text-xs text-gray-500">
      {new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }).format(new Date(item.markedAt))}
    </td>
    <td className="hidden lg:table-cell p-4 text-xs text-gray-500">{item.remarks || "--"}</td>
  </tr>
);

const AttendanceListPage = async (props: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) => {
  const searchParams = await props.searchParams;
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  
  // ==========================================
  // STAFF VIEW (Admin & Teacher) - Phase 2
  // ==========================================
  if (role === "admin" || role === "teacher") {
     const { date, classId, lessonId } = searchParams;
     
     // 1. Fetch Dropdown Data
     let classes = [];
     let lessons = [];
     if (role === "admin") {
        classes = await prisma.class.findMany({ select: { id: true, name: true, supervisorId: true }});
        lessons = await prisma.lesson.findMany({ select: { id: true, name: true, classId: true, day: true, teacherId: true, subject: { select: { name: true } }, teacher: { select: { name: true, surname: true } } }});
     } else {
        classes = await prisma.class.findMany({
           where: { OR: [ { supervisorId: userId! }, { lessons: { some: { teacherId: userId! } } } ] },
           select: { id: true, name: true, supervisorId: true, capacity: true }
        });
        lessons = await prisma.lesson.findMany({
           where: { OR: [ { teacherId: userId! }, { class: { supervisorId: userId! } } ] },
           select: { id: true, name: true, classId: true, day: true, teacherId: true, subject: { select: { name: true } }, teacher: { select: { name: true, surname: true } } }
        });
     }

     // 2. Determine Spreadsheet State
     let spreadsheetData = null;
     if (date && classId && lessonId) {
        const students = await prisma.student.findMany({
           where: { classId: parseInt(classId) },
           select: { id: true, name: true, surname: true },
           orderBy: { name: 'asc' }
        });

        let targetLessons: number[] = [];
        if (lessonId !== "whole_day") {
           targetLessons = [parseInt(lessonId)];
        } else {
           const jsDate = new Date(date);
           const dayNum = jsDate.getDay();

           // Day enum covers MONDAY–SATURDAY (indices 1–6)
           // Only block Sunday (index 0) — school runs Mon–Sat
           const SCHOOL_DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
           if (dayNum >= 1 && dayNum <= 6) {
             const dayStr = SCHOOL_DAYS[dayNum - 1]; // 1→MON … 6→SAT
             const clsLessons = await prisma.lesson.findMany({
               where: { classId: parseInt(classId), day: dayStr as any },
             });
             targetLessons = clsLessons.map(l => l.id);
           }
           // dayNum === 0 (Sunday) → targetLessons stays [], page shows empty state
        }

        const startOfDay = new Date(new Date(date).setHours(0,0,0,0));
        const endOfDay = new Date(new Date(date).setHours(23,59,59,999));
        
        const existingRecords = await prisma.attendance.findMany({
           where: {
              lessonId: { in: targetLessons },
              date: { gte: startOfDay, lte: endOfDay }
           }
        });

        const LOCK_MS = 48 * 60 * 60 * 1000;
        const now = new Date().getTime();

        spreadsheetData = students.map(s => {
           const sRecords = existingRecords.filter(r => r.studentId === s.id);
           const record = sRecords[0]; 
           
           let locked = false;
           if (record && (record as any).updatedAt) {
              if (now - new Date((record as any).updatedAt).getTime() > LOCK_MS) locked = true;
           }

           return {
              id: s.id,
              name: s.name,
              surname: s.surname,
              existingStatus: record?.status,
              existingRemark: record?.remarks || "",
              existingMinutesLate: (record as any)?.minutesLate,
              locked
           };
        });
     }

     return (
       <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0 min-h-[70vh]">
          <h1 className="text-xl font-bold mb-4 text-gray-800">Attendance Registry</h1>
          <AttendanceFilters classes={classes} lessons={lessons as any} currentUserId={userId!} role={role} />
          
          {spreadsheetData ? (
             <AttendanceSpreadsheet 
               students={spreadsheetData as any} 
               classId={parseInt(classId!)} 
               date={date!} 
               lessonId={lessonId === "whole_day" ? undefined : parseInt(lessonId!)} 
             />
          ) : (
             <div className="w-full flex flex-col items-center justify-center p-12 mt-4 bg-gray-50 border-2 border-dashed border-gray-200 rounded-md">
                <Image src="/attendance.png" alt="" width={64} height={64} className="opacity-50 mb-4" />
                <h2 className="text-lg font-semibold text-gray-600">No Scope Selected</h2>
                <p className="text-sm text-gray-400">Please choose a Date, Class, and Scope to begin taking attendance.</p>
             </div>
          )}
       </div>
     );
  }

  // ==========================================
  // CONSUMER VIEW (Student & Parent) - Legacy List (Will be replaced in Phase 3)
  // ==========================================
  const { page, ...queryParams } = searchParams;
  const currentPage = Number(page) || 1; // Keep currentPage as it was, as the instruction's replacement was syntactically incorrect.
  // The auth() call and role derivation are already done at the top of the function.
  // const { userId: currentUserId, sessionClaims } = await auth(); // This line is redundant as auth() is called above.
  // const role = (sessionClaims?.metadata as { role?: string })?.role; // This line is redundant as role is derived above.
  const query: Prisma.AttendanceWhereInput = {};
  
  if (role === "student") query.studentId = userId!;
  else if (role === "parent") query.student = { parentId: userId! };

  const [data, count] = await prisma.$transaction([
    prisma.attendance.findMany({
      where: query,
      include: {
        student: true,
        lesson: { include: { subject: { select: { name: true } }, class: { select: { name: true } } } },
        teacher: { select: { name: true, surname: true } },
      },
      orderBy: { date: "desc" },
    }),
    prisma.attendance.count({ where: query }),
  ]);

  return (
    <div className="bg-transparent rounded-md flex-1 m-4 mt-0">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">My Attendance Overview</h1>
      </div>
      <ConsumerAttendanceDashboard records={data as any} role={role!} studentName="" />
    </div>
  );
};

export default AttendanceListPage;
