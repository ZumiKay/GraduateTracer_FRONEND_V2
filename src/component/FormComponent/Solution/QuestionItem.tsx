import { memo, useCallback } from "react";
import Respondant_Question_Card from "../../Card/Respondant.card";
import SolutionInput from "./SolutionInput";
import { ContentType } from "../../../types/Form.types";

interface SiblingScore {
  id: string | number;
  score?: number;
  isBonusScore?: boolean;
}

interface QuestionItemProps {
  question: ContentType;
  idx: number;
  formColor?: string;
  onUpdateContent: (updates: Partial<ContentType>, qIdx: number) => void;
  parentScore?: number;
  parentQIdx?: number;
  currentMaxParentScore?: number;
  siblingScores?: Array<SiblingScore>;
  isBonusScore?: boolean;
  isChildHasScore?: boolean;
  onUpdateMaxParentScore: (
    parentId: string | number,
    newBudget: number,
  ) => void;
}

const QuestionItem = memo(
  ({
    question,
    idx,
    formColor,
    onUpdateContent,
    parentScore,
    isBonusScore,
    isChildHasScore,
    currentMaxParentScore,
    siblingScores,
    onUpdateMaxParentScore,
  }: QuestionItemProps) => {
    const isConditional = !!question.parentcontent;

    const handleUpdateContent = useCallback(
      (updates: Partial<ContentType>) => onUpdateContent(updates, idx),
      [onUpdateContent, idx],
    );

    const handleUpdateMaxParentScore = useCallback(
      (p: string | number, editscore: number) => {
        if (currentMaxParentScore === undefined || parentScore === undefined)
          return;

        const editedQuestionId = question._id ?? question.qIdx;

        const siblingScoreTotal = (siblingScores ?? []).reduce((sum, sib) => {
          const isEditedQuestion = sib.id === editedQuestionId;
          return sum + (isEditedQuestion ? editscore : (sib.score ?? 0));
        }, 0);

        onUpdateMaxParentScore(p, parentScore - siblingScoreTotal);
      },
      [
        currentMaxParentScore,
        parentScore,
        siblingScores,
        question,
        onUpdateMaxParentScore,
      ],
    );

    return (
      <div
        className={`space-y-3 sm:space-y-4 ${
          isConditional
            ? "bg-blue-50 p-3 sm:p-4 rounded-lg border-l-4 border-blue-400"
            : ""
        }`}
      >
        {isConditional && (
          <div className="text-xs text-blue-600 mb-2">
            🔗 Conditional Question - Shows when parent condition is met
          </div>
        )}
        <Respondant_Question_Card
          idx={idx}
          content={question}
          color={formColor}
          isDisable={true}
        />
        <SolutionInput
          key={`solution-${question._id || idx}-${idx}`}
          content={question}
          onUpdateContent={handleUpdateContent}
          isValidated={question.isValidated}
          parentScore={parentScore}
          isBonusScore={isBonusScore}
          maxParentScore={currentMaxParentScore}
          isChildHasScore={isChildHasScore}
          onUpdateMaxParentScore={handleUpdateMaxParentScore}
        />
      </div>
    );
  },
);

QuestionItem.displayName = "QuestionItem";

export default QuestionItem;
