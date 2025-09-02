import React, { useCallback, useMemo } from "react";
import { DateRangePicker, DateValue, RangeValue } from "@heroui/react";
import { parseDate } from "@internationalized/date";
import { convertDateValueToString } from "../../helperFunc";
type DateRanageSelector = {
  idx: number;
  value: RangeValue<string> | null | undefined;
  rangvalue: RangeValue<DateValue>;
  onSelectionChange: (val: RangeValue<string>) => void;
};
export default function DateRangeSelector({
  value,
  rangvalue,
  onSelectionChange,
}: DateRanageSelector) {
  const defaultValue: RangeValue<DateValue> | null = useMemo(() => {
    if (value) {
      return {
        start: parseDate(value.start),
        end: parseDate(value.end),
      };
    }
    return null;
  }, [value]);

  const [date, setDate] = React.useState(defaultValue);

  const handleChange = useCallback(
    (val: RangeValue<DateValue> | null) => {
      setDate(val);
      if (!val) return;

      onSelectionChange({
        start: convertDateValueToString(val.start),
        end: convertDateValueToString(val.end),
      });
    },
    [onSelectionChange]
  );

  return (
    <div className="w-full max-w-xl flex flex-col items-start gap-4">
      <DateRangePicker
        fullWidth
        aria-label={`datepicker`}
        minValue={rangvalue.start}
        maxValue={rangvalue.end}
        value={date}
        onChange={handleChange}
      />
    </div>
  );
}
