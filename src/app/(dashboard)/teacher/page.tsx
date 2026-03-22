import BigCalendarContainer from "@/components/bigCalendarContainer"; 
import Announcements from "@/components/announcements";
import EventCalendarContainer from "@/components/eventCalendarContainer";
import { auth } from "@clerk/nextjs/server";

const teacherPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) => {
  const { userId } = await auth();
  const resolvedParams = await searchParams;
  return (
    <div className="p-4 flex gap-4 flex-col xl:flex-row">
      {/* LEFT */}
      <div className="w-full xl:w-2/3">
        <div className="h-full bg-white p-4 rounded-md">
          <h1 className="text-xl font-semibold">Schedule</h1>
          <BigCalendarContainer type="teacherId" id={userId!} />
        </div>
      </div>
      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-8">
        <EventCalendarContainer searchParams={resolvedParams} />
        <Announcements dateParam={resolvedParams?.date} />
      </div>
    </div>
  );
};

export default teacherPage;