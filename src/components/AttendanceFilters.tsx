"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

type Option = { id: number | string; name: string; supervisorId?: string | null; capacity?: number };
type LessonOption = { 
  id: number; 
  name: string; 
  classId: number; 
  day: string; 
  teacherId: string;
  subject?: { name: string };
  teacher?: { name: string; surname: string };
};

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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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

  const activeLessonDetails = filteredLessons.find(l => l.id.toString() === lessonId);

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

      <div className="flex flex-col gap-1 w-full md:w-2/5 relative">
        <label className="text-xs text-gray-500 font-semibold uppercase flex items-center gap-2">
          Select Scope / Subject
          {activeLessonDetails && (
            <span className="cursor-help text-lamaSky bg-lamaSkyLight w-4 h-4 rounded-full flex items-center justify-center text-[10px] shadow-sm animate-pulse">i</span>
          )}
        </label>
        
        {/* CUSTOM LISTBOX REPLACEMENT FOR NATIVE SELECT */}
        <div className="relative">
          <button
            type="button"
            disabled={!classId || !date}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm outline-none focus:ring-lamaPurple disabled:opacity-50 transition-all font-medium bg-white flex justify-between items-center text-left h-[38px]"
          >
            <span className="truncate">
              {lessonId === "whole_day" ? "⚡ All Lessons (Whole Day)" : activeLessonDetails ? activeLessonDetails.name : "Choose Scope..."}
            </span>
            <svg className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-md shadow-2xl z-[100] max-h-[300px] overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-200">
              {canSeeAllDay && date && classId && (
                <div 
                  onClick={() => { setLessonId("whole_day"); setIsDropdownOpen(false); }}
                  className="p-2.5 text-sm hover:bg-lamaPurpleLight cursor-pointer font-bold text-lamaPurple border-b border-gray-50 flex items-center gap-2 group relative"
                >
                  ⚡ All Lessons (Whole Day Registry)
                </div>
              )}
              {filteredLessons.map((les) => (
                <div
                  key={les.id}
                  onClick={() => { setLessonId(les.id.toString()); setIsDropdownOpen(false); }}
                  className="p-2.5 text-sm hover:bg-lamaPurpleLight cursor-pointer transition-colors border-b border-gray-50 last:border-0 flex flex-col group relative"
                >
                  <span className="font-semibold text-gray-700">{les.name}</span>
                  <span className="text-[10px] text-gray-400">{les.subject?.name} • {les.teacher?.name.charAt(0)}. {les.teacher?.surname}</span>

                  {/* PREMIUM OVERLAY TOOLTIP ON HOVER (Inside Dropdown) */}
                  <div className="absolute left-full ml-2 top-0 hidden group-hover:flex flex-col gap-1.5 bg-gray-800/95 backdrop-blur-md text-white text-[10px] p-3 rounded-md shadow-2xl z-[110] w-[220px] pointer-events-none border border-white/5">
                    <span className="font-bold border-b border-gray-600/50 pb-1 mb-1 text-lamaSkyLight tracking-wide uppercase text-[9px]">Scope Details</span>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Subject:</span> 
                      <span className="font-medium text-right">{les.subject?.name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Teacher:</span> 
                      <span className="font-medium text-right">{les.teacher?.name} {les.teacher?.surname}</span>
                    </div>
                    <div className="flex justify-between mt-1 pt-1 border-t border-gray-600/30">
                      <span className="text-gray-400 font-semibold italic text-[8px]">Selection ID: #{les.id}</span>
                    </div>
                  </div>
                </div>
              ))}
              {filteredLessons.length === 0 && !canSeeAllDay && (
                <div className="p-4 text-center text-xs text-gray-400 italic">No scheduled lessons found.</div>
              )}
            </div>
          )}
        </div>

        {/* CLICK-AWAY LISTENER (Simplified) */}
        {isDropdownOpen && <div className="fixed inset-0 z-[90]" onClick={() => setIsDropdownOpen(false)} />}
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
