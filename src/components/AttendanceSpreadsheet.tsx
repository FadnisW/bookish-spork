"use client";

import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { bulkAttendanceSchema, BulkAttendanceSchema } from "@/lib/formValidationsSchemas";
import { useEffect, useState, useTransition } from "react";
import { toast } from "react-toastify";
import { saveBulkAttendance } from "@/lib/actions";

type StudentData = {
  id: string;
  name: string;
  surname: string;
  existingStatus?: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED" | "HALF_DAY";
  existingRemark?: string;
  existingMinutesLate?: number | null;
  locked?: boolean;
};

const STATUS_OPTIONS = [
  { value: "PRESENT", label: "P", color: "bg-green-500", text: "text-green-700", bg: "bg-green-100" },
  { value: "ABSENT", label: "A", color: "bg-red-500", text: "text-red-700", bg: "bg-red-100" },
  { value: "LATE", label: "L", color: "bg-yellow-500", text: "text-yellow-700", bg: "bg-yellow-100" },
  { value: "EXCUSED", label: "E", color: "bg-blue-500", text: "text-blue-700", bg: "bg-blue-100" },
];

const AttendanceSpreadsheet = ({
  students,
  classId,
  date,
  lessonId,
  forceOverride = false,
  holidayReason,
}: {
  students: StudentData[];
  classId: number;
  date: string;
  lessonId?: number; // if undefined, it means 'whole_day'
  forceOverride?: boolean;
  holidayReason?: string | null;
}) => {
  // If this date is a holiday/exception, block entire form
  if (holidayReason) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-12 mt-4 bg-amber-50 border-2 border-amber-300 rounded-md">
        <div className="text-4xl mb-3">🏖️</div>
        <h2 className="text-lg font-bold text-amber-800">Holiday / Exception Day</h2>
        <p className="text-sm text-amber-700 mt-2 text-center max-w-md">{holidayReason}</p>
        <p className="text-xs text-amber-500 mt-4">Attendance cannot be recorded for this date.</p>
      </div>
    );
  }

  const [isPending, startTransition] = useTransition();
  const [draftLoaded, setDraftLoaded] = useState(false);
  const draftKey = `attendance-draft-${classId}-${date}-${lessonId || "whole"}`;

  const { register, control, handleSubmit, watch, setValue, getValues, reset } = useForm<BulkAttendanceSchema>({
    resolver: zodResolver(bulkAttendanceSchema) as any,
    defaultValues: {
      date: new Date(date),
      classId,
      lessonId,
      forceOverride,
      records: students.map(s => ({
        studentId: s.id,
        status: s.existingStatus || "PRESENT",
        remark: s.existingRemark || "",
        minutesLate: s.existingMinutesLate || undefined,
      })),
    },
  });

  const { fields } = useFieldArray({
    control,
    name: "records",
  });

  // Watch entire form for drafts
  const formValues = watch();

  useEffect(() => {
    // Only parse draft on initial mount
    const draft = localStorage.getItem(draftKey);
    if (draft) {
       try {
          const parsed = JSON.parse(draft);
          // Only restore if length matches (no students added/removed)
          if (parsed.records && parsed.records.length === students.length) {
             reset(parsed);
             toast.info("Unsaved draft restored from local storage.");
          }
       } catch(e) {}
    }
    setDraftLoaded(true);
  }, [draftKey, reset, students.length]);

  useEffect(() => {
    if (draftLoaded) {
       localStorage.setItem(draftKey, JSON.stringify(getValues()));
    }
  }, [formValues, draftKey, draftLoaded, getValues]);

  const markAll = (status: "PRESENT" | "ABSENT") => {
    fields.forEach((field, index) => {
       if (!students[index].locked) {
           setValue(`records.${index}.status`, status, { shouldDirty: true });
       }
    });
  };

  const onSubmit = handleSubmit((data) => {
    startTransition(async () => {
      const res = await saveBulkAttendance(data as BulkAttendanceSchema);
      if (res.success) {
         toast.success("Attendance successfully recorded!");
         localStorage.removeItem(draftKey); // Clear draft on success
      } else {
         toast.error(res.message || "Failed to save attendance.");
      }
    });
  });

  // Keyboard accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
       // Allow standard typing in inputs
       if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
       // We can implement global shortcuts here if needed, but it's safer per row
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 w-full">
      
      {/* Spreadsheet Toolbar */}
      <div className="flex justify-between items-center bg-white p-4 rounded-md shadow-sm border border-gray-100">
         <div className="flex gap-4 items-center text-sm">
            <span className="font-semibold text-gray-700">Quick Actions:</span>
            <button type="button" onClick={() => markAll("PRESENT")} className="px-3 py-1 bg-green-100 text-green-700 rounded-md font-medium hover:bg-green-200">Mark All Present (P)</button>
            <button type="button" onClick={() => markAll("ABSENT")} className="px-3 py-1 bg-red-100 text-red-700 rounded-md font-medium hover:bg-red-200">Mark All Absent (A)</button>
         </div>
         <div className="text-xs text-gray-400 font-medium">
            Draft auto-saves securely to your browser.
         </div>
      </div>

      {/* High-Density Spreadsheet Grid */}
      <div className="bg-white rounded-md shadow-sm border border-gray-100 overflow-x-auto no-scrollbar">
         <div className="min-w-[800px]">
           <div className="grid grid-cols-12 bg-gray-50 p-4 border-b border-gray-100 font-semibold text-gray-500 text-sm uppercase tracking-wide">
            <div className="col-span-3">Student</div>
            <div className="col-span-4 pl-4">Status / Quick Select</div>
            <div className="col-span-2">Tardy Depth</div>
            <div className="col-span-3">Notes / Remarks</div>
         </div>

         <div className="divide-y divide-gray-100 flex flex-col">
            {fields.map((field, index) => {
               const student = students[index];
               const currentStatus = watch(`records.${index}.status`);
               
               return (
                 <div key={field.id} className={`grid grid-cols-12 p-3 items-center hover:bg-gray-50/50 transition-colors ${student.locked ? 'opacity-60 bg-gray-50' : ''}`}>
                    {/* Student Name */}
                    <div className="col-span-3 flex flex-col">
                       <input type="hidden" {...register(`records.${index}.studentId`)} />
                       <span className="font-medium text-gray-700">{student.name} {student.surname}</span>
                       <span className="text-xs text-gray-400">ID: {student.id.substring(0,6)}...</span>
                       {student.locked && <span className="text-xs text-red-500 font-bold mt-1 inline-flex">🔒 Locked (48h)</span>}
                    </div>

                    {/* Status Buttons */}
                    <div className="col-span-4 flex gap-2 pl-4">
                       {STATUS_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            disabled={student.locked}
                            onClick={() => setValue(`records.${index}.status`, opt.value as any, { shouldDirty: true })}
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all outline-none focus:ring-2 focus:ring-offset-1 focus:ring-lamaPurple ${
                               currentStatus === opt.value 
                               ? `${opt.color} text-white shadow-md transform scale-105` 
                               : `bg-gray-100 text-gray-500 hover:${opt.bg} hover:${opt.text}`
                            }`}
                            title={opt.value}
                          >
                             {opt.label}
                          </button>
                       ))}
                    </div>

                    {/* Tardy Minutes */}
                    <div className="col-span-2 pr-4">
                       {currentStatus === "LATE" && (
                         <div className="flex items-center gap-2">
                           <input 
                             type="number" 
                             disabled={student.locked}
                             placeholder="Mins..." 
                             className="w-full ring-[1.5px] ring-yellow-400 p-1.5 rounded-md text-sm outline-none focus:ring-yellow-500"
                             {...register(`records.${index}.minutesLate`, { valueAsNumber: true })}
                           />
                         </div>
                       )}
                    </div>

                    {/* Remarks Input */}
                    <div className="col-span-3 pr-2">
                       <input 
                         type="text" 
                         disabled={student.locked}
                         placeholder="Add note..." 
                         className={`w-full ring-[1.5px] ring-gray-200 p-2 rounded-md text-sm outline-none transition-all ${currentStatus === "ABSENT" ? "focus:ring-red-400" : "focus:ring-lamaPurple"}`}
                         {...register(`records.${index}.remark`)}
                       />
                    </div>
                 </div>
               );
            })}
         </div>
         </div>
      </div>

      <div className="flex justify-end pt-4">
         <button 
           type="submit" 
           disabled={isPending}
           className="bg-lamaPurple text-white px-8 py-3 rounded-md font-bold shadow-md hover:bg-lamaPurple/90 transition-all disabled:opacity-50 flex items-center gap-2"
         >
           {isPending ? "Validating & Saving..." : "Commit Attendance Registry"}
         </button>
      </div>

    </form>
  );
};

export default AttendanceSpreadsheet;
