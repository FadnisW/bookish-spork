import React from "react";
import BigCalendarContainer from "@/components/bigCalendarContainer";

type ScheduleTabProps = {
  data: any;
  role: string;
};

const ScheduleTab = ({ data, role }: ScheduleTabProps) => {
  return (
    <div className="flex flex-col gap-4 h-full">
      <h2 className="text-lg font-semibold">Weekly Schedule</h2>
      
      <div className="h-[calc(100vh-350px)] min-h-[500px]">
        {role === "student" && data?.classId && (
          <BigCalendarContainer type="classId" id={data.classId} />
        )}
        {role === "teacher" && data?.id && (
          <BigCalendarContainer type="teacherId" id={data.id} />
        )}
        {role === "parent" && (
          <div className="flex items-center justify-center h-full border border-dashed border-gray-300 rounded-md text-gray-500">
            Please use the dashboard Child Switcher to view specific schedules.
          </div>
        )}
        {role === "admin" && (
          <div className="flex items-center justify-center h-full border border-dashed border-gray-300 rounded-md text-gray-500">
            Admins do not have a personal class schedule.
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleTab;
