import React from "react";
import { Button, Input, Chip } from "@heroui/react";
import { XMarkIcon, SearchIcon, FilterIcon } from "./icons";
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
    <div className="p-4 border-b border-gray-200 bg-white/90 backdrop-blur sticky top-0 z-10 space-y-3">
      {/* Title and close button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 flex items-center">
            Question Structure
            <span className="ml-2 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full font-normal">
              {visibleQuestions} visible
            </span>
          </h2>
          <div className="text-sm text-gray-600 mt-1 flex items-center gap-2">
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
              {totalQuestions} total
            </span>
          </div>
        </div>

        {onClose && (
          <Button
            size="sm"
            variant="light"
            isIconOnly
            onPress={onClose}
            className="rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          >
            <XMarkIcon width="16" height="16" />
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
            <SearchIcon width="16" height="16" className="text-gray-400" />
          }
          size="sm"
          variant="bordered"
          classNames={{
            input: "text-sm",
            inputWrapper:
              "border-gray-200 hover:border-primary/50 focus-within:border-primary/50",
          }}
          isClearable
        />

        {/* Filter chips */}
        <div className="flex flex-wrap gap-1">
          {filterQuestions.types.map((filter) => (
            <Chip
              key={filter.key}
              size="sm"
              variant={selectedFilter === filter.key ? "solid" : "flat"}
              color={selectedFilter === filter.key ? filter.color : "default"}
              className="cursor-pointer transition-all hover:scale-105"
              onClick={() => onFilterChange(filter.key)}
            >
              {filter.label}
            </Chip>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <Button
            size="sm"
            variant="light"
            startContent={<FilterIcon width="14" height="14" />}
            className={`text-xs ${
              showOnlyVisible ? "text-primary" : "text-gray-600"
            }`}
            onPress={onToggleVisibility}
          >
            {showOnlyVisible ? "Show All" : "Visible Only"}
          </Button>

          <Button
            size="sm"
            variant="light"
            className="text-xs text-gray-600"
            onPress={onExpandAll}
          >
            Expand All
          </Button>
        </div>
      </div>
    </div>
  );
};
