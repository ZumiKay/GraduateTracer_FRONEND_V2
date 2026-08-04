import {
  AUTO_SCORABLE_TYPES,
  MAYBE_AUTO_SCORABLE_TYPES,
  DISPLAY_ONLY_TYPES,
  ContentType,
  ScoringAnalysis,
} from "../types/Form.types";

/**
 * Optimized check for unsaved questions using O(1) lookups and early exits.
 * Detects changes in question title, type, options, ranges, answers, and conditionals.
 */
export const checkUnsavedQuestions = (
  currentQuestion: ContentType[],
  prevQuestion: ContentType[],
  page?: number,
): boolean => {
  void page;
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

    // Fast path: check primitives first
    if (currQ.type !== isQuestion.type) return true;
    if (currQ.score !== isQuestion.score) return true;

    // Deep comparison for complex objects
    const jsonCheck = <T = unknown>(val1?: T, val2?: T): boolean => {
      return JSON.stringify(val1) !== JSON.stringify(val2);
    };

    if (jsonCheck(currQ.title, isQuestion.title)) return true;
    if (jsonCheck(currQ.conditional, isQuestion.conditional)) return true;
    if (jsonCheck(currQ.parentcontent, isQuestion.parentcontent)) return true;

    // Check question-specific fields
    const hasCheckbox = currQ.checkbox || isQuestion.checkbox;
    if (hasCheckbox && jsonCheck(currQ.checkbox, isQuestion.checkbox))
      return true;

    const hasMultiple = currQ.multiple || isQuestion.multiple;
    if (hasMultiple && jsonCheck(currQ.multiple, isQuestion.multiple))
      return true;

    const hasRangeDate = currQ.rangedate || isQuestion.rangedate;
    if (hasRangeDate && jsonCheck(currQ.rangedate, isQuestion.rangedate))
      return true;

    const hasRangeNumber = currQ.rangenumber || isQuestion.rangenumber;
    if (hasRangeNumber && jsonCheck(currQ.rangenumber, isQuestion.rangenumber))
      return true;

    // Check answer key
    if (jsonCheck(currQ.answer, isQuestion.answer)) return true;

    // All checks passed
    return false;
  });

  return deepCheck;
};

/**
 * Computes scoring breakdown stats for a list of questions.
 */
export const calcContentScoringStats = (questions: Array<ContentType>) => {
  if (!questions || !Array.isArray(questions)) {
    return {
      total: 0,
      scored: 0,
      autoScorable: 0,
      manualGrading: 0,
    };
  }

  const scoredList = questions.filter(
    (q) => typeof q.score === "number" && q.score > 0,
  );

  const autoScorableList = scoredList.filter((q) => {
    const isAutoType =
      AUTO_SCORABLE_TYPES.has(q.type) || MAYBE_AUTO_SCORABLE_TYPES.has(q.type);
    const hasAnswer = !!q.answer;
    const hasScore = q.score !== undefined && q.score > 0;

    return isAutoType && hasAnswer && hasScore;
  });

  const manualGradingList = questions.filter((q) => {
    if (DISPLAY_ONLY_TYPES.has(q.type)) return false;
    const isMaybeAutoType = MAYBE_AUTO_SCORABLE_TYPES.has(q.type);
    const hasScore = typeof q.score === "number" && q.score > 0;
    const hasNoAnswer = !q.answer;
    return isMaybeAutoType && hasScore && hasNoAnswer;
  });

  return {
    total: questions.length,
    scored: scoredList.length,
    autoScorable: autoScorableList.length,
    manualGrading: manualGradingList.length,
  };
};

export const calculateCurrentVal = (
  prev: number,
  current: number,
  total: number,
) => Math.abs(total - prev) + current;

/**
 * Recalculates and updates the ScoringAnalysis dynamically when the user edits
 * questions on a form page.
 *
 * - **CurrentPage Count** : stats derived from `currentContent` alone.
 * - **Total Count**       : form-wide stats including the current page.
 * - **Final Count**       : `(Total − OldPage) + NewPage` for each counter,
 *                           applied when `prevContent` (the old page snapshot) is supplied.
 *
 * @param prevRes        Form-wide ScoringAnalysis before this edit (covering all pages).
 * @param currentContent New (edited) questions for the current page.
 * @param prevContent    Optional snapshot of the same page *before* the edit.
 *                       Required to enable the delta formula; without it the
 *                       current-page counts replace the form total directly.
 */
export const validateScoreTemp = (
  initialCurrentPageScoreAnalysis: ScoringAnalysis,
  prevRes: ScoringAnalysis,
  currentContent: Array<ContentType>,
): ScoringAnalysis => {
  if (!prevRes) {
    const stats = calcContentScoringStats(currentContent ?? []);
    return {
      isAutoScoreable:
        stats.scored > 0 &&
        stats.manualGrading === 0 &&
        stats.scored === stats.autoScorable,
      totalQuestions: stats.total,
      scoredQuestions: stats.scored,
      autoScorableQuestions: stats.autoScorable,
      manualGradingQuestions: stats.manualGrading,
      missingAnswerKeys: {},
      unsupportedTypes: {},
    };
  }

  if (!currentContent || !Array.isArray(currentContent)) {
    return prevRes;
  }

  // Compute stats for the incoming (new) page.
  const newPageStats = calcContentScoringStats(currentContent);

  const initialPage = initialCurrentPageScoreAnalysis || {
    totalQuestions: 0,
    scoredQuestions: 0,
    autoScorableQuestions: 0,
    manualGradingQuestions: 0,
  };

  // Delta formula: Final = prevRes - initialCurrentPage + newPageStats
  const finalTotal =
    prevRes.totalQuestions - initialPage.totalQuestions + newPageStats.total;

  const finalScored =
    prevRes.scoredQuestions - initialPage.scoredQuestions + newPageStats.scored;

  const finalAutoScorable =
    prevRes.autoScorableQuestions -
    initialPage.autoScorableQuestions +
    newPageStats.autoScorable;

  const finalManual =
    prevRes.manualGradingQuestions -
    initialPage.manualGradingQuestions +
    newPageStats.manualGrading;

  const absTotal = Math.abs(finalTotal);
  const absScored = Math.abs(finalScored);
  const absAutoScorable = Math.abs(finalAutoScorable);
  const absManual = Math.abs(finalManual);

  return {
    ...prevRes,
    totalQuestions: absTotal,
    scoredQuestions: absScored,
    autoScorableQuestions: absAutoScorable,
    manualGradingQuestions: absManual,
    isAutoScoreable:
      absScored > 0 && absManual === 0 && absScored === absAutoScorable,
  };
};
