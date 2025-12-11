import React from "react";
import { Button } from "@heroui/react";
import { FiSend, FiChevronLeft, FiChevronRight } from "react-icons/fi";

interface NavigationProps {
  currentPage: number;
  totalPages: number;
  isCurrentPageComplete: boolean;
  submitting: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onPageChange: (page: number) => void;
  onSubmit: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentPage,
  totalPages,
  isCurrentPageComplete,
  submitting,
  onPrevious,
  onNext,
  onPageChange,
  onSubmit,
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 p-4 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
      {/* Previous Button */}
      <Button
        variant="flat"
        startContent={<FiChevronLeft className="w-4 h-4" />}
        onPress={onPrevious}
        isDisabled={currentPage === 1}
        aria-label="Go to previous page"
        className="min-w-[120px] bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 font-medium"
        radius="lg"
      >
        Previous
      </Button>

      {/* Page Indicators */}
      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-gray-100/80 to-gray-50/80 dark:from-gray-700/80 dark:to-gray-600/80 backdrop-blur-sm border border-gray-200/30 dark:border-gray-600/30">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <Button
            key={page}
            size="sm"
            isIconOnly
            variant={page === currentPage ? "solid" : "flat"}
            onPress={() => onPageChange(page)}
            aria-label={`Go to page ${page}`}
            aria-current={page === currentPage ? "page" : undefined}
            className={`
              min-w-[36px] h-[36px] font-semibold transition-all duration-300 
              ${
                page === currentPage
                  ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md scale-110 ring-2 ring-blue-300/50 dark:ring-blue-500/50"
                  : "bg-white/70 dark:bg-gray-600/70 text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-500 hover:text-blue-600 dark:hover:text-blue-300 hover:scale-105"
              }
            `}
            radius="full"
          >
            {page}
          </Button>
        ))}
      </div>

      {/* Next/Submit Button */}
      {currentPage < totalPages ? (
        <Button
          color="primary"
          endContent={<FiChevronRight className="w-4 h-4" />}
          onPress={onNext}
          isDisabled={!isCurrentPageComplete}
          aria-label="Go to next page"
          className="min-w-[120px] bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
          radius="lg"
        >
          Next
        </Button>
      ) : (
        <Button
          color="success"
          endContent={<FiSend className="w-4 h-4" />}
          onPress={onSubmit}
          isLoading={submitting}
          isDisabled={!isCurrentPageComplete}
          aria-label="Submit form"
          className="min-w-[140px] bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
          radius="lg"
        >
          Submit Form
        </Button>
      )}
    </div>
  );
};
