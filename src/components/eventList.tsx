import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

const EventList = async ({ dateParam, classId }: { dateParam: string | undefined; classId?: number }) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  // ── Fix: parse date in LOCAL time to avoid UTC offset issues ──────────────
  // new Date("2026-03-22") = midnight UTC = 5:30 AM IST (wrong day!)
  // new Date("2026-03-22T00:00:00") = midnight local time (correct!)
  const dateStr = dateParam || new Date().toISOString().split("T")[0];
  const localDate = new Date(`${dateStr}T00:00:00`);

  // Create start and end of day without mutating the same object
  const startOfDay = new Date(localDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(localDate);
  endOfDay.setHours(23, 59, 59, 999);

  // ── Multi-level visibility query ──────────────────────────────────────────
  let visibilityFilter: any = {};

  if (role === "admin") {
    // Admin sees everything
    visibilityFilter = {};
  } else if (role === "teacher") {
    visibilityFilter = {
      OR: [
        { teacherId: null, studentId: null, classId: null },            // General
        { teacherId: userId! },                                         // Direct teacher-target
        { class: { lessons: { some: { teacherId: userId! } } } },      // Class-based
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
        { student: { parentId: userId! } },                             // Child-targeted → visible to parent
        { class: { students: { some: { parentId: userId! } } } },
        ...(classId ? [{ classId }] : []),
      ],
    };
  } else if (classId) {
    visibilityFilter = { OR: [{ classId: null }, { classId }] };
  }

  const data = await prisma.event.findMany({
    where: {
      startTime: {
        gte: startOfDay,
        lte: endOfDay,
      },
      ...(Object.keys(visibilityFilter).length > 0 ? visibilityFilter : {}),
    },
    orderBy: { startTime: "asc" },
  });

  if (data.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-4">No events for this day.</p>
    );
  }

  return (
    <>
      {data.map((event) => (
        <div
          className="p-5 rounded-md border-2 border-gray-100 border-t-4 odd:border-t-lamaSky even:border-t-lamaPurple"
          key={event.id}
        >
          <div className="flex items-center justify-between">
            <h1 className="font-semibold text-gray-600">{event.title}</h1>
            <span className="text-gray-300 text-xs">
              {event.startTime.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
            </span>
          </div>
          <p className="mt-2 text-gray-400 text-sm">{event.description}</p>
        </div>
      ))}
    </>
  );
};

export default EventList;