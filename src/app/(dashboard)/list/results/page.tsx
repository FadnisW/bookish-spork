import FormContainer from "@/components/formContainer";
import Pagination from "@/components/pagination";
import Table from "@/components/table";
import TableSearch from "@/components/tableSearch";
import prisma from "@/lib/prisma";
import { ITEMS_PER_PAGE } from "@/lib/settings";
import { Prisma } from "@prisma/client";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";

const ResultListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { sessionClaims, userId } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const currentUserId = userId;

  const { page, ...queryParams } = await searchParams;
  const currentPage = Number(page) || 1;

  //Settingup Url Conditions
  const query: Prisma.ResultWhereInput = {};
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
                exam: {
                  title: { contains: value, mode: "insensitive" },
                },
              },
              {
                assignment: {
                  title: { contains: value, mode: "insensitive" },
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
      query.OR = [
        { exam: { lesson: { teacherId: currentUserId! } } },
        { assignment: { lesson: { teacherId: currentUserId! } } },
      ];
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

  const [dataResp, count] = await prisma.$transaction([
    prisma.result.findMany({
      where: query,
      include: {
        student: {
          select: {
            name: true,
            surname: true,
          },
        },
        exam: {
          include: {
            lesson: {
              select: {
                class: { select: { name: true } },
                teacher: { select: { name: true, surname: true } },
              },
            },
          },
        },
        assignment: {
          include: {
            lesson: {
              select: {
                class: { select: { name: true } },
                teacher: { select: { name: true, surname: true } },
              },
            },
          },
        },
      },
      orderBy: {
        id: "desc",
      },
      take: ITEMS_PER_PAGE,
      skip: ITEMS_PER_PAGE * (currentPage - 1),
    }),
    prisma.result.count({
      where: query,
    }),
  ]);

  const data = dataResp.map((item) => {
    const assessment = item.exam || item.assignment;

    if (!assessment) return null;

    const isExam = "startTime" in assessment;

    return {
      id: item.id,
      title: assessment.title,
      studentName: item.student.name,
      studentSurname: item.student.surname,
      teacherName: assessment.lesson.teacher.name,
      teacherSurname: assessment.lesson.teacher.surname,
      score: item.score,
      // @ts-ignore: Prisma cache workaround for the new schema column
      feedback: item.feedback, // Include the newly added feedback property
      className: assessment.lesson.class.name,
      startTime: isExam ? assessment.startTime : assessment.startDate,
      // Pass the raw data below so the Form can map back safely to examId / assignmentId natively
      examId: item.examId,
      assignmentId: item.assignmentId,
      studentId: item.studentId,
    };
  }).filter(Boolean); // Filter out any nulls

  // Fetch Authorized Dropdown Data (Students, Exams, Assignments)
  let studentsData: any[] = [];
  let examsData: any[] = [];
  let assignmentsData: any[] = [];

  if (role === "admin" || role === "teacher") {
    // 1. Fetch Students
    // If teacher, fetch students enrolled in their classes. If admin, fetch all students.
    studentsData = await prisma.student.findMany({
      where: role === "teacher" ? {
        class: { lessons: { some: { teacherId: currentUserId! } } },
      } : undefined,
      select: { id: true, name: true, surname: true },
      orderBy: { name: "asc" },
    });

    // 2. Fetch Exams (that belong to the teacher, or all for admin)
    examsData = await prisma.exam.findMany({
      where: role === "teacher" ? { lesson: { teacherId: currentUserId! } } : undefined,
      include: {
        lesson: {
          select: {
            subject: { select: { name: true } },
            teacher: { select: { name: true, surname: true } },
          },
        },
      },
      orderBy: { title: "asc" },
    });

    // 3. Fetch Assignments (that belong to the teacher, or all for admin)
    assignmentsData = await prisma.assignment.findMany({
      where: role === "teacher" ? { lesson: { teacherId: currentUserId! } } : undefined,
      include: {
        lesson: {
          select: {
            subject: { select: { name: true } },
            teacher: { select: { name: true, surname: true } },
          },
        },
      },
      orderBy: { title: "asc" },
    });
  }

  const relatedData = { students: studentsData, exams: examsData, assignments: assignmentsData };

  const columns = [
    {
      header: "Title",
      accessor: "title",
    },
    {
      header: "Student",
      accessor: "student",
    },
    {
      header: "Score",
      accessor: "score",
      className: "hidden md:table-cell",
    },
    {
      header: "Feedback",
      accessor: "feedback",
      className: "hidden md:table-cell",
    },
    {
      header: "Teacher",
      accessor: "teacher",
      className: "hidden md:table-cell",
    },
    {
      header: "Class",
      accessor: "class",
      className: "hidden md:table-cell",
    },
    {
      header: "Date",
      accessor: "date",
      className: "hidden md:table-cell",
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

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Results</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
          </div>
        </div>
      </div>
      {/* LIST */}
      <Table columns={columns} renderRow={(item: any) => (
        <tr
          key={item.id}
          className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
        >
          <td className="flex items-center gap-4 p-4">{item.title}</td>
          <td>{item.studentName + " " + item.studentSurname}</td>
          <td className="hidden md:table-cell font-semibold">{item.score}</td>
          <td className="hidden md:table-cell text-gray-500 italic relative group">
            {item.feedback ? (
              <>
                <span className="inline-block max-w-32 truncate">{item.feedback}</span>
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-max max-w-xs bg-gray-700/90 text-white text-xs rounded-md p-2 shadow-lg z-50 whitespace-normal">
                  {item.feedback}
                  <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-700/90"></div>
                </div>
              </>
            ) : (
              "-"
            )}
          </td>
          <td className="hidden md:table-cell">{item.teacherName + " " + item.teacherSurname}</td>
          <td className="hidden md:table-cell">{item.className}</td>
          <td className="hidden md:table-cell">{new Intl.DateTimeFormat("en-IN", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            }).format(new Date(item.startTime))}</td>
          <td>
            <div className="flex items-center gap-2">
              {(role === "admin" || role === "teacher") && (
                <>
                  <FormContainer table="result" type="update" data={item} relatedData={relatedData} />
                  <FormContainer table="result" type="delete" id={item.id} />
                </>
              )}
            </div>
          </td>
        </tr>
      )} data={data} />
      {/* PAGINATION */}
      <Pagination currentPage={currentPage} count={count} />
    </div>
  );
};

export default ResultListPage;