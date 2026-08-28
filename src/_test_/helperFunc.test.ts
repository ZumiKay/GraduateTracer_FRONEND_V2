import {
  hasObjectChanged,
  FormatDate,
  isMoreThanDay,
  CalculateNewIdx,
  calculateFinalTotal,
  CalculateRemainMaxScore,
  generateStorageKey,
  extractStorageKeyComponents,
  cleanupUnrelatedLocalStorage,
  deleteFormLocalStorage,
  clearAllStateLocalStorage,
  getLocalStorageStats,
  cleanupOldLocalStorage,
  listLocalStorageItems,
  saveFormStateToLocalStorage,
  validateConditionalStructure,
  flattenConditionalContent,
  getConditionalDepth,
} from "../helperFunc";
import { ContentType, QuestionType } from "../types/Form.types";

describe("helperFunc Unit Tests", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe("hasObjectChanged", () => {
    test("returns false for identical references or equal primitives", () => {
      const obj = { a: 1, b: "test" };
      expect(hasObjectChanged(obj, obj)).toBe(false);
      expect(hasObjectChanged(5, 5)).toBe(false);
      expect(hasObjectChanged("abc", "abc")).toBe(false);
    });

    test("returns false for deeply identical objects", () => {
      const obj1 = { a: 1, b: { c: "nested", d: [1, 2] } };
      const obj2 = { a: 1, b: { c: "nested", d: [1, 2] } };
      expect(hasObjectChanged(obj1, obj2)).toBe(false);
    });

    test("returns true when properties differ", () => {
      expect(hasObjectChanged({ a: 1 }, { a: 2 })).toBe(true);
      expect(hasObjectChanged({ a: 1 }, { a: 1, b: 2 })).toBe(true);
      expect(hasObjectChanged({ a: 1, b: 2 }, { a: 1 })).toBe(true);
    });
  });

  describe("Date & Calculation Helpers", () => {
    test("FormatDate formats Date object to YYYY-MM-DD", () => {
      const date = new Date(2026, 7, 28); // Month is 0-indexed (7 = Aug)
      expect(FormatDate(date)).toBe("2026-08-28");
    });

    test("FormatDate returns empty string for invalid date", () => {
      expect(FormatDate(new Date("invalid"))).toBe("");
    });

    test("isMoreThanDay correctly identifies past timestamps", () => {
      const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      expect(isMoreThanDay(twoDaysAgo)).toBe(true);
      expect(isMoreThanDay(oneHourAgo)).toBe(false);
    });

    test("CalculateNewIdx returns absolute difference", () => {
      expect(CalculateNewIdx(3, 5)).toBe(2);
      expect(CalculateNewIdx(5, 3)).toBe(2);
    });

    test("calculateFinalTotal computes updated score", () => {
      expect(calculateFinalTotal(100, 20, 35)).toBe(115);
    });

    test("CalculateRemainMaxScore computes remaining score bound by 0", () => {
      expect(
        CalculateRemainMaxScore({
          parentScore: 100,
          siblingScore: 40,
          currentScore: 20,
        }),
      ).toBe(40);

      expect(
        CalculateRemainMaxScore({
          parentScore: 50,
          siblingScore: 40,
          currentScore: 20,
        }),
      ).toBe(0);
    });
  });

  describe("LocalStorage Helpers", () => {
    const formId = "form123";
    const userKey = "user@example.com";

    test("generateStorageKey & extractStorageKeyComponents", () => {
      const key = generateStorageKey({ suffix: "progress", formId, userKey });
      expect(key).toBe(`form_progress_${formId}_${userKey}_progress`);

      const parsed = extractStorageKeyComponents(key);
      expect(parsed.formId).toBe(formId);
      expect(parsed.userKey).toBe(userKey);
      expect(parsed.suffix).toBe("progress");

      const invalidParsed = extractStorageKeyComponents("invalid_key");
      expect(invalidParsed.formId).toBeNull();
    });

    test("saveFormStateToLocalStorage merges state or replaces", () => {
      const key = generateStorageKey({ suffix: "state", formId });

      // Save initial state
      saveFormStateToLocalStorage({ key, data: { step: 1, answered: false } });
      expect(JSON.parse(localStorage.getItem(key)!)).toEqual({
        step: 1,
        answered: false,
      });

      // Merge update
      saveFormStateToLocalStorage({ key, data: { answered: true } });
      expect(JSON.parse(localStorage.getItem(key)!)).toEqual({
        step: 1,
        answered: true,
      });

      // Replace state
      saveFormStateToLocalStorage({
        replace: true,
        key,
        data: { reset: true },
      });
      expect(JSON.parse(localStorage.getItem(key)!)).toEqual({ reset: true });
    });

    test("cleanupUnrelatedLocalStorage keeps active form and deletes others", () => {
      const activeKey = generateStorageKey({ suffix: "progress", formId, userKey });
      const otherKey = generateStorageKey({ suffix: "progress", formId: "otherForm" });

      localStorage.setItem(activeKey, JSON.stringify({ page: 1 }));
      localStorage.setItem(otherKey, JSON.stringify({ page: 1 }));

      const result = cleanupUnrelatedLocalStorage({ formId, userKey, suffix: "progress" });

      expect(result.deletedCount).toBe(1);
      expect(result.deletedKeys).toContain(otherKey);
      expect(localStorage.getItem(activeKey)).not.toBeNull();
      expect(localStorage.getItem(otherKey)).toBeNull();
    });

    test("deleteFormLocalStorage and clearAllStateLocalStorage", () => {
      const progressKey = generateStorageKey({ suffix: "progress", formId });
      const stateKey = generateStorageKey({ suffix: "state", formId, userKey });

      localStorage.setItem(progressKey, "{}");
      localStorage.setItem(stateKey, "{}");

      clearAllStateLocalStorage({ formId, userKey });
      expect(localStorage.getItem(stateKey)).toBeNull();

      deleteFormLocalStorage({ formId });
      expect(localStorage.getItem(progressKey)).toBeNull();
    });

    test("getLocalStorageStats, cleanupOldLocalStorage, and listLocalStorageItems", () => {
      const oldTime = Date.now() - 10 * 24 * 60 * 60 * 1000;
      const recentTime = Date.now();

      const oldKey = generateStorageKey({ suffix: "old", formId });
      const recentKey = generateStorageKey({ suffix: "recent", formId });

      localStorage.setItem(oldKey, JSON.stringify({ timestamp: oldTime }));
      localStorage.setItem(recentKey, JSON.stringify({ timestamp: recentTime }));

      const stats = getLocalStorageStats();
      expect(stats.totalKeys).toBe(2);
      expect(stats.formProgressKeys).toBe(2);

      const items = listLocalStorageItems();
      expect(items.length).toBe(2);

      const cleanup = cleanupOldLocalStorage(7 * 24 * 60 * 60 * 1000);
      expect(cleanup.deletedCount).toBe(1);
      expect(cleanup.deletedKeys).toContain(oldKey);
      expect(localStorage.getItem(recentKey)).not.toBeNull();
    });
  });

  describe("Conditional Content Helpers", () => {
    test("validateConditionalStructure detects broken references", () => {
      const validContent: ContentType[] = [
        {
          _id: "q1" as never,
          formId: "f1" as never,
          qIdx: 0,
          type: QuestionType.MultipleChoice,
          conditional: [{ key: 0, contentId: "q2" as never, _id: "c1" as never }],
        },
        {
          _id: "q2" as never,
          formId: "f1" as never,
          qIdx: 1,
          type: QuestionType.Text,
          parentcontent: { qId: "q1", optIdx: 0 },
        },
      ];

      expect(validateConditionalStructure(validContent).isValid).toBe(true);

      const brokenContent: ContentType[] = [
        {
          _id: "q1" as never,
          formId: "f1" as never,
          qIdx: 0,
          type: QuestionType.MultipleChoice,
          conditional: [
            { key: 0, contentId: "nonexistent" as never, _id: "c1" as never },
          ],
        },
      ];

      const validation = validateConditionalStructure(brokenContent);
      expect(validation.isValid).toBe(false);
      expect(validation.errors[0]).toContain("references non-existent content ID nonexistent");
    });

    test("flattenConditionalContent and getConditionalDepth", () => {
      const contentList: ContentType[] = [
        {
          _id: "root" as never,
          formId: "f1" as never,
          qIdx: 0,
          type: QuestionType.MultipleChoice,
          conditional: [{ key: 0, contentId: "child" as never, _id: "c1" as never }],
        },
        {
          _id: "child" as never,
          formId: "f1" as never,
          qIdx: 1,
          type: QuestionType.Text,
          parentcontent: { qId: "root", optIdx: 0 },
        },
      ];

      const flattened = flattenConditionalContent(contentList);
      expect(flattened.map((item) => item._id)).toEqual(["root", "child"]);

      const depth = getConditionalDepth(contentList[0], contentList);
      expect(depth).toBe(1);
    });
  });
});
