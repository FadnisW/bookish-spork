import FormModal from "@/components/formModal";
import Pagination from "@/components/pagination";
import Table from "@/components/table";
import TableSearch from "@/components/tableSearch";
import { role, currentUserId } from "@/lib/utils";
import prisma from "@/lib/prisma";
import { ITEMS_PER_PAGE } from "@/lib/settings";
import { Attendance, Prisma, Student, Lesson, Teacher } from "@prisma/client";
import Image from "next/image";

type AttendanceList = Attendance & {
  student: Student;
  lesson: Lesson & {
    subject: { name: string };
    class: { name: string };
  };
  teacher: Teacher;
};

const columns = [
  {
    header: "Date",
    accessor: "date",
  },
  {
    header: "Student",
    accessor: "info",
  },
  {
    header: "Student ID",
    accessor: "studentId",
    className: "hidden md:table-cell",
  },
  {
    header: "Class",
    accessor: "class",
    className: "hidden md:table-cell",
  },
  {
    header: "Lesson",
    accessor: "lesson",
    className: "hidden lg:table-cell",
  },
  {
    header: "Status",
    accessor: "status",
  },
  {
    header: "Marked By",
    accessor: "markedBy",
    className: "hidden lg:table-cell",
  },
  {
    header: "Time",
    accessor: "markedAt",
    className: "hidden lg:table-cell",
  },
  {
    header: "Remark",
    accessor: "remark",
    className: "hidden lg:table-cell",
  },
  ...(role === "admin" || role === "teacher"
    ? [
        {
          header: "Actions",
          accessor: "action",
        },
      ]
    : []),
];

