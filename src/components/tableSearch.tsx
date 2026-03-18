"use client"
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent } from "react";

const TableSearch = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSearch = searchParams.get("search") || "";

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const value = (event.currentTarget.elements[0] as HTMLInputElement).value;

    const params = new URLSearchParams(window.location.search);
    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }
    params.delete("page"); // Reset to page 1 on new search
    router.push(`${window.location.pathname}?${params.toString()}`);
  };

  const handleClear = () => {
    const params = new URLSearchParams(window.location.search);
    params.delete("search");
    params.delete("page");
    router.push(`${window.location.pathname}?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full md:w-auto flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 px-2">
      <Image src="/search.png" alt="" width={14} height={14} />
      <input
        type="text"
        placeholder="Search..."
        defaultValue={currentSearch}
        className="w-[200px] p-2 bg-transparent outline-none"
      />
      {currentSearch && (
        <button
          type="button"
          onClick={handleClear}
          className="text-gray-400 hover:text-red-400 transition-colors font-bold text-sm leading-none"
          title="Clear search"
        >
          ✕
        </button>
      )}
    </form>
  );
};

export default TableSearch;