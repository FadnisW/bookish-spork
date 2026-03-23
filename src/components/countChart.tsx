"use client";
import Image from "next/image";
import {
  RadialBarChart,
  RadialBar,
  Legend,
  ResponsiveContainer,
} from "recharts";


const CountChart = ({ 
  boysPresent, 
  girlsPresent, 
  totalAbsent, 
  totalStudents 
}: { 
  boysPresent: number; 
  girlsPresent: number; 
  totalAbsent: number; 
  totalStudents: number; 
}) => {
  const data = [
    { name: "Total", count: totalStudents, fill: "white" },
    { name: "Absent", count: totalAbsent, fill: "#F87171" }, // red-400
    { name: "Girls Present", count: girlsPresent, fill: "#FAE27C" },
    { name: "Boys Present", count: boysPresent, fill: "#C3EBFA" },
  ];
  return (
    <div className="relative w-full h-[65%] mt-2">
      <ResponsiveContainer width="99%" height="99%">
        <RadialBarChart
          cx="50%"
          cy="85%"
          innerRadius="40%"
          outerRadius="100%"
          barSize={20}
          data={data}
          startAngle={180}
          endAngle={0}
        >
          <RadialBar background dataKey="count" cornerRadius={10} />
        </RadialBarChart>
      </ResponsiveContainer>
      <Image
        src="/maleFemale.png"
        alt=""
        width={40}
        height={40}
        className="absolute top-[70%] left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-70"
      />
    </div>
  );
};

export default CountChart;