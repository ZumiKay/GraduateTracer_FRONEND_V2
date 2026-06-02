import { ContentType } from "../types/Form.types";

/**
 * Check for unsaved questions.
 * Validates: ID existence, title, type, options, ranges, answers, conditionals, scores.
 * Steps:
 * 1. Check if questions have IDs
 * 2. Create Map for O(1) lookups
 * 3. Compare primitive fields first (fast path)
 * 4. Compare complex nested objects (deep path)
 */
export const checkUnsavedQuestion = ({
  prevQuestion,
  currentQuestion,
}: {
  prevQuestion: ContentType[];
  currentQuestion: ContentType[];
}): boolean => {
  const hasId = currentQuestion.some((i) => i._id);

  if (!hasId) return true;

  // Create Map for O(1) lookups instead of O(n) find
  const prevQuestionMap = new Map<string, ContentType>();
  prevQuestion.forEach((q) => {
    const key = q._id || q.questionId || "";
    if (key) prevQuestionMap.set(key, q);
  });

  const deepCheck = currentQuestion.some((currQ) => {
    const qKey = currQ._id || currQ.questionId || "";
    const isQuestion = prevQuestionMap.get(qKey);

    if (!isQuestion) return true;

    // Fast path: check primitives and simple fields first
    if (currQ.type !== isQuestion.type) return true;
    if (currQ.score !== isQuestion.score) return true;

    // Helper for deep JSON comparison
    const jsonCheck = <T = unknown>(val1?: T, val2?: T): boolean => {
      return JSON.stringify(val1) !== JSON.stringify(val2);
    };

    // Deep check for complex nested objects
    if (jsonCheck(currQ.title, isQuestion.title)) return true;
    if (jsonCheck(currQ.conditional, isQuestion.conditional)) return true;
    if (jsonCheck(currQ.parentcontent, isQuestion.parentcontent)) return true;

    // Check choice-based questions (checkbox, multiple)
    const hasCheckbox = currQ.checkbox || isQuestion.checkbox;
    if (hasCheckbox && jsonCheck(currQ.checkbox, isQuestion.checkbox))
      return true;

    const hasMultiple = currQ.multiple || isQuestion.multiple;
    if (hasMultiple && jsonCheck(currQ.multiple, isQuestion.multiple))
      return true;

    // Check range-based questions
    const hasRangeDate = currQ.rangedate || isQuestion.rangedate;
    if (hasRangeDate && jsonCheck(currQ.rangedate, isQuestion.rangedate))
      return true;

    const hasRangeNumber = currQ.rangenumber || isQuestion.rangenumber;
    if (hasRangeNumber && jsonCheck(currQ.rangenumber, isQuestion.rangenumber))
      return true;

    // Check answer key changes
    if (jsonCheck(currQ.answer, isQuestion.answer)) return true;

    // No changes detected
    return false;
  });

  return deepCheck;
};
