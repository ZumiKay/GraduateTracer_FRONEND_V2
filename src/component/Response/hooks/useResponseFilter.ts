import { useCallback, useEffect, useState } from "react";
import {
  ResponseCompletionStatus,
  ResponseDashboardFilterType,
} from "../Response.type";
import { DateValue, RangeValue } from "@heroui/react";
import { useSearchParams } from "react-router-dom";
import { parseDate } from "@internationalized/date";
import { ResponseDashboardFilterParam } from "../../../types/Global.types";

interface UseResponseFilterReturn {
  filterValue: ResponseDashboardFilterType | undefined;
  handleChange: (params: {
    name: keyof ResponseDashboardFilterType;
    value:
      | string
      | RangeValue<DateValue | number>
      | ResponseCompletionStatus
      | undefined;
  }) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
  applyFilters: (props: {
    name:
      | keyof ResponseDashboardFilterParam
      | Array<keyof ResponseDashboardFilterParam>;
    val?: string | RangeValue<string>;
  }) => void;
}

export const useResponseFilter = (): UseResponseFilterReturn => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filterValue, setFilterValue] = useState<ResponseDashboardFilterType>();

  // Initial set filter value
  useEffect(() => {
    const searchTerm = searchParams.get("q") ?? undefined;
    const startDate = searchParams.get("startD");
    const endDate = searchParams.get("endD");
    let dateRange: RangeValue<DateValue> | undefined;

    if (startDate && endDate) {
      try {
        dateRange = {
          start: parseDate(startDate),
          end: parseDate(endDate),
        };
      } catch (error) {
        console.warn("Invalid date format in URL params:", error);
        dateRange = undefined;
      }
    }

    const startScore = searchParams.get("startS");
    const endScore = searchParams.get("endS");
    let scoreRange: RangeValue<number | undefined> | undefined;

    if (startScore || endScore) {
      scoreRange = {
        start:
          startScore && !isNaN(Number(startScore))
            ? Number(startScore)
            : undefined,
        end:
          endScore && !isNaN(Number(endScore)) ? Number(endScore) : undefined,
      };
    }

    // Parse completion status
    const statusParam = searchParams.get("status");
    const completionStatus: ResponseCompletionStatus | undefined =
      statusParam &&
      Object.values(ResponseCompletionStatus).includes(
        statusParam as ResponseCompletionStatus
      )
        ? (statusParam as ResponseCompletionStatus)
        : undefined;

    setFilterValue({
      searchTerm,
      dateRange,
      scoreRange,
      completionStatus,
    });
  }, [searchParams]);

  // Handle filter changes
  const handleChange = useCallback(
    ({
      name,
      value,
    }: {
      name: keyof ResponseDashboardFilterType;
      value:
        | string
        | RangeValue<DateValue | number>
        | ResponseCompletionStatus
        | undefined;
    }) => {
      setFilterValue((prev) => ({
        ...prev,
        [name]: value,
      }));
    },
    []
  );

  // Apply filters
  const applyFilters = useCallback(
    ({
      name,
      val,
    }: {
      name:
        | keyof ResponseDashboardFilterParam
        | Array<keyof ResponseDashboardFilterParam>;
      val?: string | RangeValue<string>;
    }) => {
      setSearchParams((prev) => {
        const newParam = new URLSearchParams(prev);

        if (!val) {
          //Remove Param
          if (typeof name === "string") {
            newParam.delete(name as never);
          } else name.forEach((i) => newParam.delete(i));
        } else {
          //Add Param
          if (typeof name === "string") {
            newParam.set(name, val.toString());
          } else {
            const rangeVal = Object.values(val);

            name.forEach((i, idx) => newParam.set(i, rangeVal[idx]));
          }
        }

        newParam.set("page", "1");

        return newParam;
      });
    },
    [setSearchParams]
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilterValue({
      searchTerm: undefined,
      dateRange: undefined,
      scoreRange: undefined,
      completionStatus: undefined,
    });

    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.delete("q");
      newParams.delete("startD");
      newParams.delete("endD");
      newParams.delete("startS");
      newParams.delete("endS");
      newParams.delete("status");
      newParams.set("page", "1");
      return newParams;
    });
  }, [setSearchParams]);

  // Check if any filters are active
  const hasActiveFilters = Boolean(
    filterValue?.searchTerm ||
      filterValue?.dateRange ||
      filterValue?.scoreRange ||
      filterValue?.completionStatus
  );

  return {
    filterValue,
    handleChange,
    clearFilters,
    hasActiveFilters,
    applyFilters,
  };
};
