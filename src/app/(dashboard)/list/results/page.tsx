import FormContainer from "@/components/formContainer";
import Pagination from "@/components/pagination";
import Table from "@/components/table";
import TableSearch from "@/components/tableSearch";
import prisma from "@/lib/prisma";
import { ITEMS_PER_PAGE } from "@/lib/settings";
import { Prisma } from "@prisma/client";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";
import ClassSubjectFilter from "@/components/ClassSubjectFilter";

const ResultListPage = async (props: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) => {
  const searchParams = await props.searchParams;
  const { sessionClaims, userId } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const currentUserId = userId;

  const { page, classId: classIdParam, subjectId: subjectIdParam, ...queryParams } = await searchParams;
  const currentPage = Number(page) || 1;
  
  const classId = classIdParam ? parseInt(classIdParam) : undefined;
  const subjectId = subjectIdParam ? parseInt(subjectIdParam) : undefined;

  //Settingup Url Conditions
  // --- 1. Fetch Dropdown Data (Classes & Subjects) for Teachers/Admins ---
  let availableClasses: { id: number; name: string }[] = [];
  let availableSubjects: { id: number; name: string }[] = [];

  if (role === "admin" || role === "teacher") {
    const lessonWhere = role === "teacher" ? { teacherId: currentUserId! } : undefined;
    
    // Get unique classes from lessons
    const lessonsForClasses = await prisma.lesson.findMany({
      where: lessonWhere,
      select: { class: { select: { id: true, name: true } } },
      distinct: ['classId'],
    });
    availableClasses = lessonsForClasses.map(l => l.class).sort((a, b) => a.name.localeCompare(b.name));

    // Get unique subjects from lessons
    const lessonsForSubjects = await prisma.lesson.findMany({
      where: lessonWhere,
      select: { subject: { select: { id: true, name: true } } },
      distinct: ['subjectId'],
    });
    availableSubjects = lessonsForSubjects.map(l => l.subject).sort((a, b) => a.name.localeCompare(b.name));
  }

  // --- 2. Determine if we are in "Wait State" (Teacher/Admin needing filters) ---
  const isTeacherOrAdmin = role === "admin" || role === "teacher";
  const needsFilters = isTeacherOrAdmin && (!classId || !subjectId);

  // --- 3. Execute Result Query (ONLY if not in wait state) ---
  let dataResp: any[] = [];
  let count = 0;

  if (!needsFilters) {
     const query: Prisma.ResultWhereInput = {};
     const queryAnd: Prisma.ResultWhereInput[] = [];
     
     // Apply the explicit Class & Subject filters for teachers/admins
     if (isTeacherOrAdmin && classId && subjectId) {
        queryAnd.push({
          OR: [
            { exam: { lesson: { classId, subjectId } } },
            { assignment: { lesson: { classId, subjectId } } }
          ]
        });
     }

     // ... Apply regular search params (studentId, text search) ...
     if (queryParams) {
       for (const [key, value] of Object.entries(queryParams)) {
         if (value !== undefined) {
           switch (key) {
             case "studentId":
               query.studentId = value;
               break;
             case "search":
               queryAnd.push({
                 OR: [
                   { student: { name: { contains: value, mode: "insensitive" } } },
                   { student: { surname: { contains: value, mode: "insensitive" } } },
                   { exam: { title: { contains: value, mode: "insensitive" } } },
                   { exam: { lesson: { teacher: { name: { contains: value, mode: "insensitive" } } } } },
                   { exam: { lesson: { teacher: { surname: { contains: value, mode: "insensitive" } } } } },
                   { exam: { lesson: { class: { name: { contains: value, mode: "insensitive" } } } } },
                   { assignment: { title: { contains: value, mode: "insensitive" } } },
                   { assignment: { lesson: { teacher: { name: { contains: value, mode: "insensitive" } } } } },
                   { assignment: { lesson: { teacher: { surname: { contains: value, mode: "insensitive" } } } } },
                   { assignment: { lesson: { class: { name: { contains: value, mode: "insensitive" } } } } },
                 ]
               });
               break;
           }
         }
       }
     }

     // Apply restrictive Role params if not already overridden by the Class/Subject filters
     if (role === "student") {
        query.studentId = currentUserId!;
     } else if (role === "parent") {
        query.student = { parentId: currentUserId! };
     }

     if (queryAnd.length > 0) {
        query.AND = queryAnd;
     }

     const [rawResp, rawCount] = await prisma.$transaction([
       prisma.result.findMany({
         where: query,
         include: {
           student: { select: { name: true, surname: true } },
           exam: { include: { lesson: { select: { class: { select: { name: true } }, teacher: { select: { name: true, surname: true } }, subject: { select: { name: true } } } } } },
           assignment: { include: { lesson: { select: { class: { select: { name: true } }, teacher: { select: { name: true, surname: true } }, subject: { select: { name: true } } } } } },
         },
         orderBy: { id: "desc" },
         take: ITEMS_PER_PAGE,
         skip: ITEMS_PER_PAGE * (currentPage - 1),
       }),
       prisma.result.count({ where: query }),
     ]);

     dataResp = rawResp;
     count = rawCount;
  }

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
      // @ts-ignore: Prisma cache workaround
      feedback: item.feedback, 
      className: assessment.lesson.class.name,
      subjectName: assessment.lesson.subject.name,
      startTime: isExam ? assessment.startTime : assessment.startDate,
      examId: item.examId,
      assignmentId: item.assignmentId,
      studentId: item.studentId,
    };
  }).filter(Boolean);

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

  // --- 4. Prepare Groupings for Student/Parent View ---
  type DataType = NonNullable<typeof data[0]>;
  const groupedData: Record<string, DataType[]> = {};
  
  if (!isTeacherOrAdmin) {
    data.forEach((item) => {
      if (item) {
        if (!groupedData[item.subjectName]) groupedData[item.subjectName] = [];
        groupedData[item.subjectName].push(item as DataType);
      }
    });
  }

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

  const renderRow = (item: any) => (
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
  );

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4">
        <h1 className="text-lg font-semibold">Results & Gradebook</h1>
        
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full md:w-auto">
          {/* Inject The New Contextual Filter right into the toolbar if Teacher/Admin */}
          {isTeacherOrAdmin && (
             <ClassSubjectFilter classes={availableClasses} subjects={availableSubjects} />
          )}

          {!needsFilters && <TableSearch />}
        </div>
      </div>

      {/* RENDER LOGIC */}
      {isTeacherOrAdmin ? (
         needsFilters ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-50 rounded-md border border-dashed border-gray-300">
               <Image src="/search.png" alt="" width={48} height={48} className="opacity-20 mb-4" />
               <h2 className="text-xl font-semibold text-gray-700">Select a Scope</h2>
               <p className="text-gray-500 mt-2 max-w-md">
                 The Results repository is vast. Please select a specific Class and Subject using the dropdowns above to view the gradebook for those exact students.
               </p>
            </div>
         ) : (
            <div className="flex flex-col w-full">
               <Table columns={columns} renderRow={renderRow} data={data} />
               <Pagination currentPage={currentPage} count={count} />
            </div>
         )
      ) : (
         <div className="flex flex-col gap-6 w-full mt-4">
           {Object.keys(groupedData).length === 0 ? (
              <div className="p-8 text-center text-gray-500 italic">No results found.</div>
           ) : (
              Object.keys(groupedData).map(subject => (
                <div key={subject} className="bg-slate-50 border border-gray-200 rounded-md p-4">
                   <h2 className="text-xl font-bold border-b border-gray-200 pb-2 mb-4 text-lamaPurple">{subject}</h2>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {groupedData[subject].map((record, idx) => (
                         record && (
                           <div key={record.id || idx} className="bg-white p-4 rounded-md shadow-sm border border-gray-100 flex justify-between items-center transform transition-transform hover:-translate-y-1 hover:shadow-md">
                              <div className="flex flex-col gap-1">
                                 <span className="font-semibold text-gray-700">{record.title}</span>
                                 <span className="text-xs text-gray-400">
                                    {new Date(record.startTime).toLocaleDateString()} • {record.teacherName} {record.teacherSurname}
                                 </span>
                                 {record.feedback && (
                                    <span className="text-sm text-gray-500 mt-1 italic whitespace-pre-wrap">&quot;{record.feedback}&quot;</span>
                                 )}
                              </div>
                              <div className="flex flex-col items-center justify-center bg-lamaSkyLight rounded-full w-12 h-12 border-2 border-white shadow-sm flex-none ml-4">
                                 <span className="font-bold text-lamaSky text-lg">{record.score}</span>
                              </div>
                           </div>
                         )
                      ))}
                   </div>
                </div>
              ))
           )}
           <Pagination currentPage={currentPage} count={count} />
         </div>
      )}
    </div>
  );
};

export default ResultListPage;