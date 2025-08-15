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
    <div className="flex justify-between items-center mt-8">
      <Button
        variant="light"
        startContent={<FiChevronLeft />}
        onPress={onPrevious}
        isDisabled={currentPage === 1}
        aria-label="Go to previous page"
      >
        Previous
      </Button>

      <div className="flex gap-2">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <Button
            key={page}
            size="sm"
            variant={page === currentPage ? "solid" : "light"}
            onPress={() => onPageChange(page)}
            aria-label={`Go to page ${page}`}
          >
            {page}
          </Button>
        ))}
      </div>

      {currentPage < totalPages ? (
        <Button
          color="primary"
          endContent={<FiChevronRight />}
          onPress={onNext}
          isDisabled={!isCurrentPageComplete}
          aria-label="Go to next page"
        >
          Next
        </Button>
      ) : (
        <Button
          color="success"
          endContent={<FiSend />}
          onPress={onSubmit}
          isLoading={submitting}
          isDisabled={!isCurrentPageComplete}
          aria-label="Submit form"
        >
          Submit Form
        </Button>
      )}
    </div>
  );
};
