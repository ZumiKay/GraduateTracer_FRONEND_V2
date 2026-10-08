import {
  hasObjectChanged,
  calculateFinalTotal,
  generateStorageKey,
  extractStorageKeyComponents,
  cleanupUnrelatedLocalStorage,
  deleteFormLocalStorage,
  saveFormStateToLocalStorage,
} from "../helperFunc";

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

  describe("Calculation Helpers", () => {
    test("calculateFinalTotal computes updated score", () => {
      expect(calculateFinalTotal(100, 20, 35)).toBe(115);
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

    test("deleteFormLocalStorage removes form keys", () => {
      const progressKey = generateStorageKey({ suffix: "progress", formId });

      localStorage.setItem(progressKey, "{}");

      deleteFormLocalStorage({ formId });
      expect(localStorage.getItem(progressKey)).toBeNull();
    });
  });
});
