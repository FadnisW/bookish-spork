import Image from "next/image";
import React from "react";

type ProfileQuickStatsProps = {
  data: any;
  role: string;
};

const ProfileQuickStats = ({ data, role }: ProfileQuickStatsProps) => {
  let stats: { label: string; value: string | number; icon: string }[] = [];

  if (role === "student") {
    // Calculate attendance percentage for student
    const totalDays = data?.attendances?.length || 0;
    const presentDays = data?.attendances?.filter(
      (day: any) => day.status === "PRESENT" || day.status === "LATE"
    ).length || 0;
    const percentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    stats = [
      { label: "Attendance", value: `${totalDays > 0 ? percentage + "%" : "N/A"}`, icon: "/singleAttendance.png" },
      { label: "Grade", value: `${data?.grade?.level || "N/A"}th`, icon: "/singleBranch.png" },
      { label: "Lessons", value: data?.class?._count?.lessons || 0, icon: "/singleLesson.png" },
      { label: "Class", value: data?.class?.name || "N/A", icon: "/singleClass.png" },
    ];
  } else if (role === "teacher") {
    stats = [
      { label: "Attendance", value: "90%", icon: "/singleAttendance.png" }, // Placeholder for teacher attendance logic
      { label: "Subjects", value: data?._count?.subjects || 0, icon: "/singleBranch.png" },
      { label: "Lessons", value: data?._count?.lessons || 0, icon: "/singleLesson.png" },
      { label: "Classes", value: data?._count?.classes || 0, icon: "/singleClass.png" },
    ];
  } else if (role === "parent") {
    const kidCount = data?.students?.length || 0;
    let totalExams = 0;
    let totalAssignments = 0;

    if (data?.students) {
      data.students.forEach((student: any) => {
        const studentExams = student.class?.lessons?.reduce((acc: number, curr: any) => acc + (curr._count?.exams || 0), 0) || 0;
        const studentAssignments = student.class?.lessons?.reduce((acc: number, curr: any) => acc + (curr._count?.assignments || 0), 0) || 0;
        totalExams += studentExams;
        totalAssignments += studentAssignments;
      });
    }

    stats = [
      { label: "Children", value: kidCount, icon: "/singleClass.png" },
      { label: "Avg Attendance", value: "N/A", icon: "/singleAttendance.png" },
      { label: "Total Exams", value: totalExams, icon: "/singleLesson.png" },
      { label: "Total Assignments", value: totalAssignments, icon: "/singleBranch.png" },
    ];
  } else if (role === "admin") {
    stats = [
      { label: "Students", value: data?._count?.students || 0, icon: "/student.png" },
      { label: "Teachers", value: data?._count?.teachers || 0, icon: "/teacher.png" },
      { label: "Parents", value: data?._count?.parents || 0, icon: "/parent.png" },
      { label: "Classes", value: data?._count?.classes || 0, icon: "/class.png" },
    ];
  }

  return (
    <div className="flex-1 flex gap-4 justify-between flex-wrap w-full">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%] shadow-sm">
          <Image src={stat.icon} alt="" width={24} height={24} className="w-6 h-6" />
          <div>
            <h1 className="text-xl font-semibold">{stat.value}</h1>
            <span className="text-sm text-gray-400">{stat.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProfileQuickStats;
