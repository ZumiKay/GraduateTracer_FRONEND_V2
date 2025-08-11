import {
  validateRangeQuestions,
  validateRangeNumber,
  validateRangeDate,
  getRangeValidationSummary,
} from "../utils/rangeValidation";
import { ContentType, QuestionType } from "../types/Form.types";
import { parseDate } from "@internationalized/date";

describe("Range Validation Tests", () => {
  describe("validateRangeNumber", () => {
    test("should pass for valid number range", () => {
      const validRange = { start: 1, end: 10 };
      expect(validateRangeNumber(validRange)).toBe(true);
    });

    test("should pass for equal start and end values", () => {
      const equalRange = { start: 5, end: 5 };
      expect(validateRangeNumber(equalRange)).toBe(true);
    });

    test("should fail for invalid number range (end < start)", () => {
      const invalidRange = { start: 10, end: 5 };
      expect(validateRangeNumber(invalidRange)).toBe(false);
    });

    test("should pass for undefined range", () => {
      expect(validateRangeNumber(undefined)).toBe(true);
    });
  });

  describe("validateRangeDate", () => {
    test("should pass for valid date range", () => {
      const startDate = parseDate("2024-01-01");
      const endDate = parseDate("2024-12-31");
      const validRange = { start: startDate, end: endDate };
      expect(validateRangeDate(validRange)).toBe(true);
    });

    test("should pass for equal start and end dates", () => {
      const sameDate = parseDate("2024-06-15");
      const equalRange = { start: sameDate, end: sameDate };
      expect(validateRangeDate(equalRange)).toBe(true);
    });

    test("should fail for invalid date range (end before start)", () => {
      const startDate = parseDate("2024-12-31");
      const endDate = parseDate("2024-01-01");
      const invalidRange = { start: startDate, end: endDate };
      expect(validateRangeDate(invalidRange)).toBe(false);
    });

    test("should pass for undefined range", () => {
      expect(validateRangeDate(undefined)).toBe(true);
    });
  });

  describe("validateRangeQuestions", () => {
    test("should pass for valid range number questions", () => {
      const questions: ContentType[] = [
        {
          _id: "q1",
          type: QuestionType.RangeNumber,
          formId: "form-1",
          title: "Valid range number",
          rangenumber: { start: 1, end: 10 },
          page: 1,
        },
      ];

      const errors = validateRangeQuestions(questions);
      expect(errors).toHaveLength(0);
    });

    test("should fail for invalid range number questions", () => {
      const questions: ContentType[] = [
        {
          _id: "q1",
          type: QuestionType.RangeNumber,
          formId: "form-1",
          title: "Invalid range number",
          rangenumber: { start: 10, end: 5 },
          page: 1,
        },
      ];

      const errors = validateRangeQuestions(questions);
      expect(errors).toHaveLength(1);
      expect(errors[0].questionTitle).toBe("Invalid range number");
      expect(errors[0].questionType).toBe(QuestionType.RangeNumber);
      expect(errors[0].errorMessage).toContain(
        "End value (5) must be greater than or equal to start value (10)"
      );
    });

    test("should pass for valid range date questions", () => {
      const startDate = parseDate("2024-01-01");
      const endDate = parseDate("2024-12-31");

      const questions: ContentType[] = [
        {
          _id: "q1",
          type: QuestionType.RangeDate,
          formId: "form-1",
          title: "Valid range date",
          rangedate: { start: startDate, end: endDate },
          page: 1,
        },
      ];

      const errors = validateRangeQuestions(questions);
      expect(errors).toHaveLength(0);
    });

    test("should fail for invalid range date questions", () => {
      const startDate = parseDate("2024-12-31");
      const endDate = parseDate("2024-01-01");

      const questions: ContentType[] = [
        {
          _id: "q1",
          type: QuestionType.RangeDate,
          formId: "form-1",
          title: "Invalid range date",
          rangedate: { start: startDate, end: endDate },
          page: 1,
        },
      ];

      const errors = validateRangeQuestions(questions);
      expect(errors).toHaveLength(1);
      expect(errors[0].questionTitle).toBe("Invalid range date");
      expect(errors[0].questionType).toBe(QuestionType.RangeDate);
      expect(errors[0].errorMessage).toContain(
        "End date must be after or equal to start date"
      );
    });

    test("should pass for non-range question types", () => {
      const questions: ContentType[] = [
        {
          _id: "q1",
          type: QuestionType.ShortAnswer,
          formId: "form-1",
          title: "Short answer question",
          page: 1,
        },
      ];

      const errors = validateRangeQuestions(questions);
      expect(errors).toHaveLength(0);
    });

    test("should handle mixed valid and invalid questions", () => {
      const questions: ContentType[] = [
        {
          _id: "q1",
          type: QuestionType.RangeNumber,
          formId: "form-1",
          title: "Valid range",
          rangenumber: { start: 1, end: 10 },
          page: 1,
        },
        {
          _id: "q2",
          type: QuestionType.RangeNumber,
          formId: "form-1",
          title: "Invalid range",
          rangenumber: { start: 10, end: 5 },
          page: 1,
        },
      ];

      const errors = validateRangeQuestions(questions);
      expect(errors).toHaveLength(1);
      expect(errors[0].questionTitle).toBe("Invalid range");
    });
  });

  describe("getRangeValidationSummary", () => {
    test("should return empty string for no errors", () => {
      const summary = getRangeValidationSummary([]);
      expect(summary).toBe("");
    });

    test("should return single error message", () => {
      const errors = [
        {
          questionId: "q1",
          questionTitle: "Test Question",
          questionType: QuestionType.RangeNumber,
          errorMessage: "End value must be greater than start value",
        },
      ];

      const summary = getRangeValidationSummary(errors);
      expect(summary).toBe(
        "Test Question: End value must be greater than start value"
      );
    });

    test("should return multiple error messages", () => {
      const errors = [
        {
          questionId: "q1",
          questionTitle: "Question 1",
          questionType: QuestionType.RangeNumber,
          errorMessage: "End value must be greater than start value",
        },
        {
          questionId: "q2",
          questionTitle: "Question 2",
          questionType: QuestionType.RangeDate,
          errorMessage: "End date must be after start date",
        },
      ];

      const summary = getRangeValidationSummary(errors);
      expect(summary).toContain("2 questions have invalid ranges:");
      expect(summary).toContain(
        "• Question 1: End value must be greater than start value"
      );
      expect(summary).toContain(
        "• Question 2: End date must be after start date"
      );
    });
  });
});
