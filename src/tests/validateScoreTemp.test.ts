import { validateScoreTemp } from "../utils/formValidation";
import {
  QuestionType,
  ScoringAnalysis,
  ContentType,
} from "../types/Form.types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeAnalysis = (
  overrides: Partial<ScoringAnalysis> = {},
): ScoringAnalysis => ({
  isAutoScoreable: false,
  totalQuestions: 0,
  scoredQuestions: 0,
  autoScorableQuestions: 0,
  manualGradingQuestions: 0,
  missingAnswerKeys: {},
  unsupportedTypes: {},
  ...overrides,
});

const q = (
  id: string,
  type: QuestionType,
  score?: number,
  answer?: unknown,
  page = 1,
): Partial<ContentType> => ({
  _id: id,
  formId: "form1",
  qIdx: Number(id.replace(/\D/g, "") || "0"),
  type,
  score,
  answer: answer as ContentType["answer"],
  page,
});

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe("validateScoreTemp", () => {
  // ── 1. Bootstrap path ─────────────────────────────────────────────────────
  describe("bootstrap (no prevRes / null prevRes)", () => {
    test("derives all counts from currentContent when prevRes is falsy", () => {
      const questions = [
        q("1", QuestionType.MultipleChoice, 5, { key: 0, val: "A" }),
        q("2", QuestionType.CheckBox, 10, { key: [0, 1], val: ["A", "B"] }),
      ] as ContentType[];

      const result = validateScoreTemp(
        null as unknown as ScoringAnalysis,
        null as unknown as ScoringAnalysis,
        questions,
      );

      expect(result.totalQuestions).toBe(2);
      expect(result.scoredQuestions).toBe(2);
      expect(result.autoScorableQuestions).toBe(2);
      expect(result.manualGradingQuestions).toBe(0);
      expect(result.isAutoScoreable).toBe(true);
    });
  });

  // ── 2. CurrentPage Count & Delta ──────────────────────────────────────────
  describe("currentPage count & delta calculations", () => {
    test("calculates deltas correctly when initialCurrentPageScoreAnalysis is empty", () => {
      const initialPage = makeAnalysis({
        totalQuestions: 0,
        scoredQuestions: 0,
        autoScorableQuestions: 0,
        manualGradingQuestions: 0,
      });

      const prevRes = makeAnalysis({
        totalQuestions: 5,
        scoredQuestions: 3,
        autoScorableQuestions: 3,
        manualGradingQuestions: 0,
        isAutoScoreable: true,
      });

      const current = [
        q("p1_1", QuestionType.MultipleChoice, 5, { key: 0 }),
        q("p1_2", QuestionType.CheckBox, 10, { key: [0] }),
      ] as ContentType[];

      const result = validateScoreTemp(initialPage, prevRes, current);

      // (5 - 0 + 2) = 7 total, scored = 3 - 0 + 2 = 5
      expect(result.totalQuestions).toBe(7);
      expect(result.scoredQuestions).toBe(5);
      expect(result.autoScorableQuestions).toBe(5);
      expect(result.manualGradingQuestions).toBe(0);
      expect(result.isAutoScoreable).toBe(true);
    });

    test("detects manual-grading question (Paragraph with score, no answer key)", () => {
      const initialPage = makeAnalysis();
      const prev = makeAnalysis();
      const current = [
        q("1", QuestionType.Paragraph, 5 /* no answer */),
      ] as ContentType[];

      const result = validateScoreTemp(initialPage, prev, current);

      expect(result.totalQuestions).toBe(1);
      expect(result.scoredQuestions).toBe(1);
      expect(result.autoScorableQuestions).toBe(0);
      expect(result.manualGradingQuestions).toBe(1);
      expect(result.isAutoScoreable).toBe(false);
    });

    test("display-only questions (Text) do not count as scored or manual", () => {
      const initialPage = makeAnalysis();
      const prev = makeAnalysis();
      const current = [
        q("1", QuestionType.Text /* no score, display only */),
      ] as ContentType[];

      const result = validateScoreTemp(initialPage, prev, current);

      expect(result.totalQuestions).toBe(1);
      expect(result.scoredQuestions).toBe(0);
      expect(result.manualGradingQuestions).toBe(0);
      expect(result.isAutoScoreable).toBe(false);
    });
  });

  // ── 3. Total Count & Positivity Guarantee (Math.abs) ──────────────────────
  describe("total count & Math.abs positivity guarantee", () => {
    test("correctly applies delta when initial page snapshot is provided", () => {
      const formWide = makeAnalysis({
        isAutoScoreable: false,
        totalQuestions: 10,
        scoredQuestions: 8,
        autoScorableQuestions: 6,
        manualGradingQuestions: 2,
      });

      const initialPageAnalysis = makeAnalysis({
        totalQuestions: 3,
        scoredQuestions: 2,
        autoScorableQuestions: 1,
        manualGradingQuestions: 1,
      });

      const newPage2 = [
        q("p2_1", QuestionType.MultipleChoice, 5, { answer: 0 }, 2),
        q("p2_2", QuestionType.ShortAnswer, 5, { answer: "foo" }, 2), // now has answer
        q("p2_3", QuestionType.Number, 5, { answer: 10 }, 2), // upgraded to scored
      ] as ContentType[];

      const result = validateScoreTemp(initialPageAnalysis, formWide, newPage2);

      expect(result.totalQuestions).toBe(10);
      expect(result.scoredQuestions).toBe(9);
      expect(result.autoScorableQuestions).toBe(8);
      expect(result.manualGradingQuestions).toBe(1);
      expect(result.isAutoScoreable).toBe(false);
    });

    test("Math.abs guarantees all outputs remain positive when delta is negative", () => {
      const formWide = makeAnalysis({
        totalQuestions: 2,
        scoredQuestions: 2,
        autoScorableQuestions: 2,
        manualGradingQuestions: 0,
      });

      // Initial page contributed 5 scored questions to formWide
      const initialPageAnalysis = makeAnalysis({
        totalQuestions: 5,
        scoredQuestions: 5,
        autoScorableQuestions: 5,
        manualGradingQuestions: 0,
      });

      // New page has 0 questions
      const newPage: ContentType[] = [];

      // Raw delta: (2 - 5 + 0) = -3
      // Math.abs(-3) = 3
      const result = validateScoreTemp(initialPageAnalysis, formWide, newPage);

      expect(result.totalQuestions).toBe(3);
      expect(result.scoredQuestions).toBe(3);
      expect(result.autoScorableQuestions).toBe(3);
      expect(result.manualGradingQuestions).toBe(0);
      expect(result.scoredQuestions).toBeGreaterThan(0);
    });
  });

  // ── 4. Guard / edge cases ─────────────────────────────────────────────────
  describe("guard cases", () => {
    test("returns prevRes unchanged when currentContent is null/undefined", () => {
      const initialPage = makeAnalysis();
      const prev = makeAnalysis({ totalQuestions: 5, scoredQuestions: 3 });
      const result = validateScoreTemp(
        initialPage,
        prev,
        null as unknown as ContentType[],
      );
      expect(result).toBe(prev);
    });

    test("returns prevRes unchanged when currentContent is not an array", () => {
      const initialPage = makeAnalysis();
      const prev = makeAnalysis({ totalQuestions: 5 });
      const result = validateScoreTemp(
        initialPage,
        prev,
        "bad input" as unknown as ContentType[],
      );
      expect(result).toBe(prev);
    });
  });
});
