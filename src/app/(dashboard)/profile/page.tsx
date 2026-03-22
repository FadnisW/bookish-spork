import React from "react";
import { auth } from "@clerk/nextjs/server";
import { getProfileData } from "@/lib/actions";
import { notFound } from "next/navigation";
import ProfileIdentityCard from "@/components/profile/ProfileIdentityCard";
import ProfileQuickStats from "@/components/profile/ProfileQuickStats";
import ProfileTabBar from "@/components/profile/ProfileTabBar";
import Performance from "@/components/performance";
import Announcements from "@/components/announcements";
import ShortcutLink from "@/components/ShortcutLink";

import OverviewTab from "@/components/profile/OverviewTab";
import AcademicTab from "@/components/profile/AcademicTab";
import ScheduleTab from "@/components/profile/ScheduleTab";

const ProfilePage = async () => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (!userId || !role) {
    return notFound();
  }

  const { success, data, message } = await getProfileData(userId, role);

  if (!success || !data) {
    console.error("[ProfilePage] Data fetch failed:", message);
    return notFound();
  }

  // Construct context-aware tabs based on user role
  let tabs: { name: string; label: string; content: React.ReactNode }[] = [];
  
  if (role === "student") {
    tabs = [
      { name: "overview", label: "📊 Overview", content: <OverviewTab data={data} role={role} /> },
      { name: "academic", label: "🎓 Academics", content: <AcademicTab data={data} role={role} /> },
      { name: "schedule", label: "📅 Schedule", content: <ScheduleTab data={data} role={role} /> },
    ];
  } else if (role === "teacher") {
    tabs = [
      { name: "overview", label: "📊 Overview", content: <OverviewTab data={data} role={role} /> },
      { name: "classes", label: "🎓 Classes", content: <AcademicTab data={data} role={role} /> },
      { name: "schedule", label: "📅 Schedule", content: <ScheduleTab data={data} role={role} /> },
    ];
  } else if (role === "parent") {
    tabs = [
      { name: "overview", label: "📊 Overview", content: <OverviewTab data={data} role={role} /> },
      { name: "children", label: "👤 Children", content: <AcademicTab data={data} role={role} /> },
      { name: "schedule", label: "📅 Schedule", content: <ScheduleTab data={data} role={role} /> },
    ];
  }
  // Admin requires no tabs, they manage the system from the dashboard.

  return (
    <div className="flex-1 p-4 flex flex-col gap-4 xl:flex-row">
      {/* LEFT COLUMN: Identity + Stats + Tabs */}
      <div className="w-full xl:w-2/3 flex flex-col gap-4">
        
        {/* Top: Header Row with Identity Card and Quick Stats */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="w-full lg:w-1/2 flex">
            <ProfileIdentityCard data={data} role={role} />
          </div>
          <div className="w-full lg:w-1/2 flex">
            <ProfileQuickStats data={data} role={role} />
          </div>
        </div>

        {/* Bottom: Tabbed Container */}
        {tabs.length > 0 && (
          <div className="mt-4">
            <ProfileTabBar tabs={tabs} />
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Sidebar (Shortcuts, Performance, Announcements) */}
      <div className="w-full xl:w-1/3 flex flex-col gap-4">
        
        {/* Shortcuts Hub */}
        <div className="bg-white p-4 rounded-md shadow-sm">
          <h1 className="text-xl font-semibold">Quick Actions</h1>
          <div className="mt-4 flex gap-4 flex-wrap text-xs text-gray-500">
            <ShortcutLink className="p-3 rounded-md bg-lamaSkyLight" href="/settings" label="Account Settings" count={1} />
            {role === "student" && <ShortcutLink className="p-3 rounded-md bg-lamaYellowLight" href={`/list/results?studentId=${userId}`} label="My Results" count={(data as any)?._count?.results || 0} />}
            {role === "teacher" && <ShortcutLink className="p-3 rounded-md bg-lamaYellowLight" href={`/list/lessons?teacherId=${userId}`} label="My Lessons" count={(data as any)?._count?.lessons || 0} />}
            {role === "parent" && <ShortcutLink className="p-3 rounded-md bg-lamaYellowLight" href={`/list/attendance?parentId=${userId}`} label="Children Attendance" count={1} />}
            {role === "admin" && <ShortcutLink className="p-3 rounded-md bg-lamaYellowLight" href="/list/teachers" label="Manage Teachers" count={(data as any)?._count?.teachers || 0} />}
          </div>
        </div>

        {/* Performance Widget */}
        {(role === "student" || role === "teacher") && (
          <Performance /> 
        )}

        {/* Announcements Widget */}
        {role === "student" && (data as any)?.classId && <Announcements classId={(data as any).classId} />}
        {role === "teacher" && <Announcements />}
        {role === "parent" && <Announcements />}
        {role === "admin" && <Announcements />}

      </div>
    </div>
  );
};

export default ProfilePage;
