import React, { useCallback, useMemo } from "react";
import { DateRangePicker, DateValue, RangeValue } from "@heroui/react";
import { CalendarDate } from "@internationalized/date";
import { ConvertObjectToCalenderDate } from "../../utils/DateMutation";
type DateRanageSelector = {
  idx: number;
  value: RangeValue<DateValue> | null | undefined;
  rangvalue: RangeValue<DateValue>;
  onSelectionChange: (val: RangeValue<DateValue>) => void;
};
export default function DateRangeSelector({
  value,
  rangvalue,
  onSelectionChange,
}: DateRanageSelector) {
  const defaultValue: RangeValue<DateValue> | null = useMemo(() => {
    if (value && value instanceof CalendarDate) {
      return {
        start: ConvertObjectToCalenderDate(value.start as never) as never,
        end: ConvertObjectToCalenderDate(value.end as never) as never,
      };
    }
    return null;
  }, [value]);

  const [date, setDate] = React.useState(defaultValue);

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
        aria-label={`datepicker`}
        minValue={rangvalue.start}
        maxValue={rangvalue.end}
        value={date}
        onChange={handleChange}
      />
    </div>
  );
}
