"use client";

import { useState } from "react";

export default function InfoCardModal({ 
  title, 
  date, 
  description, 
  children 
}: { 
  title: string; 
  date: string; 
  description: string;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div 
        className="cursor-pointer transition-transform hover:-translate-y-1 hover:shadow-md duration-200 h-full" 
        onClick={() => setIsOpen(true)}
      >
        {children}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6 relative flex flex-col gap-4 transform transition-all duration-200">
            <button 
              onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold text-gray-800 pr-8 break-words">{title}</h2>
            <span className="text-xs font-semibold text-lamaSky bg-lamaSkyLight w-max px-2 py-1 rounded-md">
              {date}
            </span>
            <div className="text-sm text-gray-600 mt-2 leading-relaxed max-h-[60vh] overflow-y-auto pr-2 no-scrollbar whitespace-pre-wrap">
               {description}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
               <button 
                  onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                  className="px-6 py-2 bg-lamaPurple text-white rounded-md text-sm font-medium hover:bg-opacity-90 transition-all shadow-sm"
               >
                 Close
               </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
