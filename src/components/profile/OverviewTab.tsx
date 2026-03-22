import React from "react";

const OverviewTab = ({ data, role }: { data: any; role: string }) => {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Dashboard Overview</h2>
      <p className="text-gray-500 text-sm">Welcome to your personalized dashboard overview. Advanced performance analytics will be displayed here.</p>
      {/* To be expanded with Recharts PieChart/RadarChart */}
      <div className="h-64 bg-[#F7F8FA] rounded-md flex items-center justify-center border border-dashed border-gray-300">
        <span className="text-gray-400">Performance Chart Placeholder</span>
      </div>
    </div>
  );
};

export default OverviewTab;