const getStatusColor = (status: string): string => {
  switch (status) {
    case "PRESENT":
      return "bg-green-100 text-green-800";
    case "ABSENT":
      return "bg-red-100 text-red-800";
    case "LATE":
      return "bg-yellow-100 text-yellow-800";
    case "EXCUSED":
      return "bg-blue-100 text-blue-800";
    case "HALF_DAY":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const renderRow = (item: AttendanceList) => (
  <tr
    key={item.id}
    className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
  >
    <td className="p-4">
      {new Intl.DateTimeFormat("en-IN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date(item.date))}
    </td>
    <td className="flex items-center gap-4 p-4">
      <div className="w-8 h-8 rounded-full bg-lamaSky flex items-center justify-center text-sm font-semibold">
        {item.student.name.charAt(0)}
      </div>
      <div className="flex flex-col">
        <h3 className="font-semibold">
          {item.student.name} {item.student.surname}
        </h3>
        <p className="text-xs text-gray-500">{item.lesson.class.name}</p>
      </div>
    </td>
    <td className="hidden md:table-cell p-4">{item.studentId}</td>
    <td className="hidden md:table-cell p-4">{item.lesson.class.name}</td>
    <td className="hidden lg:table-cell p-4">{item.lesson.subject.name}</td>
    <td className="p-4">
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
          item.status
        )}`}
      >
        {item.status}
      </span>
    </td>
    <td className="hidden lg:table-cell p-4">{item.markedBy}</td>
    <td className="hidden lg:table-cell p-4 text-xs text-gray-500">
      {new Intl.DateTimeFormat("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }).format(new Date(item.markedAt))}
    </td>
    <td className="hidden lg:table-cell p-4 text-xs text-gray-500">
      {item.remarks || "--"}
    </td>
    <td className="p-4">
      <div className="flex items-center gap-2">
        {(role === "admin" || role === "teacher") && (
          <>
            <FormModal table="attendance" type="update" data={item} />
            <FormModal table="attendance" type="delete" id={item.id} />
          </>
        )}
      </div>
    </td>
  </tr>
);

const AttendanceListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { page, ...queryParams } = await searchParams;
  const currentPage = Number(page) || 1;

  // Setting up URL Conditions
  const query: Prisma.AttendanceWhereInput = {};
  
  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "studentId":
            query.studentId = value;
            break;
          case "search":
            query.OR = [
              {
                student: {
                  name: { contains: value, mode: "insensitive" },
                },
              },
              {
                lesson: {
                  subject: {
                    name: { contains: value, mode: "insensitive" },
                  },
                },
              },
            ];
            break;
          default:
            break;
        }
      }
    }
  }

  // ROLE CONDITIONS
  switch (role) {
    case "admin":
      break;
    case "teacher":
      query.teacherId = currentUserId!;
      break;
    case "student":
      query.studentId = currentUserId!;
      break;
    case "parent":
      query.student = {
        parentId: currentUserId!,
      };
      break;
    default:
      break;
  }

  const [data, count] = await prisma.$transaction([
    prisma.attendance.findMany({
      where: query,
      include: {
        student: true,
        lesson: {
          include: {
            subject: { select: { name: true } },
            class: { select: { name: true } },
          },
        },
        teacher: { select: { name: true, surname: true } },
      },
      orderBy: {
        date: "desc",
      },
      take: ITEMS_PER_PAGE,
      skip: ITEMS_PER_PAGE * (currentPage - 1),
    }),
    prisma.attendance.count({
      where: query,
    }),
  ]);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">
          All Attendance
        </h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {(role === "admin" || role === "teacher") && (
              <FormModal table="attendance" type="create" />
            )}
          </div>
        </div>
      </div>
      {/* LIST */}
      <Table columns={columns} renderRow={renderRow} data={data} />
      {/* PAGINATION */}
      <Pagination currentPage={currentPage} count={count} />
    </div>
  );
};

export default AttendanceListPage;
// import FormModal from "@/components/formModal";
// import Pagination from "@/components/pagination";
// import Table from "@/components/table";
// import TableSearch from "@/components/tableSearch";
// import { role, attendanceData, AttendanceRecord } from "@/lib/data";
// import Image from "next/image";

// type AttendanceColumn = {
//   header: string;
//   accessor: string;
//   className?: string;
// };

// const columns: AttendanceColumn[] = [
//   {
//     header: "Date",
//     accessor: "date",
//   },
//   {
//     header: "Student",
//     accessor: "info",
//   },
//   {
//     header: "Student ID",
//     accessor: "studentId",
//     className: "hidden md:table-cell",
//   },
//   {
//     header: "Class",
//     accessor: "class",
//     className: "hidden md:table-cell",
//   },
//   {
//     header: "Lesson",
//     accessor: "lesson",
//     className: "hidden lg:table-cell",
//   },
//   {
//     header: "Status",
//     accessor: "status",
//   },
//   {
//     header: "Marked By",
//     accessor: "markedBy",
//     className: "hidden lg:table-cell",
//   },
//   {
//     header: "Time",
//     accessor: "markedAt",
//     className: "hidden lg:table-cell",
//   },
//   {
//     header: "Remark",
//     accessor: "remark",
//     className: "hidden lg:table-cell",
//   },
//   ...(role === "admin" || role === "teacher"
//     ? [
//         {
//           header: "Actions",
//           accessor: "action",
//         },
//       ]
//     : []),
// ];

// const getStatusColor = (status: string): string => {
//   switch (status) {
//     case "PRESENT":
//       return "bg-green-100 text-green-800";
//     case "ABSENT":
//       return "bg-red-100 text-red-800";
//     case "LATE":
//       return "bg-yellow-100 text-yellow-800";
//     case "EXCUSED":
//       return "bg-blue-100 text-blue-800";
//     default:
//       return "bg-gray-100 text-gray-800";
//   }
// };

// const AttendanceListPage = () => {
//   const renderRow = (item: AttendanceRecord) => (
//     <tr
//       key={item.id}
//       className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
//     >
//       <td className="p-4">{item.date}</td>
//       <td className="flex items-center gap-4 p-4">
//         <div className="w-8 h-8 rounded-full bg-lamaSky flex items-center justify-center text-sm font-semibold">
//           {item.studentName.charAt(0)}
//         </div>
//         <div className="flex flex-col">
//           <h3 className="font-semibold">{item.studentName}</h3>
//           <p className="text-xs text-gray-500">{item.class}</p>
//         </div>
//       </td>
//       <td className="hidden md:table-cell p-4">{item.studentId}</td>
//       <td className="hidden md:table-cell p-4">{item.class}</td>
//       <td className="hidden lg:table-cell p-4">{item.lesson}</td>
//       <td className="p-4">
//         <span
//           className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
//             item.status
//           )}`}
//         >
//           {item.status}
//         </span>
//       </td>
//       <td className="hidden lg:table-cell p-4">{item.markedBy}</td>
//       <td className="hidden lg:table-cell p-4 text-xs text-gray-500">
//         {item.markedAt}
//       </td>
//       <td className="hidden lg:table-cell p-4 text-xs text-gray-500">
//         {item.remark || "NULL"}
//       </td>
//       <td className="p-4">
//         <div className="flex items-center gap-2">
//           <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaSky">
//             <Image src="/edit.png" alt="" width={16} height={16} />
//           </button>
//           {role === "admin" && (
//             <FormModal table="attendance" type="delete" id={item.id} />
//           )}
//         </div>
//       </td>
//     </tr>
//   );

//   return (
//     <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
//       {/* TOP */}
//       <div className="flex items-center justify-between">
//         <h1 className="hidden md:block text-lg font-semibold">
//           All Attendance
//         </h1>
//         <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
//           <TableSearch />
//           <div className="flex items-center gap-4 self-end">
//             <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
//               <Image src="/filter.png" alt="" width={14} height={14} />
//             </button>
//             <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
//               <Image src="/sort.png" alt="" width={14} height={14} />
//             </button>
//             {(role === "admin" || role === "teacher") && (
//               <FormModal table="attendance" type="create" />
//             )}
//           </div>
//         </div>
//       </div>
//       {/* LIST */}
//       <Table columns={columns} renderRow={renderRow} data={attendanceData} />
//       {/* PAGINATION */}
//       <Pagination currentPage={1} count={10} />
//     </div>
//   );
// };

// export default AttendanceListPage;
