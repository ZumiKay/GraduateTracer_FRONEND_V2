import { ConditionalType, ContentType } from "../types/Form.types";

/**
 * Check if any conditional child question exists in the question list
 * @param conditions - Array of conditional references from parent question
 * @param allquestion - Array of all questions to check against
 * @returns Boolean - true if at least one conditional child exists
 */
export const isConditonExist = ({
  conditions,
  allquestion,
}: {
  conditions: Array<ConditionalType>;
  allquestion: Array<ContentType>;
}): boolean => {
  if (!conditions?.length || !allquestion?.length) {
    return false;
  }

  const questionIds = new Set<string | number>();
  allquestion.forEach((q, idx) => {
    if (q._id) questionIds.add(q._id.toString());
    questionIds.add(idx); // Also add array index for contentIdx matching
  });

  // Check if any condition references an existing question
  return conditions.some((cond) => {
    // Check by contentId (database reference)
    if (cond.contentId) {
      return questionIds.has(cond.contentId.toString());
    }
    // Check by contentIdx (array index reference)
    if (cond.contentIdx !== undefined) {
      return questionIds.has(cond.contentIdx);
    }
    return false;
  });
};

/**
 * Check if all linked conditional questions are visible
 * @param target - The target question ID or index
 * @param allquestion - Array of all questions
 * @returns Boolean - true if all linked conditional questions are visible
 */
export const isQuestionsLinkedVisible = ({
  target,
  allquestion,
}: {
  target: string | number;
  allquestion: Array<ContentType>;
}): boolean => {
  // Find target question
  const targetQuestion = allquestion.find(
    (q) => q._id === target || q.qIdx === target
  );

  if (!targetQuestion?.conditional?.length) {
    return false;
  }

  const questionMap = new Map<string | number, ContentType>();
  allquestion.forEach((q, idx) => {
    if (q._id) questionMap.set(q._id, q);
    else questionMap.set(idx, q);
  });

  // Check visibility of all linked conditional questions
  for (const condition of targetQuestion.conditional) {
    const linkedQuestion =
      (condition.contentId && questionMap.get(condition.contentId)) ||
      (condition.contentIdx !== undefined &&
        questionMap.get(condition.contentIdx));

    if (linkedQuestion && !linkedQuestion.isVisible) {
      return false;
    }
  }

  return true;
};
