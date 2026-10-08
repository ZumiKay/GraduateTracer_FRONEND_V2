import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Pagination, Button } from "@heroui/react";
import { useSearchParams } from "react-router";
import { FiChevronLeft, FiChevronRight, FiChevronDown, FiFileText, FiLayers } from "react-icons/fi";
import { useScreenType } from "../../hooks/useScreenSize";

const DEFAULT_ROWS_PER_PAGE = ["5", "10", "20"];

export interface FormPaginationProps {
  total: number;
  onPageChange: (val: number) => void;
  onLimitChange: (val: number) => void;
  page?: number;
  totalCount?: number;
  currentItems?: number;
  rowsPerPageOptions?: string[];
  className?: string;
  itemName?: string;
  showRowsPerPage?: boolean;
}


export default function FormPagination({
  total,
  onPageChange,
  onLimitChange,
  page: propPage,
  totalCount,
  currentItems,
  rowsPerPageOptions = DEFAULT_ROWS_PER_PAGE,
  className = "",
  itemName = "forms",
  showRowsPerPage = true,
}: FormPaginationProps) {
  const [param, setparam] = useSearchParams();
  const { isMiniMobile, isTablet } = useScreenType();

  const urlPage = Number(param.get("page")) || 1;
  const urlShow = Number(param.get("show")) || 5;

  const [currentPage, setCurrentPage] = useState<number>(() => propPage ?? urlPage);
  const [showperpage, setshowperpage] = useState<number>(urlShow);

  const safeTotal = Math.max(1, total || 1);

  const handleParam = useCallback(
    (name: string, value: string) => {
      setparam(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (!value || value.length === 0) {
            next.delete(name);
          } else {
            next.set(name, value);
          }
          return next;
        },
        { replace: true },
      );
    },
    [setparam],
  );

  // Sync if controlled page prop updates
  useEffect(() => {
    if (typeof propPage === "number" && propPage !== currentPage) {
      setCurrentPage(propPage);
    }
  }, [propPage]);

  // Sync if URL search params change (e.g. browser back/forward)
  useEffect(() => {
    const p = Number(param.get("page")) || 1;
    if (p !== currentPage) {
      setCurrentPage(p);
    }
  }, [param]);

  useEffect(() => {
    const s = Number(param.get("show")) || 5;
    if (s !== showperpage) {
      setshowperpage(s);
    }
  }, [param]);

  // Clamp current page if total changes and current page exceeds total
  useEffect(() => {
    if (total > 0 && currentPage > total) {
      const clamped = total;
      setCurrentPage(clamped);
      handleParam("page", clamped.toString());
      onPageChange(clamped);
    }
  }, [total, currentPage, handleParam, onPageChange]);

  const handlePageSelect = useCallback(
    (newPage: number) => {
      const clamped = Math.min(Math.max(1, newPage), safeTotal);
      if (clamped === currentPage) return;
      setCurrentPage(clamped);
      handleParam("page", clamped.toString());
      onPageChange(clamped);
    },
    [currentPage, handleParam, onPageChange, safeTotal],
  );

  const handlePrevious = useCallback(() => {
    if (currentPage > 1) {
      handlePageSelect(currentPage - 1);
    }
  }, [currentPage, handlePageSelect]);

  const handleNext = useCallback(() => {
    if (currentPage < safeTotal) {
      handlePageSelect(currentPage + 1);
    }
  }, [currentPage, handlePageSelect, safeTotal]);

  const handleLimitChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = parseInt(e.target.value, 10);
      if (isNaN(val)) return;
      setshowperpage(val);
      handleParam(e.target.name, e.target.value);
      onLimitChange(val);
      if (currentPage > 1) {
        setCurrentPage(1);
        handleParam("page", "1");
        onPageChange(1);
      }
    },
    [currentPage, handleParam, onLimitChange, onPageChange],
  );

  // Calculate item boundaries for status summary
  const hasTotalCount = typeof totalCount === "number";
  const startItem = useMemo(() => {
    if (!hasTotalCount || totalCount <= 0) return 0;
    return (currentPage - 1) * showperpage + 1;
  }, [hasTotalCount, totalCount, currentPage, showperpage]);

  const endItem = useMemo(() => {
    if (!hasTotalCount || totalCount <= 0) return currentItems ?? 0;
    const countThisPage = currentItems !== undefined ? currentItems : showperpage;
    return Math.min((currentPage - 1) * showperpage + countThisPage, totalCount);
  }, [hasTotalCount, totalCount, currentPage, showperpage, currentItems]);

  return (
    <nav
      aria-label="Pagination navigation"
      className={`w-full bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl border border-gray-200/90 dark:border-gray-700/80 shadow-xs dark:shadow-none p-3 sm:p-4 md:px-5 md:py-3.5 transition-all ${className}`}
    >
      <div className="hidden md:flex md:items-center md:justify-between md:w-full md:gap-4">
        {/* Left: Summary Info */}
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 min-w-0 flex-1">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shrink-0">
            <FiLayers className="w-3.5 h-3.5" />
          </span>
          {hasTotalCount ? (
            totalCount > 0 ? (
              <p className="truncate">
                Showing{" "}
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {startItem}–{endItem}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-900 dark:text-gray-100">{totalCount}</span>{" "}
                {itemName}{" "}
                <span className="text-xs text-gray-400 dark:text-gray-500 font-normal ml-1">
                  (Page {currentPage} of {safeTotal})
                </span>
              </p>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 truncate">No {itemName} available</p>
            )
          ) : (
            <p className="truncate">
              Page{" "}
              <span className="font-semibold text-gray-900 dark:text-gray-100">{currentPage}</span>{" "}
              of <span className="font-semibold text-gray-900 dark:text-gray-100">{safeTotal}</span>
            </p>
          )}
        </div>

        {/* Center: Pagination Navigation Controls */}
        <div className="flex items-center gap-1.5 xl:gap-2 shrink-0">
          <Button
            size="sm"
            isDisabled={currentPage <= 1}
            onPress={handlePrevious}
            className="bg-secondary font-semibold text-white shadow-xs hover:shadow transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none h-8.5 px-3 min-w-[84px] flex items-center gap-1 rounded-lg"
            aria-label="Previous page"
          >
            <FiChevronLeft className="w-4 h-4 shrink-0" />
            <span>Previous</span>
          </Button>

          <Pagination
            color="primary"
            page={currentPage}
            total={safeTotal}
            onChange={handlePageSelect}
            size="md"
            siblings={1}
            boundaries={1}
            variant="flat"
            classNames={{
              wrapper: "gap-1 shadow-none",
              item: "rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/70 transition-colors h-8.5 w-8.5 min-w-8.5",
              cursor: "text-white font-semibold",
            }}
            aria-label="Pagination Navigation"
          />

          <Button
            size="sm"
            isDisabled={currentPage >= safeTotal}
            onPress={handleNext}
            className="bg-primary font-semibold text-white shadow-xs hover:shadow transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none h-8.5 px-3 min-w-[84px] flex items-center gap-1 rounded-lg"
            aria-label="Next page"
          >
            <span>Next</span>
            <FiChevronRight className="w-4 h-4 shrink-0" />
          </Button>
        </div>

        {/* Right: Rows per page selector */}
        {showRowsPerPage && (
          <div className="flex items-center justify-end gap-2 text-sm text-gray-600 dark:text-gray-400 min-w-0 flex-1">
            <label
              htmlFor="pagination-rows-desktop"
              className="text-xs md:text-sm font-medium whitespace-nowrap text-gray-600 dark:text-gray-400"
            >
              Rows per page:
            </label>
            <div className="relative inline-flex items-center">
              <select
                id="pagination-rows-desktop"
                name="show"
                value={showperpage}
                onChange={handleLimitChange}
                aria-label="Rows per page"
                className="appearance-none bg-gray-50 hover:bg-gray-100 dark:bg-gray-700/60 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs md:text-sm font-medium pl-3 pr-7 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all cursor-pointer shadow-xs"
              >
                {rowsPerPageOptions.map((item) => (
                  <option
                    key={item}
                    value={item}
                    className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    {item}
                  </option>
                ))}
              </select>
              <FiChevronDown className="w-3.5 h-3.5 text-gray-400 dark:text-gray-400 pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2.5 sm:gap-3 w-full md:hidden">
        <div className="flex items-center justify-between gap-2 w-full">
          <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-600 dark:text-gray-400 min-w-0">
            <FiFileText className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0" />
            {hasTotalCount ? (
              totalCount > 0 ? (
                <span className="truncate">
                  <span className="hidden sm:inline">Showing </span>
                  <strong className="font-semibold text-gray-800 dark:text-gray-200">
                    {startItem}–{endItem}
                  </strong>{" "}
                  of{" "}
                  <strong className="font-semibold text-gray-800 dark:text-gray-200">
                    {totalCount}
                  </strong>{" "}
                  {itemName}
                </span>
              ) : (
                <span className="truncate text-gray-500 dark:text-gray-400">No {itemName}</span>
              )
            ) : (
              <span>
                Page{" "}
                <strong className="font-semibold text-gray-800 dark:text-gray-200">
                  {currentPage}
                </strong>{" "}
                of{" "}
                <strong className="font-semibold text-gray-800 dark:text-gray-200">
                  {safeTotal}
                </strong>
              </span>
            )}
          </div>

          {showRowsPerPage && (
            <div className="flex items-center gap-1.5 shrink-0">
              <label
                htmlFor="pagination-rows-mobile"
                className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap"
              >
                <span className="hidden sm:inline">Rows per page:</span>
                <span className="sm:hidden">Rows:</span>
              </label>
              <div className="relative inline-flex items-center">
                <select
                  id="pagination-rows-mobile"
                  name="show"
                  value={showperpage}
                  onChange={handleLimitChange}
                  aria-label="Rows per page"
                  className="appearance-none bg-gray-50 hover:bg-gray-100 dark:bg-gray-700/60 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-medium pl-2.5 pr-6 py-1 rounded-lg border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all cursor-pointer shadow-xs"
                >
                  {rowsPerPageOptions.map((item) => (
                    <option
                      key={item}
                      value={item}
                      className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      {item}
                    </option>
                  ))}
                </select>
                <FiChevronDown className="w-3 h-3 text-gray-400 dark:text-gray-400 pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-1.5 sm:gap-2 w-full h-fit pt-0.5">
          {isMiniMobile ? (
            <>
              <Button
                size="sm"
                isIconOnly
                isDisabled={currentPage <= 1}
                onPress={handlePrevious}
                className="bg-secondary text-white font-bold h-8 w-8 min-w-8 shadow-xs rounded-lg disabled:opacity-40 disabled:pointer-events-none"
                aria-label="Previous page"
              >
                <FiChevronLeft className="w-4 h-4" />
              </Button>

              <div className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-700/70 text-xs font-semibold text-gray-700 dark:text-gray-200 select-none">
                Page {currentPage} of {safeTotal}
              </div>

              <Button
                size="sm"
                isIconOnly
                isDisabled={currentPage >= safeTotal}
                onPress={handleNext}
                className="bg-primary text-white font-bold h-8 w-8 min-w-8 shadow-xs rounded-lg disabled:opacity-40 disabled:pointer-events-none"
                aria-label="Next page"
              >
                <FiChevronRight className="w-4 h-4" />
              </Button>
            </>
          ) : (
            /* Standard Mobile & Tablet View (> 360px and < 1024px) */
            <>
              <Button
                size="sm"
                isDisabled={currentPage <= 1}
                onPress={handlePrevious}
                className=" bg-secondary font-semibold text-white shadow-xs transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none h-8 sm:h-8.5 px-2.5 sm:px-3 text-xs sm:text-sm flex items-center gap-1 rounded-lg shrink-0"
                aria-label="Previous page"
              >
                <FiChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">Prev</span>
              </Button>

              <div className="flex justify-center max-w-[calc(100vw-130px)] h-full sm:max-w-none overflow-hidden">
                <Pagination
                  color="primary"
                  page={currentPage}
                  total={safeTotal}
                  onChange={handlePageSelect}
                  size="sm"
                  siblings={isTablet ? 1 : 0}
                  boundaries={1}
                  variant="flat"
                  classNames={{
                    wrapper: "gap-0.5 sm:gap-1 shadow-none",
                    item: "rounded-md sm:rounded-lg text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/70 transition-colors h-8 w-8 sm:h-8 sm:w-8 sm:min-w-8",
                    cursor: "text-white font-semibold",
                  }}
                  aria-label="Pagination Navigation"
                />
              </div>

              <Button
                size="sm"
                isDisabled={currentPage >= safeTotal}
                onPress={handleNext}
                className="bg-primary font-semibold text-white shadow-xs transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none h-8 sm:h-8.5 px-2.5 sm:px-3 text-xs sm:text-sm flex items-center gap-1 rounded-lg shrink-0"
                aria-label="Next page"
              >
                <span className="hidden sm:inline">Next</span>
                <span className="sm:hidden">Next</span>
                <FiChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
