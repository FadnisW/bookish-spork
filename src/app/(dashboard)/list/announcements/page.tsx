import FormModal from "@/components/formModal";
import Pagination from "@/components/pagination";
import Table from "@/components/table";
import TableSearch from "@/components/tableSearch";
import prisma from "@/lib/prisma";
import { ITEMS_PER_PAGE } from "@/lib/settings";
import { Prisma } from "@prisma/client";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";

// ── Audience helpers ─────────────────────────────────────────────────────────
const getAudienceLabel = (item: any) => {
  if (item.teacherId) return "👤 Teacher";
  if (item.studentId) return "🎓 Student";
  if (item.classId) return `🏫 ${item.class?.name || "Class"}`;
  return "🌐 General";
};

const AnnouncementListPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) => {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  const resolvedParams = await searchParams;
  const { page, search } = resolvedParams;
  const currentPage = Number(page) || 1;

  // ── Build filter query ────────────────────────────────────────────────────
  const query: Prisma.AnnouncementWhereInput = {};

  if (search) {
    query.title = { contains: search, mode: "insensitive" };
  }

  // Multi-level visibility per role
  if (role === "admin") {
    // Admin sees everything
  } else if (role === "teacher") {
    query.OR = [
      { teacherId: null, studentId: null, classId: null } as any,
      { teacherId: userId! } as any,
      { class: { lessons: { some: { teacherId: userId! } } } },
    ] as any;
  } else if (role === "student") {
    query.OR = [
      { teacherId: null, studentId: null, classId: null } as any,
      { studentId: userId! } as any,
      { class: { students: { some: { id: userId! } } } },
    ] as any;
  } else if (role === "parent") {
    query.OR = [
      { teacherId: null, studentId: null, classId: null } as any,
      { student: { parentId: userId! } } as any,
      { class: { students: { some: { parentId: userId! } } } },
    ] as any;
  }

  // ── Fetch data + relatedData ──────────────────────────────────────────────
  const [data, count, classes, teachers, students] = await prisma.$transaction([
    prisma.announcement.findMany({
      where: query,
      include: { class: true },
      orderBy: { date: "desc" },
      take: ITEMS_PER_PAGE,
      skip: ITEMS_PER_PAGE * (currentPage - 1),
    }),
    prisma.announcement.count({ where: query }),
    prisma.class.findMany({ orderBy: { name: "asc" } }),
    prisma.teacher.findMany({ select: { id: true, name: true, surname: true }, orderBy: { name: "asc" } }),
    prisma.student.findMany({ select: { id: true, name: true, surname: true }, orderBy: { name: "asc" } }),
  ]);

  const relatedData = { classes, teachers, students };

  // ── Table columns (role-aware) ────────────────────────────────────────────
  const columns = [
    { header: "Title", accessor: "title" },
    { header: "Audience", accessor: "audience", className: "hidden md:table-cell" },
    { header: "Date", accessor: "date", className: "hidden md:table-cell" },
    ...(role === "admin" ? [{ header: "Actions", accessor: "action" }] : []),
  ];

  // ── renderRow: defined INSIDE component so it captures role + relatedData ─
  const renderRow = (item: (typeof data)[0]) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4 font-medium">{item.title}</td>
      <td className="hidden md:table-cell text-gray-500">{getAudienceLabel(item)}</td>
      <td className="hidden md:table-cell">
        {new Intl.DateTimeFormat("en-IN", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date(item.date))}
      </td>
      <td>
        {role === "admin" && (
          <div className="flex items-center gap-2">
            <FormModal table="announcement" type="update" data={item} relatedData={relatedData} />
            <FormModal table="announcement" type="delete" id={item.id} />
          </div>
        )}
      </td>
    </tr>
  );

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Announcements</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {role === "admin" && (
              <FormModal table="announcement" type="create" relatedData={relatedData} />
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

export default AnnouncementListPage;
