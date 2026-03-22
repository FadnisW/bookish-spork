import React from "react";

const AcademicTab = ({ data, role }: { data: any; role: string }) => {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Academic Profile</h2>
      <p className="text-gray-500 text-sm">Detailed breakdown of grades, curriculum, and results.</p>
      
      <div className="h-64 bg-[#F7F8FA] rounded-md flex items-center justify-center border border-dashed border-gray-300">
        <span className="text-gray-400">Academic Data / BarChart Placeholder</span>
      </div>
    </div>
  );
};

export default AcademicTab;
