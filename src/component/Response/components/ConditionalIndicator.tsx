import React, { memo } from "react";
import { ContentType, QuestionType } from "../../../types/Form.types";

interface ConditionalIndicatorProps {
  question: ContentType;
  questions: ContentType[];
}

export const ConditionalIndicator: React.FC<ConditionalIndicatorProps> = memo(
  ({ question, questions }) => {
    if (!question.parentcontent) return null;

    const getConditionText = () => {
      const parentIdx = questions.findIndex(
        (q) => q._id === question.parentcontent?.qId
      );
      const parentQuestion = questions.find(
        (q) => q._id === question.parentcontent?.qId
      );
      const optionLabel =
        parentQuestion?.type === QuestionType.MultipleChoice
          ? parentQuestion.multiple?.find(
              (opt) => opt.idx === question.parentcontent?.optIdx
            )?.content
          : parentQuestion?.type === QuestionType.CheckBox
          ? parentQuestion.checkbox?.find(
              (opt) => opt.idx === question.parentcontent?.optIdx
            )?.content
          : `option ${(question.parentcontent?.optIdx ?? 0) + 1}`;

      return `${parentIdx + 1 || "unknown"} selects "${
        optionLabel || "unknown option"
      }"`;
    };

    return (
      <div className="conditional-indicator">
        <div className="conditional-indicator-header">
          <span className="conditional-indicator-icon">🔗</span>
          <span className="conditional-indicator-title">
            Conditional Question
          </span>
        </div>
        <div className="conditional-indicator-description">
          <span className="conditional-indicator-condition">Condition:</span>
          <span className="conditional-indicator-value">
            Shows when Question {getConditionText()}
          </span>
        </div>
      </div>
    );
  }
);

ConditionalIndicator.displayName = "ConditionalIndicator";
