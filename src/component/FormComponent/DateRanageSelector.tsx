import { useCallback, useMemo, useEffect, useState } from "react";
import {
  DateRangePicker,
  RangeValue,
} from "@heroui/react";
import {
  CalendarDate,
  DateValue,
  parseAbsoluteToLocal,
  parseDate,
  toCalendarDate,
} from "@internationalized/date";
import { convertDateValueToString } from "../../helperFunc";

type DateRangeSelector = {
  idx: number;
  value: RangeValue<string> | null | undefined;
  rangvalue?: RangeValue<DateValue> | null;
  onSelectionChange: (val: RangeValue<string>) => void;
  readonly?: boolean;
  label?: string;
};

export const parseStringToCalendarDate = (
  dateStr: string | null | undefined,
): CalendarDate | null => {
  if (!dateStr || typeof dateStr !== "string") return null;

  try {
    const trimmed = dateStr.trim();
    // 1. Direct YYYY-MM-DD match
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return parseDate(trimmed);
    }

    // 2. ISO string with T separator (e.g. "2026-08-24T00:00:00.000Z")
    const datePart = trimmed.split("T")[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
      return parseDate(datePart);
    }

    // 3. Fallback to parseAbsoluteToLocal for ISO formats with timezone
    return toCalendarDate(parseAbsoluteToLocal(trimmed));
  } catch {
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return new CalendarDate(
          d.getFullYear(),
          d.getMonth() + 1,
          d.getDate(),
        );
      }
    } catch {
      // ignore
    }
    return null;
  }
};

export default function DateRangeSelector({
  value,
  rangvalue,
  onSelectionChange,
  readonly = false,
  label = "Select date range",
}: DateRangeSelector) {
  const parsedValue: RangeValue<CalendarDate> | null = useMemo(() => {
    if (!value?.start || !value?.end) return null;

    try {
      const start = parseStringToCalendarDate(value.start);
      const end = parseStringToCalendarDate(value.end);

      if (!start || !end) {
        return null;
      }

      // Validate the parsed prop values using compare method
      const comparison = end.compare(start);

      // Check for invalid prop values: end must be after or equal to start
      if (comparison < 0) {
        // end is before start
        console.error(
          "Invalid prop value: Start date is after end date",
          value,
        );
        return null;
      }

      return { start, end };
    } catch (error) {
      console.error("Error parsing date range value:", error, value);
      return null;
    }
  }, [value]);

  const [selectedDate, setSelectedDate] = useState<
    RangeValue<CalendarDate> | null | undefined
  >(parsedValue);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Validate prop values and set error message
  useEffect(() => {
    setSelectedDate(parsedValue);

    // Check if value prop exists but couldn't be parsed (validation failed)
    if (value?.start && value?.end && !parsedValue) {
      // Try to parse again to determine specific error
      try {
        const start = parseStringToCalendarDate(value.start);
        const end = parseStringToCalendarDate(value.end);

        if (!start || !end) {
          setErrorMessage("Invalid date format");
        } else if (end.compare(start) < 0) {
          setErrorMessage("Start date cannot be after end date");
        } else {
          setErrorMessage("");
        }
      } catch {
        setErrorMessage("Invalid date format");
      }
    } else {
      // Clear error when prop value changes to valid or null
      setErrorMessage("");
    }
  }, [parsedValue, value]);

  const handleChange = useCallback(
    (val: RangeValue<DateValue> | null) => {
      if (readonly) return;

      setSelectedDate(val as RangeValue<CalendarDate> | null);

      if (!val) {
        setErrorMessage("");
        return;
      }

      // Validate date range
      if (val.start && val.end) {
        const comparison = val.end.compare(val.start);

        if (comparison < 0) {
          setErrorMessage("Start date cannot be after end date");
          return;
        }
      }

      setErrorMessage("");

      try {
        //?Date answer key is convert to string
        if (val.start && val.end) {
          onSelectionChange({
            start: convertDateValueToString(val.start),
            end: convertDateValueToString(val.end),
          });
        }
      } catch (error) {
        console.error("Error converting date range to string:", error);
        setErrorMessage("Error processing date range");
      }
    },
    [onSelectionChange, readonly],
  );

  return (
    <div className="w-full max-w-xl flex flex-col items-start gap-4">
      <DateRangePicker
        fullWidth
        aria-label={label}
        granularity="day"
        minValue={rangvalue?.start}
        maxValue={rangvalue?.end}
        value={selectedDate as never}
        onChange={handleChange}
        isDisabled={readonly}
        isInvalid={!!errorMessage}
        errorMessage={errorMessage}
        showMonthAndYearPickers
        visibleMonths={2}
        pageBehavior="single"
        classNames={{
          base: "w-full",
          calendar: "w-full",
        }}
      />
    </div>
  );
}
