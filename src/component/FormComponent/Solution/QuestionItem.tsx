import { memo, useCallback } from "react";
import Respondant_Question_Card from "../../Card/Respondant.card";
import SolutionInput from "./SolutionInput";
import { ContentType } from "../../../types/Form.types";
import ValidationIssueDisplay from "../ValidationIssueDisplay";

interface QuestionItemProps {
  question: ContentType;
  idx: number;
  formColor?: string;
  onUpdateContent: (updates: Partial<ContentType>, qIdx: number) => void;
  parentScore?: number;
  isBonusScore?: boolean;
  isChildHasScore?: boolean;
  siblingScore?: number;
  childSiblingScore?: number;
  parentUseChildSum?: boolean;
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
    childSiblingScore,
    parentUseChildSum,
  }: QuestionItemProps) => {
    const isConditional = !!question.parentcontent;

    const handleUpdateContent = useCallback(
      (updates: Partial<ContentType>) => onUpdateContent(updates, idx),
      [onUpdateContent, idx],
    );

    return (
      <div
        id={`${question.page}-${question._id ?? question.qIdx}`}
        className={`space-y-3 sm:space-y-4 ${
          isConditional
            ? "bg-blue-50 p-3 sm:p-4 rounded-lg border-l-4 border-blue-400"
            : ""
        }`}
      >
        {isConditional && (
          <div className="text-xs text-blue-600 mb-2">
            Conditional Question - Shows when parent condition is met
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
          childSiblingScore={childSiblingScore}
          parentUseChildSum={parentUseChildSum}
          isChildHasScore={isChildHasScore}
        />

        {/* Question validation issues */}
        {question.validationIssues && question.validationIssues.length > 0 && (
          <ValidationIssueDisplay
            issues={question.validationIssues}
            warnings={question.validationWarning}
          />
        )}
      </div>
    );
  },
);

QuestionItem.displayName = "QuestionItem";

export default QuestionItem;
