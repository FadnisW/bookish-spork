"use client";
import { ITEMS_PER_PAGE } from "@/lib/settings";
import { useRouter } from "next/navigation";

const Pagination = ({
  currentPage,
  count,
}: {
  currentPage: number;
  count: number;
}) => {
  //using router to navigate to the next page and prev page
  const router = useRouter();
  //setting page navigation
  const changePage = (newPage: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set("page", newPage.toString());
    router.push(`${window.location.pathname}?${params.toString()}`);
  };
  // setting navigation conditions
  const isFirstPage = ITEMS_PER_PAGE * (currentPage - 1) <= 0;
  const isLastPage  = ITEMS_PER_PAGE * (currentPage - 1) + ITEMS_PER_PAGE >= count;

  return (
    <div className="p-4 flex items-center justify-between text-gray-500">
      <button
        disabled={isFirstPage}
        className="py-2 px-4 rounded-md bg-slate-200 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed min-h-[40px]"
        onClick={() => changePage(currentPage - 1)}
      >
        Prev
      </button>
      <div className="flex items-center gap-2 text-sm">
        {Math.ceil(count / ITEMS_PER_PAGE) <= 5 ? (
          Array.from(
            { length: Math.ceil(count / ITEMS_PER_PAGE) },
            (_, index) => {
              const pageIndex = index + 1;
              return (
                <button
                  key={pageIndex}
                  className={`px-2 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-sm bg-lamaSky ${
                    currentPage === pageIndex ? "text-white" : ""
                  }`}
                  onClick={() => changePage(pageIndex)}
                >
                  {pageIndex}
                </button>
              );
            }
          )
        ) : (
          <>
            {/* First Page */}
            {(currentPage > 2) && (
              <button className="px-2 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-sm bg-lamaSky" onClick={() => changePage(1)}>1</button>
            )}
            
            {(currentPage > 3) && <span className="opacity-50">...</span>}

            {/* Previous, Current, Next */}
            {[currentPage - 1, currentPage, currentPage + 1].map((pageIndex) => {
              if (pageIndex > 0 && pageIndex <= Math.ceil(count / ITEMS_PER_PAGE)) {
                return (
                  <button
                    key={pageIndex}
                    className={`px-2 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-sm bg-lamaSky ${
                      currentPage === pageIndex ? "text-white" : ""
                    }`}
                    onClick={() => changePage(pageIndex)}
                  >
                    {pageIndex}
                  </button>
                );
              }
              return null;
            })}

            {(currentPage < Math.ceil(count / ITEMS_PER_PAGE) - 2) && <span className="opacity-50">...</span>}

            {/* Last Page */}
            {(currentPage < Math.ceil(count / ITEMS_PER_PAGE) - 1) && (
              <button 
                className="px-2 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-sm bg-lamaSky" 
                onClick={() => changePage(Math.ceil(count / ITEMS_PER_PAGE))}
              >
                {Math.ceil(count / ITEMS_PER_PAGE)}
              </button>
            )}
          </>
        )}
      </div>
      <button
        className="py-2 px-4 rounded-md bg-slate-200 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed min-h-[40px]"
        disabled={isLastPage}
        onClick={() => changePage(currentPage + 1)}
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;
