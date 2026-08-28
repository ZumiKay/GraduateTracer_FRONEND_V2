import { parseStringToCalendarDate } from "../component/FormComponent/DateRanageSelector";
import { CalendarDate } from "@internationalized/date";

describe("DateRangeSelector date parsing tests", () => {
  describe("parseStringToCalendarDate", () => {
    test("should correctly parse YYYY-MM-DD format", () => {
      const result = parseStringToCalendarDate("2026-08-24");
      expect(result).toBeInstanceOf(CalendarDate);
      expect(result?.year).toBe(2026);
      expect(result?.month).toBe(8);
      expect(result?.day).toBe(24);
    });

    test("should correctly parse ISO 8601 string with timestamp", () => {
      const result = parseStringToCalendarDate("2026-08-24T00:00:00.000Z");
      expect(result).toBeInstanceOf(CalendarDate);
      expect(result?.year).toBe(2026);
      expect(result?.month).toBe(8);
      expect(result?.day).toBe(24);
    });

    test("should correctly parse ISO string without milliseconds", () => {
      const result = parseStringToCalendarDate("2025-12-31T23:59:59Z");
      expect(result).toBeInstanceOf(CalendarDate);
      expect(result?.year).toBe(2025);
      expect(result?.month).toBe(12);
      expect(result?.day).toBe(31);
    });

    test("should return null for invalid date strings", () => {
      expect(parseStringToCalendarDate("invalid-date")).toBeNull();
      expect(parseStringToCalendarDate("")).toBeNull();
      expect(parseStringToCalendarDate(null)).toBeNull();
      expect(parseStringToCalendarDate(undefined)).toBeNull();
    });

    test("should handle date comparisons correctly", () => {
      const start = parseStringToCalendarDate("2026-08-24T00:00:00.000Z");
      const end = parseStringToCalendarDate("2026-08-28T00:00:00.000Z");
      expect(start).not.toBeNull();
      expect(end).not.toBeNull();
      expect(end!.compare(start!)).toBeGreaterThan(0);
    });

    test("should allow same start and end date (equal comparison)", () => {
      const start = parseStringToCalendarDate("2026-08-24T00:00:00.000Z");
      const end = parseStringToCalendarDate("2026-08-24T00:00:00.000Z");
      expect(start).not.toBeNull();
      expect(end).not.toBeNull();
      expect(end!.compare(start!)).toBe(0);
    });
  });
});
