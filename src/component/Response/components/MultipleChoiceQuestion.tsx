import React, { useMemo } from "react";
import { ContentType } from "../../../types/Form.types";
import { ResponseValue } from "../hooks/useFormResponses";
import StyledTiptap from "./StyledTiptap";

interface MultipleChoiceQuestionProps {
  question: ContentType;
  currentResponse?: ResponseValue;
  updateResponse: (questionId: string, value?: ResponseValue) => void;
}

export const MultipleChoiceQuestion: React.FC<MultipleChoiceQuestionProps> = ({
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
      <div className="question_label bg-black rounded-lg text-white p-2">
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
          {question.score !== undefined && question.score > 0 && (
            <span
              className="ml-2 inline-flex items-center rounded-full bg-green-100 text-green-800 text-xs font-bold px-2 py-0.5"
              aria-label={`This question is worth ${question.score} points`}
            >
              {question.score} pts
            </span>
          )}
        </div>
      </div>
      <div className="flex justify-between items-center">
        <p className="text-sm font-medium text-gray-600">Select one option:</p>

        {Array.isArray(currentResponse) &&
        (currentResponse as number[]).length > 0 ? (
          <button
            type="button"
            onClick={() => question._id && updateResponse(question._id, [])}
            className="clear-button"
          >
            Clear Selection
          </button>
        ) : (
          <></>
        )}
      </div>
      <div className="space-y-3">
        {question.multiple?.map((choice, choiceIdx) => {
          const choiceValue = choice.idx ?? choiceIdx;
          const isSelected =
            Array.isArray(currentResponse) &&
            (currentResponse as number[]).includes(choiceValue);

          return (
            <label
              key={`radio-${question._id}-${choiceIdx}`}
              className={`choice-option ${isSelected ? "selected" : ""}`}
            >
              <input
                type="radio"
                name={`radio-${question._id}`}
                checked={isSelected}
                onChange={() => {
                  //?Checkbox answer in Array of number
                  updateResponse(question._id ?? "", [choiceValue]);
                }}
                className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
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
