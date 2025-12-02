import { memo, useCallback } from "react";
import Respondant_Question_Card from "../../Card/Respondant.card";
import SolutionInput from "./SolutionInput";
import { ContentType } from "../../../types/Form.types";
import { ContentAnswerType } from "../../Response/Response.type";

interface QuestionItemProps {
  question: ContentType;
  idx: number;
  formColor?: string;
  onUpdateContent: (updates: Partial<ContentType>, qIdx: number) => void;
  onSelectAnswer: (
    answerData: { answer: ContentAnswerType },
    idx: number
  ) => void;
  parentScore?: number;
  parentQIdx?: number;
  scoreMode?: boolean;
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

    const handleSelectAnswer = useCallback(
      (answer: { answer: ContentAnswerType }) => {
        onSelectAnswer(answer, idx);
      },
      [onSelectAnswer, idx]
    );

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
          idx={idx}
          content={question}
          onSelectAnswer={handleSelectAnswer}
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
