"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

type Option = { id: number | string; name: string; supervisorId?: string | null };
type LessonOption = { id: number; name: string; classId: number; day: string; teacherId: string };

const HOLIDAYS = ["2026-12-25", "2026-01-01", "2026-07-04"]; // Extendable industry standard holiday registry

const AttendanceFilters = ({
  classes,
  lessons,
  currentUserId,
  role,
}: {
  classes: Option[];
  lessons: LessonOption[];
  currentUserId: string;
  role: string;
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [date, setDate] = useState<string>(
    searchParams.get("date") || new Date().toISOString().split("T")[0]
  );
  const [classId, setClassId] = useState<string>(searchParams.get("classId") || "");
  const [lessonId, setLessonId] = useState<string>(searchParams.get("lessonId") || "");

  // Update URL internally
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    if (date) params.set("date", date);
    else params.delete("date");

    if (classId) params.set("classId", classId);
    else params.delete("classId");

    if (lessonId) params.set("lessonId", lessonId);
    else params.delete("lessonId");

    const newPath = `${window.location.pathname}?${params.toString()}`;
    if (newPath !== `${window.location.pathname}${window.location.search}`) {
       router.push(newPath, { scroll: false });
    }
  }, [date, classId, lessonId, router]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.value;
    const jsDate = new Date(selected);
    const day = jsDate.getDay();

    if (day === 0 || day === 6) {
       toast.error("Weekends are blocked for standard attendance.");
       return;
    }
    if (HOLIDAYS.includes(selected)) {
       toast.warn("The selected date is a registered school holiday.");
       return;
    }
    setDate(selected);
  };

  // Compute available lessons dynamically based on selected Class and Date
  const dayOfWeekString = date ? ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"][new Date(date).getDay()] : "";
  
  const selectedClassObj = classes.find(c => c.id.toString() === classId);
  const isSupervisor = selectedClassObj?.supervisorId === currentUserId;
  const canSeeAllDay = role === "admin" || isSupervisor;

  const filteredLessons = lessons.filter(l => 
    l.classId.toString() === classId && 
    l.day === dayOfWeekString
  );

  return (
    <div className="flex flex-col md:flex-row gap-4 w-full p-4 bg-lamaPurpleLight/50 rounded-md border border-lamaPurple mb-4 items-end shadow-sm">
      
      <div className="flex flex-col gap-1 w-full md:w-1/4">
        <label className="text-xs text-gray-500 font-semibold uppercase">Register Date</label>
        <input 
          type="date" 
          value={date} 
          onChange={handleDateChange}
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm outline-none focus:ring-lamaPurple transition-all"
        />
      </div>

      <div className="flex flex-col gap-1 w-full md:w-1/4">
        <label className="text-xs text-gray-500 font-semibold uppercase">Select Class</label>
        <select
          value={classId}
          onChange={(e) => {
             setClassId(e.target.value);
             setLessonId(""); // Reset lesson when class changes
          }}
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm outline-none focus:ring-lamaPurple transition-all"
        >
          <option value="">Choose Class...</option>
          {classes.map((cls) => (
             <option key={cls.id} value={cls.id}>{cls.name}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1 w-full md:w-2/5">
        <label className="text-xs text-gray-500 font-semibold uppercase">Select Scope / Subject</label>
        <select
          disabled={!classId || !date}
          value={lessonId}
          onChange={(e) => setLessonId(e.target.value)}
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm outline-none focus:ring-lamaPurple disabled:opacity-50 transition-all font-medium"
        >
          <option value="">Choose Scope...</option>
          {canSeeAllDay && date && classId && (
            <option value="whole_day" className="font-bold text-lamaPurple">⚡ All Lessons (Whole Day Registry)</option>
          )}
          {filteredLessons.map((les) => (
             <option key={les.id} value={les.id}>{les.name}</option>
          ))}
        </select>
      </div>

      <div className="w-full md:w-auto flex justify-end">
         <button 
           onClick={() => { setClassId(""); setLessonId(""); setDate(new Date().toISOString().split("T")[0]); }}
           className="px-4 py-2 hover:bg-gray-100 text-gray-500 rounded-md border border-gray-300 transition-all text-sm font-medium h-[38px]"
         >
           Reset
         </button>
      </div>

    </div>
  );
};

export default AttendanceFilters;
