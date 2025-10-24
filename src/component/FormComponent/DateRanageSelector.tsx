import { useCallback, useMemo, useEffect, useState } from "react";
import { DateRangePicker, DateValue, RangeValue } from "@heroui/react";
import { parseAbsoluteToLocal } from "@internationalized/date";
import { convertDateValueToString } from "../../helperFunc";

type DateRangeSelector = {
  idx: number;
  value: RangeValue<string> | null | undefined;
  rangvalue: RangeValue<DateValue>;
  onSelectionChange: (val: RangeValue<string>) => void;
  readonly?: boolean;
  label?: string;
};

export default function DateRangeSelector({
  value,
  rangvalue,
  onSelectionChange,
  readonly = false,
  label = "Select date range",
}: DateRangeSelector) {
  const parsedValue: RangeValue<DateValue> | null = useMemo(() => {
    if (!value?.start || !value?.end) return null;

    try {
      const parsed = {
        start: parseAbsoluteToLocal(value.start),
        end: parseAbsoluteToLocal(value.end),
      };

      // Validate the parsed prop values using compare method
      const comparison = parsed.end.compare(parsed.start);

      // Check for invalid prop values but don't throw, just return null
      if (comparison < 0) {
        // end is before start
        console.error(
          "Invalid prop value: Start date is after end date",
          value
        );
        return null;
      }

      if (comparison === 0) {
        // dates are the same
        console.error(
          "Invalid prop value: Start date and end date are the same",
          value
        );
        return null;
      }

      return parsed;
    } catch (error) {
      console.error("Error parsing date range value:", error, value);
      return null;
    }
  }, [value]);

  const [selectedDate, setSelectedDate] =
    useState<RangeValue<DateValue> | null>(parsedValue);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Validate prop values and set error message
  useEffect(() => {
    setSelectedDate(parsedValue);

    // Check if value prop exists but couldn't be parsed (validation failed)
    if (value?.start && value?.end && !parsedValue) {
      // Try to parse again to determine specific error
      try {
        const testParsed = {
          start: parseAbsoluteToLocal(value.start),
          end: parseAbsoluteToLocal(value.end),
        };

        const comparison = testParsed.end.compare(testParsed.start);

        if (comparison < 0) {
          setErrorMessage("Start date cannot be after end date");
        } else if (comparison === 0) {
          setErrorMessage("Start date and end date cannot be the same");
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

      setSelectedDate(val);

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
        if (comparison === 0) {
          setErrorMessage("Start date and end date cannot be the same");
          return;
        }
      }

      setErrorMessage("");

      try {
        onSelectionChange({
          start: convertDateValueToString(val.start),
          end: convertDateValueToString(val.end),
        });
      } catch (error) {
        console.error("Error converting date range to string:", error);
        setErrorMessage("Error processing date range");
      }
    },
    [onSelectionChange, readonly]
  );

  return (
    <div className="w-full max-w-xl flex flex-col items-start gap-4">
      <DateRangePicker
        fullWidth
        aria-label={label}
        granularity="day"
        minValue={rangvalue?.start}
        maxValue={rangvalue?.end}
        value={selectedDate}
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
