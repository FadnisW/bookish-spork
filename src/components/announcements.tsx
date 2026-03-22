import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

const Announcements = async ({ classId, dateParam }: { classId?: number; dateParam?: string }) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  // ── Fix: parse date in LOCAL time to avoid UTC offset issues ──────────────
  let dateFilter: any = {};
  if (dateParam) {
    // Force local time parse: "2026-03-22T00:00:00" not "2026-03-22" (which is UTC midnight)
    const localDate = new Date(`${dateParam}T00:00:00`);

    const startOfDay = new Date(localDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(localDate);
    endOfDay.setHours(23, 59, 59, 999);

    dateFilter = { date: { gte: startOfDay, lte: endOfDay } };
  }

  // ── Multi-level visibility query ──────────────────────────────────────────
  let visibilityFilter: any = {};

  if (role === "admin") {
    visibilityFilter = {};
  } else if (role === "teacher") {
    visibilityFilter = {
      OR: [
        { teacherId: null, studentId: null, classId: null },
        { teacherId: userId! },
        { class: { lessons: { some: { teacherId: userId! } } } },
        ...(classId ? [{ classId }] : []),
      ],
    };
  } else if (role === "student") {
    visibilityFilter = {
      OR: [
        { teacherId: null, studentId: null, classId: null },
        { studentId: userId! },
        { class: { students: { some: { id: userId! } } } },
        ...(classId ? [{ classId }] : []),
      ],
    };
  } else if (role === "parent") {
    visibilityFilter = {
      OR: [
        { teacherId: null, studentId: null, classId: null },
        { student: { parentId: userId! } },
        { class: { students: { some: { parentId: userId! } } } },
        ...(classId ? [{ classId }] : []),
      ],
    };
  } else if (classId !== undefined) {
    visibilityFilter = { OR: [{ classId: null }, { classId }] };
  }

  const data = await prisma.announcement.findMany({
    take: 3,
    orderBy: { date: "desc" },
    where: {
      ...dateFilter,
      ...(Object.keys(visibilityFilter).length > 0 ? visibilityFilter : {}),
    },
  });

  const bgColors = ["bg-lamaSkyLight", "bg-lamaPurpleLight", "bg-lamaYellowLight"];

  return (
    <div className="bg-white p-4 rounded-md">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Announcements</h1>
        <span className="text-xs text-gray-400">
          {dateParam
            ? new Intl.DateTimeFormat("en-IN", { month: "short", day: "numeric" }).format(new Date(`${dateParam}T00:00:00`))
            : "Latest"}
        </span>
      </div>
      <div className="flex flex-col gap-4 mt-4">
        {data.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            No announcements{dateParam ? " for this day" : ""}.
          </p>
        ) : (
          data.map((announcement, index) => (
            <div key={announcement.id} className={`${bgColors[index % 3]} rounded-md p-4`}>
              <div className="flex items-center justify-between">
                <h2 className="font-medium">{announcement.title}</h2>
                <span className="text-xs text-gray-400 bg-white rounded-md px-1 py-1">
                  {new Intl.DateTimeFormat("en-IN").format(announcement.date)}
                </span>
              </div>
              <p className="text-sm text-gray-400 mt-1">{announcement.description}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Announcements;