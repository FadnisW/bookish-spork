"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type Option = { id: number | string; name: string };

const ClassSubjectFilter = ({
  classes,
  subjects,
}: {
  classes: Option[];
  subjects: Option[];
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedClass, setSelectedClass] = useState<string>(
    searchParams.get("classId") || ""
  );
  const [selectedSubject, setSelectedSubject] = useState<string>(
    searchParams.get("subjectId") || ""
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    // Clear page back to 1 if filter changes
    params.delete("page");

    if (selectedClass) {
      params.set("classId", selectedClass);
    } else {
      params.delete("classId");
    }

    if (selectedSubject) {
      params.set("subjectId", selectedSubject);
    } else {
      params.delete("subjectId");
    }

    // Only push if there's actually a change to prevent infinite loops from strict effects
    const newPath = `${window.location.pathname}?${params.toString()}`;
    if (newPath !== `${window.location.pathname}${window.location.search}`) {
       router.push(newPath, { scroll: false });
    }
  }, [selectedClass, selectedSubject, router]);

  return (
    <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto p-4 bg-lamaPurpleLight/50 rounded-md border border-lamaPurple mb-4">
      <div className="flex flex-col gap-1 flex-1">
        <label className="text-xs text-gray-500 font-semibold uppercase">Filter by Class</label>
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm outline-none focus:ring-lamaPurple"
        >
          <option value="">Select a Class...</option>
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id}>
              {cls.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1 flex-1">
        <label className="text-xs text-gray-500 font-semibold uppercase">Filter by Subject</label>
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm outline-none focus:ring-lamaPurple"
        >
          <option value="">Select a Subject...</option>
          {subjects.map((sub) => (
            <option key={sub.id} value={sub.id}>
              {sub.name}
            </option>
          ))}
        </select>
      </div>
      
      {/* Clear Filters Button */}
      {(selectedClass || selectedSubject) && (
        <div className="flex items-end flex-none">
           <button 
             onClick={() => {
                setSelectedClass("");
                setSelectedSubject("");
             }}
             className="px-4 py-2 text-sm text-gray-500 hover:text-red-500 transition-colors bg-white rounded-md border border-gray-300 h-[38px]"
           >
             Clear
           </button>
        </div>
      )}
    </div>
  );
};

export default ClassSubjectFilter;
