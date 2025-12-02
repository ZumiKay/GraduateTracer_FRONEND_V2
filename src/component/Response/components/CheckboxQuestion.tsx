import React, { useMemo } from "react";
import { ContentType } from "../../../types/Form.types";
import { ResponseValue } from "../hooks/useFormResponses";
import StyledTiptap from "./StyledTiptap";

interface CheckboxQuestionProps {
  question: ContentType;
  currentResponse?: ResponseValue;
  updateResponse: (questionId: string, value: ResponseValue) => void;
}

export const CheckboxQuestion: React.FC<CheckboxQuestionProps> = ({
  question,
  currentResponse,
  updateResponse,
}) => {
  const contentTitle = useMemo(() => {
    if (question.parentcontent) {
      return `Q${question.questionId} (Sub-Q of Q${
        question.parentcontent.questionId
      } Option ${question.parentcontent.optIdx + 1} )`;
    }
    return `Question ${question.questionId}}`;
  }, [question.parentcontent, question.questionId]);
  return (
    <div className="space-y-4 p-6 bg-white rounded-lg border shadow-sm">
      <div className="bg-black p-2 w-full rounded-lg text-white">
        <p className="font-bold break-words">{contentTitle}</p>
      </div>
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <StyledTiptap
            value={question.title as never}
            readonly
            variant="question"
          />
          {question.require && (
            <span className="text-red-500 text-sm ml-2">*Required</span>
          )}
        </div>
      </div>
      <div className="flex justify-between items-center">
        <p className="text-sm font-medium text-gray-600">
          Select multiple options:
        </p>
        {currentResponse &&
          Array.isArray(currentResponse) &&
          currentResponse.length > 0 && (
            <button
              type="button"
              onClick={() => updateResponse(question._id || "", [])}
              className="clear-button"
            >
              Clear All
            </button>
          )}
      </div>
      <div className="grid grid-cols-1 gap-3">
        {question.checkbox?.map((choice, choiceIdx) => {
          const value = choice.idx ?? choiceIdx;
          const isChecked = Array.isArray(currentResponse)
            ? (currentResponse as (number | string)[]).some((v) =>
                typeof v === "number"
                  ? v === value
                  : !isNaN(Number(v))
                  ? Number(v) === value
                  : false
              )
            : false;

          return (
            <label
              key={`checkbox-${question._id}-${choiceIdx}`}
              className={`choice-option ${isChecked ? "selected" : ""}`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => {
                  const currentSelections = Array.isArray(currentResponse)
                    ? (currentResponse as (number | string)[])
                        .map((v) =>
                          typeof v === "number"
                            ? v
                            : !isNaN(Number(v))
                            ? Number(v)
                            : NaN
                        )
                        .filter((v) => !isNaN(v))
                    : [];

                  const next = new Set<number>(currentSelections);

                  if (e.target.checked) {
                    next.add(value as number);
                  } else {
                    next.delete(value as number);
                  }

                  const newSelections = Array.from(next).sort((a, b) => a - b);

                  updateResponse(question._id ?? "", newSelections);
                }}
                className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                disabled={false}
              />
              <span className="choice-option-text">{choice.content}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
};
