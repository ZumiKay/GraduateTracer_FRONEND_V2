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
