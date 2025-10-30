import { useCallback, useMemo, useState, useEffect } from "react";

interface PaginationProps {
  totalPage: number;
  page: number;
  setPage: (val: number) => void;
  isDisable?: boolean;
}

interface PaginationState {
  leftSiblings: number[];
  rightSiblings: number[];
  shouldShowLeftDots: boolean;
  shouldShowRightDots: boolean;
}

// Style constants for better maintainability
const BUTTON_STYLES = {
  base: "inline-flex items-center justify-center min-w-9 h-9 rounded-lg font-semibold text-sm transition-all duration-200 border",
  active:
    "bg-primary text-white border-primary shadow-md hover:shadow-lg hover:bg-primary-600",
  inactive:
    "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300",
  disabled: "opacity-50 cursor-not-allowed hover:shadow-none hover:bg-white",
  arrow:
    "bg-white text-gray-600 border-gray-200 hover:bg-gray-100 hover:border-gray-400 hover:text-gray-800",
  dots: "text-gray-400 font-medium",
} as const;

const PageItem = ({
  isActive,
  content,
  onPress,
  isDisabled,
  isArrow = false,
}: {
  content: string;
  isActive?: boolean;
  isDisabled?: boolean;
  isArrow?: boolean;
  onPress?: () => void;
}) => {
  const getButtonClass = (): string => {
    if (isDisabled) return `${BUTTON_STYLES.base} ${BUTTON_STYLES.disabled}`;
    if (isArrow) return `${BUTTON_STYLES.base} ${BUTTON_STYLES.arrow}`;
    return `${BUTTON_STYLES.base} ${
      isActive ? BUTTON_STYLES.active : BUTTON_STYLES.inactive
    }`;
  };

  return (
    <button
      onClick={() => !isDisabled && onPress?.()}
      disabled={isDisabled}
      className={getButtonClass()}
      aria-label={`${
        isArrow
          ? content === "←"
            ? "Previous page"
            : "Next page"
          : `Page ${content}`
      }`}
      aria-current={isActive ? "page" : undefined}
      type="button"
    >
      {content}
    </button>
  );
};

// Configuration
const SIBLING = 1; // Show 1 page on each side of current page
const MAX_LEFT = 1; // Always show first page
const MAX_RIGHT = 1; // Always show last page

