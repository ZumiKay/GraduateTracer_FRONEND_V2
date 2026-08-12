import {
  AUTO_SCORABLE_TYPES,
  MAYBE_AUTO_SCORABLE_TYPES,
  DISPLAY_ONLY_TYPES,
  ContentType,
  ScoringAnalysis,
  QuestionType,
} from "../types/Form.types";

/* -------------------------------- Constant -------------------------------- */
const jsonChanged = <T = unknown>(val1?: T, val2?: T): boolean =>
  JSON.stringify(val1) !== JSON.stringify(val2);

const TYPE_KEY_OVERRIDES: Partial<Record<QuestionType, string>> = {
  [QuestionType.MultipleSelection]: "selection",
};

const SCALAR_CONTENT_TYPES = new Set<QuestionType>([
  QuestionType.ShortAnswer,
  QuestionType.Paragraph,
  QuestionType.Text,
  QuestionType.Number,
  QuestionType.Date,
]);

/* --------------------------------- Helper --------------------------------- */
export const checkUnsavedQuestions = (
  currentQuestion: ContentType[],
  prevQuestion: ContentType[],
): boolean => {
  const allHaveId = currentQuestion.every((q) => q._id);
  if (!allHaveId) return true;

  const prevMap = new Map<string, ContentType>();
  for (const q of prevQuestion) {
    const key = q._id || q.questionId;
    if (key) prevMap.set(key, q);
  }

  return currentQuestion.some((curr) => {
    const key = curr._id || curr.questionId;
    const prev = key ? prevMap.get(key) : undefined;

    if (!prev) return true;

    // Quick comparisons
    if (
      curr.type !== prev.type ||
      curr.require !== prev.require ||
      curr.score !== prev.score ||
      curr.isBonusScore !== prev.isBonusScore ||
      curr.useChildScoreSum !== prev.useChildScoreSum
    ) {
      return true;
    }

    // Deep comparisons for structured fields
    if (
      jsonChanged(curr.title, prev.title) ||
      jsonChanged(curr.conditional, prev.conditional) ||
      jsonChanged(curr.parentcontent, prev.parentcontent) ||
      jsonChanged(curr.answer, prev.answer)
    ) {
      return true;
    }

    // Deep comparison for array and object
    if (!SCALAR_CONTENT_TYPES.has(curr.type)) {
      const contentKey = TYPE_KEY_OVERRIDES[curr.type] ?? curr.type;
      if (jsonChanged(curr[contentKey], prev[contentKey])) return true;
    }

    return false;
  });
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
    total: questions.length, // total for current page
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
 * @param prevRes        Form ScoringAnalysis (covering all pages).
 * @param currentContent New (edited) questions for the current page.
 * @param prevContent    Optional snapshot of the same page *before* the edit.
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

  const absScored = Math.abs(finalScored);
  const absAutoScorable = Math.abs(finalAutoScorable);
  const absManual = Math.abs(finalManual);

  return {
    ...prevRes,
    scoredQuestions: absScored,
    autoScorableQuestions: absAutoScorable,
    manualGradingQuestions: absManual,
    isAutoScoreable:
      absScored > 0 && absManual === 0 && absScored === absAutoScorable,
  };
};
