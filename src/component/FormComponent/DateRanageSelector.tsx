import React, { useCallback } from "react";
import { DateRangePicker, DateValue, RangeValue } from "@heroui/react";

type DateRanageSelector = {
  idx: number;
  value: RangeValue<DateValue> | null;
  onSelectionChange: (val: RangeValue<DateValue>) => void;
};
export default function DateRangeSelector({
  value,
  onSelectionChange,
}: DateRanageSelector) {
  const [date, setDate] = React.useState(value);

  const handleChange = useCallback(
    (val: RangeValue<DateValue> | null) => {
      setDate(val);
      if (!val) return;
      onSelectionChange(val);
    },
    [onSelectionChange]
  );

  return (
    <div className="w-full max-w-xl flex flex-col items-start gap-4">
      <DateRangePicker
        fullWidth
        granularity="day"
        aria-label={`datepicker`}
        value={date}
        onChange={handleChange}
      />
    </div>
  );
}
