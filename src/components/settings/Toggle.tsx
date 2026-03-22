"use client";

import React, { useState } from "react";

const Toggle = ({ defaultChecked, label }: { defaultChecked: boolean; label: string }) => {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <button
        onClick={() => setChecked(!checked)}
        className={`w-11 h-6 rounded-full flex items-center p-1 transition-colors duration-200 ease-in-out ${
          checked ? "bg-lamaSky" : "bg-gray-200"
        }`}
      >
        <div
          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
            checked ? "translate-x-5" : ""
          }`}
        ></div>
      </button>
    </div>
  );
};

export default Toggle;
