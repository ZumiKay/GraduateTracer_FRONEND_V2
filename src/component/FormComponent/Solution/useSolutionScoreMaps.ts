import { useMemo } from "react";
import { ContentType } from "../../../types/Form.types";

export interface ScoreMaps {
  /** Own score of each question, keyed by _id */
  parentScoreMap: Map<string, number>;
  /** Whether a parent question has at least one child with a score */
  isChildHasScoreMap: Map<string | number, boolean>;
  /** Sum of other siblings' scores for each child inside a useChildScoreSum parent */
  childSiblingScoreMap: Map<string | number, number>;
  /** Whether a child question lives under a useChildScoreSum parent */
  parentUseChildSumMap: Map<string | number, boolean>;
}

/**
 * Derives all score-related lookup maps from the flat question list.
 * Extracted from Solution_Tab to keep the component lean and to allow
 * independent unit-testing of the mapping logic.
 */
export function useSolutionScoreMaps(allQuestions: ContentType[]): ScoreMaps {
  return useMemo(() => {
    const parentScoreMap = new Map<string, number>();
    const isChildHasScoreMap = new Map<string | number, boolean>();
    const childSiblingScoreMap = new Map<string | number, number>();
    const parentUseChildSumMap = new Map<string | number, boolean>();

    // Build fast look-up indexes
    const contentById = new Map<string, ContentType>();
    const contentByIdx = new Map<number, ContentType>();

    for (const question of allQuestions) {
      if (question._id) {
        if (question.score) parentScoreMap.set(question._id, question.score);
        contentById.set(question._id, question);
      }
      contentByIdx.set(question.qIdx, question);
    }

    const qualifiesForScore = (t?: ContentType): boolean =>
      !!t && !t.isBonusScore && t.score !== undefined && t.score > 0;

    const findQuestion = (
      contentId?: string,
      contentIdx?: number,
    ): ContentType | undefined =>
      (contentId ? contentById.get(contentId) : undefined) ??
      (contentIdx !== undefined ? contentByIdx.get(contentIdx) : undefined);

    for (const question of allQuestions) {
      if (!question.conditional || question.conditional.length === 0) continue;

      const key = question._id ?? question.qIdx;

      // Determine whether any child carries a score
      const hasScore = question.conditional.some((con) =>
        qualifiesForScore(findQuestion(con.contentId, con.contentIdx)),
      );
      isChildHasScoreMap.set(key, hasScore);

      if (!question.useChildScoreSum) continue;

      // Total score distributed across all children
      const totalChildScore = question.conditional.reduce(
        (sum, con) => sum + (findQuestion(con.contentId, con.contentIdx)?.score ?? 0),
        0,
      );
      // (stored on the parent key — kept for potential future use)
      void totalChildScore;

      // For each child: pre-compute the sum of ALL other siblings' scores
      for (const con of question.conditional) {
        const child = findQuestion(con.contentId, con.contentIdx);
        if (!child) continue;

        const childKey = child._id ?? child.qIdx;

        const otherSiblingsScore = question.conditional.reduce((sum, sibling) => {
          const siblingQ = findQuestion(sibling.contentId, sibling.contentIdx);
          if (!siblingQ || (siblingQ._id ?? siblingQ.qIdx) === childKey) return sum;
          return sum + (siblingQ.score ?? 0);
        }, 0);

        childSiblingScoreMap.set(childKey, otherSiblingsScore);
        parentUseChildSumMap.set(childKey, true);
      }
    }

    return { parentScoreMap, isChildHasScoreMap, childSiblingScoreMap, parentUseChildSumMap };
  }, [allQuestions]);
}
