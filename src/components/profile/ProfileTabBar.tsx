"use client";

import React, { useState } from "react";

type TabDefinition = {
  name: string;
  label: string;
  content: React.ReactNode;
};

type ProfileTabBarProps = {
  tabs: TabDefinition[];
};

const ProfileTabBar = ({ tabs }: ProfileTabBarProps) => {
  const [activeTab, setActiveTab] = useState(tabs[0]?.name || "");

  if (tabs.length === 0) return null;

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Tabs Navigation */}
      <div className="flex gap-4 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.name}
            onClick={() => setActiveTab(tab.name)}
            className={`pb-2 px-1 text-sm font-medium transition-colors ${
              activeTab === tab.name
                ? "border-b-2 border-lamaSky text-black"
                : "text-gray-500 hover:text-black"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tabs Content */}
      <div className="bg-white p-4 rounded-md shadow-sm min-h-[400px]">
        {tabs.find((t) => t.name === activeTab)?.content}
      </div>
    </div>
  );
};

export default ProfileTabBar;
