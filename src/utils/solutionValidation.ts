import {
  AUTO_SCORABLE_TYPES,
  ContentType,
  QuestionValidationIssue,
} from "../types/Form.types";

/** Whether an answer key actually holds a value (empty strings/arrays don't count) */
export const hasAnswerKey = (question: ContentType): boolean => {
  const raw = question.answer;
  if (!raw || Array.isArray(raw) || typeof raw !== "object" || !("answer" in raw)) {
    return false;
  }
  const answer = (raw as { answer?: unknown }).answer;
  if (answer === "" || answer === null || answer === undefined) return false;
  if (Array.isArray(answer)) return answer.length > 0;
  if (typeof answer === "object" && "start" in answer && "end" in answer) {
    const range = answer as { start?: unknown; end?: unknown };
    return range.start !== undefined && range.end !== undefined;
  }
  return true;
};

/**
 * Warnings that only depend on the question itself, so they can be shown the
 * moment the score or answer changes. Same rule as the backend's solution
 * validation: auto-scorable questions need both a score and an answer key.
 */
export const getLiveSolutionWarnings = (
  question: ContentType,
): QuestionValidationIssue[] => {
  if (!AUTO_SCORABLE_TYPES.has(question.type)) return [];

  const missingScore = !question.score || question.score <= 0;
  const missingAnswer = !hasAnswerKey(question);

  if (missingScore && missingAnswer) {
    return [{ type: "warning", message: "Missing score and answer key" }];
  }
  if (missingScore) return [{ type: "warning", message: "Missing score" }];
  if (missingAnswer) return [{ type: "warning", message: "Missing answer key" }];
  return [];
};

/**
 * Issues to show for a question on the solution tab: the server's errors
 * (answer-format checks) plus warnings worked out from the current state.
 * The server's own warnings are dropped because they go stale after an edit.
 */
export const getSolutionIssues = (question: ContentType): QuestionValidationIssue[] => [
  ...(question.validationIssues ?? []).filter((issue) => issue.type === "error"),
  ...getLiveSolutionWarnings(question),
];

/** True when `child` is a conditional question shown under `parent` */
export const isChildOf = (child: ContentType, parent: ContentType): boolean => {
  const link = child.parentcontent;
  if (!link) return false;
  if (parent._id && link.qId) return link.qId === parent._id;
  return link.qIdx !== undefined && link.qIdx === parent.qIdx;
};

/**
 * Applies an edit to one question of the solution tab.
 * - Changing a parent's score resets its (non-bonus) children's scores, since
 *   they are limited by it. This only happens on a real edit, never when data
 *   is reloaded.
 * - Changing the answer clears the server's errors for that question: they
 *   were about the old answer, and the next validation brings fresh ones.
 */
export const applySolutionEdit = (
  questions: ContentType[],
  qIdx: number,
  changes: Partial<ContentType>,
): ContentType[] => {
  const target = questions[qIdx];
  if (!target) return questions;

  const scoreChanged = "score" in changes && changes.score !== target.score;
  const answerChanged = "answer" in changes;

  return questions.map((question, idx) => {
    if (idx === qIdx) {
      const updated = { ...question, ...changes };
      if (answerChanged && question.validationIssues?.length) {
        updated.validationIssues = question.validationIssues.filter(
          (issue) => issue.type !== "error",
        );
      }
      return updated;
    }

    if (scoreChanged && !question.isBonusScore && question.score && isChildOf(question, target)) {
      return { ...question, score: 0 };
    }
    return question;
  });
};
