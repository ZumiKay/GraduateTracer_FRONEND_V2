import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  DateRangePicker,
  Slider,
} from "@heroui/react";
import { FiX } from "react-icons/fi";
import Selection from "../../FormComponent/Selection";
import {
  ResponseCompletionStatus,
  ResponseDashboardFilterType,
  ResponseStatusOpt,
  ResponseShowPerPage,
} from "../Response.type";
import { ResponseDashboardFilterParam } from "../../../types/Global.types";
import { RangeValue, DateValue } from "@heroui/react";

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filterValue: ResponseDashboardFilterType | undefined;
  handleChange: (params: {
    name: keyof ResponseDashboardFilterType;
    value:
      | string
      | RangeValue<DateValue | number>
      | ResponseCompletionStatus
      | undefined;
  }) => void;
  applyFilters: (props: {
    name:
      | keyof ResponseDashboardFilterParam
      | Array<keyof ResponseDashboardFilterParam>;
    val?: string | RangeValue<string>;
  }) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
  isQuizForm: boolean;
  limit: number;
  handleLimitChange: (newLimit: number) => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  filterValue,
  handleChange,
  applyFilters,
  clearFilters,
  hasActiveFilters,
  isQuizForm,
  limit,
  handleLimitChange,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
      <ModalContent className="dark:bg-gray-800">
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-xl font-bold dark:text-gray-100">
            Advanced Filters
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-normal">
            Refine your response list with these filters
          </p>
        </ModalHeader>
        <ModalBody className="gap-6 py-6">
          {/* Status Filter */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              Completion Status
              <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
                (Filter by response completion)
              </span>
            </label>
            <Selection
              items={ResponseStatusOpt}
              label="Select Status"
              placeholder="Choose a status"
              selectedKeys={
                filterValue?.completionStatus
                  ? [filterValue.completionStatus]
                  : []
              }
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as
                  | ResponseCompletionStatus
                  | undefined;
                handleChange({
                  name: "completionStatus",
                  value: selected,
                });
                applyFilters({ name: "status", val: selected });
              }}
              size="lg"
              classNames={{
                trigger: "h-12 bg-gray-50 hover:bg-gray-100",
              }}
            />
          </div>

          {/* Items Per Page */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              Items Per Page
              <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
                (Number of responses to display)
              </span>
            </label>
            <Selection
              items={ResponseShowPerPage}
              label="Select Page Size"
              placeholder="Choose items per page"
              selectedKeys={[limit.toString()]}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                handleLimitChange(parseInt(selected));
              }}
              size="lg"
              classNames={{
                trigger:
                  "h-12 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600",
              }}
            />
          </div>

          {/* Date Range Filter */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              Date Range
              <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
                (Filter by submission date)
              </span>
            </label>
            <DateRangePicker
              label="Select Date Range"
              value={
                filterValue?.dateRange &&
                filterValue.dateRange.start &&
                filterValue.dateRange.end
                  ? {
                      start: filterValue.dateRange.start,
                      end: filterValue.dateRange.end,
                    }
                  : null
              }
              onChange={(range) => {
                handleChange({
                  name: "dateRange",
                  value: range || undefined,
                });
                if (range?.start && range?.end) {
                  applyFilters({
                    name: ["startD", "endD"],
                    val: {
                      start: range.start.toString(),
                      end: range.end.toString(),
                    },
                  });
                } else if (!range) {
                  applyFilters({ name: ["startD", "endD"] });
                }
              }}
              className="w-full"
              granularity="day"
              size="lg"
              classNames={{
                base: "bg-gray-50 dark:bg-gray-700 rounded-lg",
                inputWrapper: "h-12 bg-white dark:bg-gray-800",
              }}
            />
          </div>

          {/* Score Range Filter - Only for Quiz Forms */}
          {isQuizForm && (
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                Score Range
                <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
                  (Filter by score percentage)
                </span>
              </label>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <Slider
                  label={
                    <div className="flex justify-between w-full mb-2">
                      <span className="text-sm font-medium dark:text-gray-300">
                        Minimum
                      </span>
                      <span className="text-sm font-medium dark:text-gray-300">
                        Maximum
                      </span>
                    </div>
                  }
                  step={1}
                  maxValue={100}
                  minValue={0}
                  value={[
                    filterValue?.scoreRange?.start || 0,
                    filterValue?.scoreRange?.end || 100,
                  ]}
                  onChange={(value) => {
                    const rangeValue = value as number[];
                    handleChange({
                      name: "scoreRange",
                      value: {
                        start: rangeValue[0],
                        end: rangeValue[1],
                      },
                    });
                  }}
                  onChangeEnd={(value) => {
                    const rangeValue = value as number[];
                    applyFilters({
                      name: ["startS", "endS"],
                      val: {
                        start: rangeValue[0].toString(),
                        end: rangeValue[1].toString(),
                      },
                    });
                  }}
                  className="w-full"
                  color="primary"
                  size="lg"
                  showTooltip={true}
                  formatOptions={{ style: "decimal" }}
                  getValue={(value) => {
                    const rangeValue = value as number[];
                    return `${rangeValue[0]}% - ${rangeValue[1]}%`;
                  }}
                  marks={[
                    { value: 0, label: "0%" },
                    { value: 25, label: "25%" },
                    { value: 50, label: "50%" },
                    { value: 75, label: "75%" },
                    { value: 100, label: "100%" },
                  ]}
                  classNames={{
                    base: "gap-3",
                    track: "h-1.5",
                    thumb: "w-5 h-5",
                  }}
                />
                <div className="mt-3 flex justify-between items-center text-sm">
                  <div className="text-gray-600">
                    Current range:{" "}
                    <span className="font-semibold text-primary">
                      {filterValue?.scoreRange?.start || 0}% -{" "}
                      {filterValue?.scoreRange?.end || 100}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">
                  Active Filters Summary
                </h3>
                <Button
                  color="danger"
                  variant="light"
                  size="sm"
                  onPress={clearFilters}
                  startContent={<FiX />}
                >
                  Clear All
                </Button>
              </div>
              <div className="flex gap-2 flex-wrap">
                {filterValue?.completionStatus && (
                  <div className="bg-green-100 border border-green-300 text-green-800 px-3 py-2 rounded-lg text-sm font-medium">
                    Status: {filterValue.completionStatus}
                  </div>
                )}
                {filterValue?.dateRange && (
                  <div className="bg-purple-100 border border-purple-300 text-purple-800 px-3 py-2 rounded-lg text-sm font-medium">
                    Date Range Applied
                  </div>
                )}
                {filterValue?.scoreRange &&
                  (filterValue.scoreRange.start !== 0 ||
                    filterValue.scoreRange.end !== 100) && (
                    <div className="bg-orange-100 border border-orange-300 text-orange-800 px-3 py-2 rounded-lg text-sm font-medium">
                      Score: {filterValue.scoreRange.start || 0}% -{" "}
                      {filterValue.scoreRange.end || 100}%
                    </div>
                  )}
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter className="border-t">
          <Button color="default" variant="light" onPress={onClose} size="lg">
            Close
          </Button>
          <Button
            color="primary"
            onPress={onClose}
            size="lg"
            className="font-semibold"
          >
            Apply Filters
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
