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
        onClick={onPrevious}
        isDisabled={currentPage === 1}
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
        >
          Submit Form
        </Button>
      )}
    </div>
  );
};
