import Pagination from "@/components/pagination";
import Table from "@/components/table";
import TableSearch from "@/components/tableSearch";
import prisma from "@/lib/prisma";
import { ITEMS_PER_PAGE } from "@/lib/settings";
import { Exam, Prisma, Class, Subject, Teacher } from "@prisma/client";
import Image from "next/image";
import FormContainer from "@/components/formContainer";
import { auth } from "@clerk/nextjs/server";
import { getAllLessons } from "@/lib/actions";
import Link from "next/link";

type ExamList = Exam & {
  lesson: {
    subject: Subject;
    class: Class;
    teacher: Teacher;
  };
};

const ExamListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { sessionClaims, userId } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const currentUserId = userId;

  const { page, ...queryParams } = await searchParams;
  const currentPage = Number(page) || 1;

  // Setting up Url Conditions
  const query: Prisma.ExamWhereInput = {};
  query.lesson = {};
  const queryAnd: Prisma.ExamWhereInput[] = [];
  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "classId":
            query.lesson.classId = Number(value);
            break;
          case "teacherId":
            query.lesson.teacherId = value;
            break;
          case "search":
            queryAnd.push({
              OR: [
                { title: { contains: value, mode: "insensitive" } },
                { lesson: { subject: { name: { contains: value, mode: "insensitive" } } } },
                { lesson: { class: { name: { contains: value, mode: "insensitive" } } } },
                { lesson: { teacher: { name: { contains: value, mode: "insensitive" } } } },
                { lesson: { teacher: { surname: { contains: value, mode: "insensitive" } } } },
              ],
            });
            break;
          default:
            break;
        }
      }
    }
  }

  // Role Conditions
  switch (role) {
    case "admin":
      break;
    case "teacher":
      query.lesson.teacherId = currentUserId!;
      break;
    case "student":
      query.lesson.class = {
        students: {
          some: {
            id: currentUserId!,
          },
        },
      };
      break;
    case "parent":
      query.lesson.class = {
        students: {
          some: {
            parentId: currentUserId!,
          },
        },
      };
      break;
    default:
      break;
  }

  if (queryAnd.length > 0) {
    query.AND = queryAnd;
  }

  const [data, count] = await prisma.$transaction([
    prisma.exam.findMany({
      where: query,
      include: {
        lesson: {
          select: {
            subject: { select: { name: true } },
            class: { select: { name: true } },
            teacher: { select: { name: true, surname: true } },
          },
        },
      },
      orderBy: {
        id: "asc",
      },
      take: ITEMS_PER_PAGE,
      skip: ITEMS_PER_PAGE * (currentPage - 1),
    }),
    prisma.exam.count({
      where: query,
    }),
  ]);

  // Fetch lessons for the form dropdown — teacher sees only their own, admin sees all
  const lessons = await getAllLessons(role === "teacher" ? currentUserId! : undefined);

  const columns = [
    {
      header: "Subject Name",
      accessor: "name",
    },
    {
      header: "Class",
      accessor: "class",
    },
    {
      header: "Teacher",
      accessor: "teacher",
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
        <h1 className="hidden md:block text-lg font-semibold">All Exams</h1>
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
              <FormContainer table="exam" type="create" relatedData={{ lessons }} />
            )}
          </div>
        </div>
      </div>
      {/* LIST */}
      <Table columns={columns} renderRow={(item: ExamList) => (
        <tr
          key={item.id}
          className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
        >
          <td className="flex items-center gap-4 p-4">{item.lesson.subject.name}</td>
          <td>{item.lesson.class.name}</td>
          <td className="hidden md:table-cell">
            {item.lesson.teacher.name + " " + item.lesson.teacher.surname}
          </td>
          <td className="hidden md:table-cell">
            {new Intl.DateTimeFormat("en-IN", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            }).format(new Date(item.startTime))}
          </td>
          <td>
            <div className="flex items-center gap-2">
              {(role === "admin" || role === "teacher") && (
                <>
                  <Link href={`/list/evaluate?type=exam&id=${item.id}`} passHref>
                    <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaSkyLight" title="Grade Exam">
                      <Image src="/result.png" alt="" width={16} height={16} />
                    </button>
                  </Link>
                  <FormContainer table="exam" type="update" data={item} relatedData={{ lessons }} />
                  <FormContainer table="exam" type="delete" id={item.id} />
                </>
              )}
            </div>
          </td>
        </tr>
      )} data={data} />
      {/* PAGINATION */}
      <Pagination count={count} currentPage={currentPage} />
    </div>
  );
};

export default ExamListPage;
