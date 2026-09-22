import React from "react";
import { Button, Input, Chip } from "@heroui/react";
import { XMarkIcon, SearchIcon, FilterIcon } from "./Assets";
import { filterQuestions } from "./utils";

interface HeaderProps {
  currentPage: number;
  totalPages: number;
  totalQuestions: number;
  visibleQuestions: number;
  searchQuery: string;
  selectedFilter: string;
  showOnlyVisible: boolean;
  onSearchChange: (query: string) => void;
  onFilterChange: (filter: string) => void;
  onToggleVisibility: () => void;
  onExpandAll: () => void;
  onClose?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  totalPages,
  totalQuestions,
  visibleQuestions,
  searchQuery,
  selectedFilter,
  showOnlyVisible,
  onSearchChange,
  onFilterChange,
  onToggleVisibility,
  onExpandAll,
  onClose,
}) => {
  return (
    <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-800/95 backdrop-blur sticky top-0 z-10 space-y-2.5 shrink-0">
      {/* Title and close button */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-gray-800 dark:text-white truncate">
              Question Outline
            </h2>
            <Chip
              size="sm"
              variant="flat"
              color="primary"
              className="text-[11px] sm:text-xs h-5 px-1.5 shrink-0 font-medium"
            >
              {visibleQuestions} visible
            </Chip>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1.5">
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <span>•</span>
            <span>{totalQuestions} total</span>
          </div>
        </div>

        {onClose && (
          <Button
            size="sm"
            variant="light"
            isIconOnly
            onPress={onClose}
            aria-label="Close question outline"
            className="rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/60 w-8 h-8 min-w-8 shrink-0"
          >
            <XMarkIcon width="18" height="18" />
          </Button>
        )}
      </div>

      {/* Search and filter controls */}
      <div className="space-y-2">
        {/* Search input */}
        <Input
          placeholder="Search questions..."
          value={searchQuery}
          onValueChange={onSearchChange}
          startContent={
            <SearchIcon width="15" height="15" className="text-gray-400 shrink-0" />
          }
          size="sm"
          variant="bordered"
          classNames={{
            input: "text-xs sm:text-sm",
            inputWrapper:
              "h-8 min-h-8 border-gray-200 dark:border-gray-700 hover:border-primary/50 focus-within:border-primary/50 bg-gray-50/70 dark:bg-gray-900/50 rounded-lg",
          }}
          isClearable
        />

        {/* Filter chips - Horizontal scroll on mobile so it doesn't wrap and bloat vertical height */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1 scroll-smooth">
          {filterQuestions.types.map((filter) => (
            <Chip
              key={filter.key}
              size="sm"
              variant={selectedFilter === filter.key ? "solid" : "flat"}
              color={selectedFilter === filter.key ? filter.color : "default"}
              className="cursor-pointer transition-all text-xs shrink-0 select-none hover:opacity-90"
              onClick={() => onFilterChange(filter.key)}
            >
              {filter.label}
            </Chip>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-gray-700/60">
          <Button
            size="sm"
            variant="light"
            startContent={<FilterIcon width="13" height="13" className="shrink-0" />}
            className={`h-7 px-2 text-xs font-medium ${
              showOnlyVisible
                ? "text-primary dark:text-emerald-400 font-semibold"
                : "text-gray-600 dark:text-gray-300"
            }`}
            onPress={onToggleVisibility}
          >
            {showOnlyVisible ? "Visible Only" : "All Conditions"}
          </Button>

          <Button
            size="sm"
            variant="light"
            className="h-7 px-2 text-xs text-gray-600 dark:text-gray-300 font-medium"
            onPress={onExpandAll}
          >
            Expand All
          </Button>
        </div>
      </div>
    </div>
  );
};
