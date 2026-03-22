import Announcements from "@/components/announcements";
import BigCalendarContainer from "@/components/bigCalendarContainer";
import EventCalendarContainer from "@/components/eventCalendarContainer";
import ChildSwitcher from "@/components/ChildSwitcher";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

const ParentPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) => {
  const { userId } = await auth();
  const resolvedParams = await searchParams;

  // Fetch all students belonging to this parent
  const students = await prisma.student.findMany({
    where: {
      parentId: userId!,
    },
    include: {
      class: true,
    },
  });

  const childrenData = students.map((student) => ({
    id: student.id,
    name: student.name,
    surname: student.surname,
    className: student.class?.name || "No Class",
    classId: student.classId,
  }));

  // Determine active child from URL or fallback to first child
  const requestedChildId = resolvedParams.childId;
  let activeChild = childrenData.find((c) => c.id === requestedChildId);

  if (!activeChild && childrenData.length > 0) {
    activeChild = childrenData[0];
  }

  // If parent has no children yet
  if (!activeChild) {
    return (
      <div className="p-4 flex gap-4 flex-col xl:flex-row">
        <div className="w-full xl:w-2/3">
          <div className="h-[calc(100vh-100px)] bg-white p-4 rounded-md flex items-center justify-center text-gray-400">
            No children currently linked to your account.
          </div>
        </div>
        <div className="w-full xl:w-1/3 flex flex-col gap-8">
          <Announcements />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 flex gap-4 flex-col xl:flex-row">
      {/* LEFT */}
      <div className="w-full xl:w-2/3 flex flex-col gap-4">
        {/* TOP BAR / CHILD SWITCHER */}
        <div className="bg-white p-4 rounded-md">
          <ChildSwitcher children={childrenData} />
        </div>

        {/* MAIN CONTENT */}
        <div className="h-[calc(100vh-160px)] bg-white p-4 rounded-md">
          <h1 className="text-xl font-semibold mb-4">
            Schedule ({activeChild.name} {activeChild.surname} — {activeChild.className})
          </h1>
          <BigCalendarContainer type="classId" id={activeChild.classId} />
        </div>
      </div>
      
      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-8">
        <EventCalendarContainer searchParams={resolvedParams} classId={activeChild.classId} />
        <Announcements classId={activeChild.classId} dateParam={resolvedParams?.date as string | undefined} />
      </div>
    </div>
  );
};

export default ParentPage;