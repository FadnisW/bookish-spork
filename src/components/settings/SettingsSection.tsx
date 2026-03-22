import React from "react";
import Image from "next/image";

type SettingsSectionProps = {
  title: string;
  icon?: string;
  children: React.ReactNode;
};

const SettingsSection = ({ title, icon, children }: SettingsSectionProps) => {
  return (
    <div className="bg-white p-6 rounded-md shadow-sm w-full">
      <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
        {icon && <span>{icon}</span>}
        {title}
      </h2>
      <div className="flex flex-col gap-6">
        {children}
      </div>
    </div>
  );
};

export default SettingsSection;
