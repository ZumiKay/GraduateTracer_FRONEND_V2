import { useCallback, useMemo, useState, useEffect } from "react";

type PaginationSize = "sm" | "md" | "lg";

interface PaginationProps {
  totalPage: number;
  page: number;
  setPage: (val: number) => void;
  isDisable?: boolean;
  size?: PaginationSize;
}

interface PaginationState {
  leftSiblings: number[];
  rightSiblings: number[];
  shouldShowLeftDots: boolean;
  shouldShowRightDots: boolean;
}

const BUTTON_STYLES = {
  base: "inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 border",
  active:
    "bg-primary text-white border-primary shadow-md hover:shadow-lg hover:bg-primary-600",
  inactive:
    "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300",
  disabled: "opacity-50 cursor-not-allowed hover:shadow-none hover:bg-white",
  arrow:
    "bg-white text-gray-600 border-gray-200 hover:bg-gray-100 hover:border-gray-400 hover:text-gray-800",
  dots: "text-gray-400 font-medium",
} as const;

const SIZE_STYLES = {
  sm: {
    button: "min-w-7 h-7 text-xs",
    gap: "gap-0.5",
    padding: "p-1.5",
    divider: "h-4",
    input: "w-10 h-6 text-xs",
    outer: "py-3 px-2",
  },
  md: {
    button: "min-w-9 h-9 text-sm",
    gap: "gap-1 sm:gap-2",
    padding: "p-2",
    divider: "h-5",
    input: "w-12 h-8 text-xs",
    outer: "py-4 px-2 sm:py-6",
  },
  lg: {
    button: "min-w-11 h-11 text-base",
    gap: "gap-1.5 sm:gap-2",
    padding: "p-3",
    divider: "h-6",
    input: "w-14 h-10 text-sm",
    outer: "py-5 px-2 sm:py-8",
  },
} as const;

const PageItem = ({
  isActive,
  content,
  onPress,
  isDisabled,
  isArrow = false,
  size = "md",
}: {
  content: string;
  isActive?: boolean;
  isDisabled?: boolean;
  isArrow?: boolean;
  onPress?: () => void;
  size?: PaginationSize;
}) => {
  const getButtonClass = (): string => {
    const sizeClass = SIZE_STYLES[size].button;
    if (isDisabled)
      return `${BUTTON_STYLES.base} ${sizeClass} ${BUTTON_STYLES.disabled}`;
    if (isArrow)
      return `${BUTTON_STYLES.base} ${sizeClass} ${BUTTON_STYLES.arrow}`;
    return `${BUTTON_STYLES.base} ${sizeClass} ${
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

const SIBLING = 1;
const MAX_LEFT = 1;
const MAX_RIGHT = 1;
const Pagination = ({
  totalPage,
  page,
  setPage,
  isDisable = false,
  size = "md",
}: PaginationProps) => {
  const sz = SIZE_STYLES[size];
  const [inputValue, setInputValue] = useState<string>(String(page));

  useEffect(() => {
    setInputValue(String(page));
  }, [page]);

  const paginationRange = useMemo((): PaginationState => {
    const leftSiblings = Array.from(
      { length: Math.min(page - 1, SIBLING) },
      (_, i) => page - SIBLING + i,
    );

    const rightSiblings = Array.from(
      { length: Math.min(totalPage - page, SIBLING) },
      (_, i) => page + 1 + i,
    );

    const leftSiblingStart = Math.max(1, page - SIBLING);
    const shouldShowLeftDots = leftSiblingStart > MAX_LEFT + 1;

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
    [setPage, isDisable, totalPage],
  );

  // Build the pagination array
  const pageNumbers = useMemo(() => {
    const pages: (number | string)[] = [];

    for (let i = 1; i <= Math.min(MAX_LEFT, totalPage); i++) {
      pages.push(i);
    }

    if (paginationRange.shouldShowLeftDots) {
      pages.push("...");
    }

    paginationRange.leftSiblings.forEach((p) => {
      if (!pages.includes(p)) pages.push(p);
    });

    if (!pages.includes(page)) {
      pages.push(page);
    }

    paginationRange.rightSiblings.forEach((p) => {
      if (!pages.includes(p)) pages.push(p);
    });

    if (paginationRange.shouldShowRightDots) {
      pages.push("...");
    }

    for (let i = Math.max(totalPage - MAX_RIGHT + 1, 1); i <= totalPage; i++) {
      if (!pages.includes(i)) {
        pages.push(i);
      }
    }

    return pages;
  }, [page, totalPage, paginationRange]);

  if (totalPage <= 1) return null;

  return (
    <div className={`flex items-center justify-center w-full ${sz.outer}`}>
      <nav
        className={`inline-flex items-center ${sz.gap} rounded-lg border border-gray-200 bg-white ${sz.padding} shadow-sm hover:shadow-md transition-shadow`}
        role="navigation"
        aria-label="Pagination navigation"
      >
        <PageItem
          content="←"
          isArrow
          size={size}
          isDisabled={page === 1 || isDisable}
          onPress={() => handlePageChange(page - 1)}
        />

        {/* Divider */}
        <div className={`${sz.divider} w-px bg-gray-200 mx-1`} aria-hidden="true" />

        <div className={`flex items-center ${sz.gap}`}>
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
                size={size}
                onPress={() => handlePageChange(pageNum)}
              />
            ),
          )}
        </div>

        {/* Divider */}
        <div className={`${sz.divider} w-px bg-gray-200 mx-1`} aria-hidden="true" />

        <PageItem
          content="→"
          isArrow
          size={size}
          isDisabled={page === totalPage || isDisable}
          onPress={() => handlePageChange(page + 1)}
        />

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
            className={`${sz.input} px-2 text-center border border-gray-300 rounded bg-white text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all`}
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
