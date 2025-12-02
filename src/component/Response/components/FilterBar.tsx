import React from "react";
import { Card, CardHeader, CardBody, Button, Input } from "@heroui/react";
import { FiX, FiFilter } from "react-icons/fi";
import { ResponseDashboardFilterType } from "../Response.type";
import { ResponseDashboardFilterParam } from "../../../types/Global.types";
import { RangeValue } from "@heroui/react";

interface FilterBarProps {
  filterValue: ResponseDashboardFilterType | undefined;
  handleChange: (params: {
    name: keyof ResponseDashboardFilterType;
    value: string | undefined;
  }) => void;
  applyFilters: (props: {
    name:
      | keyof ResponseDashboardFilterParam
      | Array<keyof ResponseDashboardFilterParam>;
    val?: string | RangeValue<string>;
  }) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
  onFilterOpen: () => void;
  removeSearchFilter: () => void;
  removeStatusFilter: () => void;
  removeDateRangeFilter: () => void;
  removeScoreRangeFilter: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filterValue,
  handleChange,
  applyFilters,
  clearFilters,
  hasActiveFilters,
  onFilterOpen,
  removeSearchFilter,
  removeStatusFilter,
  removeDateRangeFilter,
  removeScoreRangeFilter,
}) => {
  return (
    <Card className="dark:bg-gray-800">
      <CardHeader className="flex justify-between items-center">
        <h3 className="text-lg font-semibold dark:text-gray-100">
          Search & Filters
        </h3>
        {hasActiveFilters && (
          <Button
            color="danger"
            variant="flat"
            size="sm"
            onPress={clearFilters}
            startContent={<FiX />}
          >
            Clear All Filters
          </Button>
        )}
      </CardHeader>
      <CardBody>
        <div className="flex gap-3 items-end">
          {/* Search Input - Always Visible */}
          <div className="flex-1">
            <Input
              placeholder="Search by name or email..."
              label="Search"
              value={filterValue?.searchTerm || ""}
              onChange={(e) =>
                handleChange({
                  name: "searchTerm",
                  value: e.target.value || undefined,
                })
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  applyFilters({ name: "q", val: filterValue?.searchTerm });
                }
              }}
              aria-label="search"
              isClearable
              onClear={() => {
                handleChange({ name: "searchTerm", value: undefined });
                applyFilters({ name: "q" });
              }}
              size="lg"
              classNames={{
                input: "text-base",
                inputWrapper: "h-12",
              }}
            />
          </div>

          {/* Filter Button */}
          <Button
            color="primary"
            variant="flat"
            size="lg"
            onPress={onFilterOpen}
            startContent={<FiFilter size={20} />}
            className="h-12 px-6"
          >
            Filters
            {hasActiveFilters && (
              <span className="ml-2 bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                {
                  [
                    filterValue?.completionStatus,
                    filterValue?.dateRange,
                    filterValue?.scoreRange &&
                      (filterValue.scoreRange.start !== 0 ||
                        filterValue.scoreRange.end !== 100),
                  ].filter(Boolean).length
                }
              </span>
            )}
          </Button>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                Active filters:
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Click any filter tag to remove it
              </span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {filterValue?.searchTerm && (
                <button
                  onClick={removeSearchFilter}
                  className="bg-blue-500 text-white px-3 py-1.5 rounded-full text-sm flex items-center gap-2 hover:bg-blue-600 transition-all shadow-sm hover:shadow"
                >
                  <span className="font-medium">Search:</span>
                  <span className="max-w-[150px] truncate">
                    {filterValue.searchTerm}
                  </span>
                  <FiX size={14} className="ml-1" />
                </button>
              )}
              {filterValue?.completionStatus && (
                <button
                  onClick={removeStatusFilter}
                  className="bg-green-500 text-white px-3 py-1.5 rounded-full text-sm flex items-center gap-2 hover:bg-green-600 transition-all shadow-sm hover:shadow"
                >
                  <span className="font-medium">Status:</span>
                  <span>{filterValue.completionStatus}</span>
                  <FiX size={14} className="ml-1" />
                </button>
              )}
              {filterValue?.dateRange && (
                <button
                  onClick={removeDateRangeFilter}
                  className="bg-purple-500 text-white px-3 py-1.5 rounded-full text-sm flex items-center gap-2 hover:bg-purple-600 transition-all shadow-sm hover:shadow"
                >
                  <span className="font-medium">Date Range</span>
                  <FiX size={14} className="ml-1" />
                </button>
              )}
              {filterValue?.scoreRange &&
                (filterValue.scoreRange.start !== 0 ||
                  filterValue.scoreRange.end !== 100) && (
                  <button
                    onClick={removeScoreRangeFilter}
                    className="bg-orange-500 text-white px-3 py-1.5 rounded-full text-sm flex items-center gap-2 hover:bg-orange-600 transition-all shadow-sm hover:shadow"
                  >
                    <span className="font-medium">Score:</span>
                    <span>
                      {filterValue.scoreRange.start || 0}-
                      {filterValue.scoreRange.end || 100}
                    </span>
                    <FiX size={14} className="ml-1" />
                  </button>
                )}
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
};