const Pagination = ({
  totalPage,
  page,
  setPage,
  isDisable = false,
}: PaginationProps) => {
  const [inputValue, setInputValue] = useState<string>(String(page));

  // Sync input value when page prop changes
  useEffect(() => {
    setInputValue(String(page));
  }, [page]);

  /**
   * Calculate which pages to display with correct sibling logic
   * Shows: [first page(s)] ... [left siblings] [current] [right siblings] ... [last page(s)]
   */
  const paginationRange = useMemo((): PaginationState => {
    // Left siblings: pages to the left of current page
    const leftSiblings = Array.from(
      { length: Math.min(page - 1, SIBLING) },
      (_, i) => page - SIBLING + i
    );

    // Right siblings: pages to the right of current page
    const rightSiblings = Array.from(
      { length: Math.min(totalPage - page, SIBLING) },
      (_, i) => page + 1 + i
    );

    // Determine if we need left dots (gap between first page and left siblings)
    const leftSiblingStart = Math.max(1, page - SIBLING);
    const shouldShowLeftDots = leftSiblingStart > MAX_LEFT + 1;

    // Determine if we need right dots (gap between right siblings and last page)
    const rightSiblingEnd = Math.min(totalPage, page + SIBLING);
    const shouldShowRightDots = rightSiblingEnd < totalPage - MAX_RIGHT;

    return {
      leftSiblings,
      rightSiblings,
      shouldShowLeftDots,
      shouldShowRightDots,
    };
  }, [page, totalPage]);

  const handlePageChange = useCallback(
    (newPage: number) => {
      if (!isDisable && newPage >= 1 && newPage <= totalPage) {
        setPage(newPage);
      }
    },
    [setPage, isDisable, totalPage]
  );

  // Build the pagination array
  const pageNumbers = useMemo(() => {
    const pages: (number | string)[] = [];

    // Add first page(s)
    for (let i = 1; i <= Math.min(MAX_LEFT, totalPage); i++) {
      pages.push(i);
    }

    // Add left dots if needed
    if (paginationRange.shouldShowLeftDots) {
      pages.push("...");
    }

    // Add left siblings
    paginationRange.leftSiblings.forEach((p) => {
      if (!pages.includes(p)) pages.push(p);
    });

    // Add current page
    if (!pages.includes(page)) {
      pages.push(page);
    }

    // Add right siblings
    paginationRange.rightSiblings.forEach((p) => {
      if (!pages.includes(p)) pages.push(p);
    });

    // Add right dots if needed
    if (paginationRange.shouldShowRightDots) {
      pages.push("...");
    }

    // Add last page(s)
    for (let i = Math.max(totalPage - MAX_RIGHT + 1, 1); i <= totalPage; i++) {
      if (!pages.includes(i)) {
        pages.push(i);
      }
    }

    return pages;
  }, [page, totalPage, paginationRange]);

  if (totalPage <= 1) return null;

  return (
    <div className="flex items-center justify-center w-full py-4 px-2 sm:py-6">
      <nav
        className="inline-flex items-center gap-1 sm:gap-2 rounded-lg border border-gray-200 bg-white p-2 shadow-sm hover:shadow-md transition-shadow"
        role="navigation"
        aria-label="Pagination navigation"
      >
        {/* Previous Button */}
        <PageItem
          content="←"
          isArrow
          isDisabled={page === 1 || isDisable}
          onPress={() => handlePageChange(page - 1)}
        />

        {/* Divider */}
        <div className="h-5 w-px bg-gray-200 mx-1" aria-hidden="true" />

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((pageNum, idx) =>
            typeof pageNum === "string" ? (
              <span
                key={`dots-${idx}`}
                className={`${BUTTON_STYLES.dots} px-2 py-1`}
                aria-hidden="true"
              >
                {pageNum}
              </span>
            ) : (
              <PageItem
                key={`page-${pageNum}`}
                content={String(pageNum)}
                isActive={pageNum === page}
                isDisabled={isDisable}
                onPress={() => handlePageChange(pageNum)}
              />
            )
          )}
        </div>

        {/* Divider */}
        <div className="h-5 w-px bg-gray-200 mx-1" aria-hidden="true" />

        {/* Next Button */}
        <PageItem
          content="→"
          isArrow
          isDisabled={page === totalPage || isDisable}
          onPress={() => handlePageChange(page + 1)}
        />

        {/* Page Input Field */}
        <div className="hidden sm:flex items-center gap-1 ml-2 pl-2 border-l border-gray-200">
          <label
            htmlFor="page-input"
            className="text-xs font-medium text-gray-500"
          >
            Go to:
          </label>
          <input
            id="page-input"
            type="number"
            min="1"
            max={totalPage}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const pageNum = parseInt(inputValue, 10);
                if (pageNum >= 1 && pageNum <= totalPage) {
                  handlePageChange(pageNum);
                  setInputValue(String(pageNum));
                }
              }
            }}
            onBlur={() => {
              const pageNum = parseInt(inputValue, 10);
              if (pageNum >= 1 && pageNum <= totalPage) {
                handlePageChange(pageNum);
                setInputValue(String(pageNum));
              } else {
                setInputValue(String(page));
              }
            }}
            disabled={isDisable}
            className="w-12 h-8 px-2 text-xs text-center border border-gray-300 rounded bg-white text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            aria-label="Go to page"
          />
          <span className="text-xs font-medium text-gray-500">
            / {totalPage}
          </span>
        </div>
      </nav>
    </div>
  );
};

export default Pagination;
