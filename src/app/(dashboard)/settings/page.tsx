import React from "react";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import SettingsSection from "@/components/settings/SettingsSection";
import Toggle from "@/components/settings/Toggle";
import prisma from "@/lib/prisma";

const SettingsPage = async () => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (!userId || !role) {
    return notFound();
  }

  // Fetch basic user context from Clerk and DB depending on role (simplified for settings display)
  let dbUser: any = null;
  if (role === "admin") dbUser = await prisma.admin.findUnique({ where: { id: userId } });
  if (role === "teacher") dbUser = await prisma.teacher.findUnique({ where: { id: userId } });
  if (role === "student") dbUser = await prisma.student.findUnique({ where: { id: userId } });
  if (role === "parent") dbUser = await prisma.parent.findUnique({ where: { id: userId } });

  return (
    <div className="flex-1 p-4 flex flex-col items-center">
      <div className="w-full max-w-4xl flex flex-col gap-6">
        
        <h1 className="text-2xl font-semibold mb-2">Account Settings</h1>

        {/* ACCOUNT INFORMATION */}
        <SettingsSection title="Account Information" icon="👤">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm text-gray-500 mb-1 block">Username</label>
                <input
                  type="text"
                  readOnly
                  value={dbUser?.username || "N/A"}
                  className="w-full rounded-full ring-[1.5px] ring-gray-300 px-4 py-2 bg-gray-50 text-gray-500 outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="text-sm text-gray-500 mb-1 block">Email</label>
                <input
                  type="email"
                  defaultValue={dbUser?.email || ""}
                  className="w-full rounded-full ring-[1.5px] ring-gray-300 px-4 py-2 bg-transparent outline-none focus:ring-lamaSky"
                />
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm text-gray-500 mb-1 block">Phone</label>
                <input
                  type="tel"
                  defaultValue={dbUser?.phone || ""}
                  className="w-full rounded-full ring-[1.5px] ring-gray-300 px-4 py-2 bg-transparent outline-none focus:ring-lamaSky"
                />
              </div>
              <div>
                <button className="bg-lamaSky text-black rounded-full px-6 py-2 font-medium hover:bg-[#a8dff0] transition-colors">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </SettingsSection>

        {/* SECURITY */}
        <SettingsSection title="Security" icon="🔒">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <p className="text-sm font-medium">Password</p>
                <p className="text-xs text-gray-500">****************</p>
              </div>
              <button className="text-sm text-lamaSky hover:underline font-medium">Change Password</button>
            </div>
            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="text-sm font-medium">Last Login</p>
                <p className="text-xs text-gray-500">Just now</p>
              </div>
            </div>
          </div>
        </SettingsSection>

        {/* NOTIFICATIONS */}
        <SettingsSection title="Notification Preferences" icon="🔔">
          <Toggle label="Events & Activities" defaultChecked={true} />
          <Toggle label="Important Announcements" defaultChecked={true} />
          <Toggle label="Exam Reminders" defaultChecked={true} />
          <Toggle label="New Assignments" defaultChecked={role !== "parent"} />
        </SettingsSection>

        {/* APPEARANCE */}
        <SettingsSection title="Appearance" icon="🎨">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Theme</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input type="radio" name="theme" defaultChecked className="accent-lamaSky" />
                  Light (Default)
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input type="radio" name="theme" disabled className="accent-lamaSky" />
                  Dark (Coming Soon)
                </label>
              </div>
            </div>
            <div className="w-full md:w-1/2 mt-2">
              <label className="text-sm font-medium text-gray-700 block mb-2">Language</label>
              <select className="w-full rounded-full ring-[1.5px] ring-gray-300 px-4 py-2 bg-transparent outline-none focus:ring-lamaSky text-sm">
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
              </select>
            </div>
          </div>
        </SettingsSection>

        {/* ADMIN ONLY SYSTEM SETTINGS */}
        {role === "admin" && (
          <SettingsSection title="System Settings" icon="🛡️">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700 block mb-2">Academic Year</label>
                <select className="w-full rounded-full ring-[1.5px] ring-gray-300 px-4 py-2 bg-transparent outline-none focus:ring-lamaSky text-sm">
                  <option value="2024">2024 / 2025</option>
                  <option value="2025">2025 / 2026</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700 block mb-2">Attendance Lock Duration</label>
                <select className="w-full rounded-full ring-[1.5px] ring-gray-300 px-4 py-2 bg-transparent outline-none focus:ring-lamaSky text-sm">
                  <option value="24">24 Hours</option>
                  <option value="48" selected>48 Hours</option>
                  <option value="72">72 Hours</option>
                  <option value="0">Disabled</option>
                </select>
              </div>
            </div>
          </SettingsSection>
        )}

        {/* DANGER ZONE (ADMIN ONLY) */}
        {role === "admin" && (
          <div className="bg-red-50 p-6 rounded-md border border-red-100 w-full mt-4">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4 text-red-600">
              <span>⚠️</span> Danger Zone
            </h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="bg-white text-red-600 border border-red-200 rounded-md px-4 py-2 text-sm font-medium hover:bg-red-100 transition-colors">
                Sign Out of All Devices
              </button>
              <button className="bg-red-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-red-700 transition-colors">
                Delete Account
              </button>
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
};

export default SettingsPage;
