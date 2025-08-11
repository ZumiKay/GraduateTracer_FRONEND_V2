import { CalendarDate } from "@internationalized/date";

export const ConvertObjectToCalenderDate = (value: Record<string, unknown>) => {
  if (value instanceof CalendarDate) {
    return new CalendarDate(value.year, value.month, value.day);
  }
};
