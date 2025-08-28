import { memo } from "react";
import Respondant_Question_Card from "../../Card/Respondant.card";
import SolutionInput from "./SolutionInput";
import { ContentType } from "../../../types/Form.types";

interface QuestionItemProps {
  question: ContentType;
  idx: number;
  formColor?: string;
  onUpdateContent: (updates: Partial<ContentType>, qIdx: number) => void;
  onSelectAnswer: (answer: { answer: unknown }) => void;
  parentScore?: number;
}

const QuestionItem = memo(
  ({
    question,
    idx,
    formColor,
    onUpdateContent,
    onSelectAnswer,
    parentScore,
  }: QuestionItemProps) => {
    const isConditional = !!question.parentcontent;

    return (
      <div
        className={`space-y-4 ${
          isConditional
            ? "bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400"
            : ""
        }`}
      >
        {isConditional && (
          <div className="text-xs text-blue-600 mb-2">
            🔗 Conditional Question - Shows when parent condition is met
          </div>
        )}
        <Respondant_Question_Card
          idx={question.qIdx ?? idx}
          content={question}
          onSelectAnswer={onSelectAnswer}
          color={formColor}
          isDisable={true}
        />
        <SolutionInput
          key={`solution-${question._id || idx}-${idx}`}
          content={question}
          onUpdateContent={(updates) => onUpdateContent(updates, idx)}
          isValidated={question.isValidated}
          parentScore={parentScore}
        />
      </div>
    );
  }
);

QuestionItem.displayName = "QuestionItem";

export default QuestionItem;
