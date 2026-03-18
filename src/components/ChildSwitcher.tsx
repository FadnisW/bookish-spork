"use client";

import { useRouter, useSearchParams } from "next/navigation";

type ChildInfo = {
  id: string;
  name: string;
  surname: string;
  className: string;
};

const ChildSwitcher = ({ children }: { children: ChildInfo[] }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentChildId = searchParams.get("childId") || children[0]?.id || "";

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(window.location.search);
    params.set("childId", e.target.value);
    router.push(`${window.location.pathname}?${params.toString()}`);
  };

  if (children.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic">
        No children linked to this account.
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <label className="text-sm font-medium text-gray-600">Viewing:</label>
      <select
        value={currentChildId}
        onChange={handleChange}
        className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm bg-white cursor-pointer hover:ring-blue-400 transition-all"
      >
        {children.map((child) => (
          <option key={child.id} value={child.id}>
            {child.name} {child.surname} — {child.className}
          </option>
        ))}
      </select>
      {children.length > 1 && (
        <span className="text-xs text-gray-400">
          ({children.length} children)
        </span>
      )}
    </div>
  );
};

export default ChildSwitcher;
