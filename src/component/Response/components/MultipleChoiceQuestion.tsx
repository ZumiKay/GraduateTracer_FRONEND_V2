import React from "react";
import { ContentType } from "../../../types/Form.types";
import { ResponseValue } from "../hooks/useFormResponses";
import Tiptap from "../../FormComponent/TipTabEditor";

interface MultipleChoiceQuestionProps {
  question: ContentType;
  currentResponse?: ResponseValue;
  updateResponse: (questionId: string, value: ResponseValue) => void;
}

export const MultipleChoiceQuestion: React.FC<MultipleChoiceQuestionProps> = ({
  question,
  currentResponse,
  updateResponse,
}) => {
  return (
    <div className="space-y-4 p-6 bg-white rounded-lg border shadow-sm">
      <div className="flex items-start gap-3">
        <div className="question-type-icon">🔘</div>
        <div className="flex-1">
          <div className="prose prose-sm max-w-none">
            <Tiptap value={question.title as never} readonly />
          </div>
          {question.require && (
            <span className="text-red-500 text-sm ml-2">*Required</span>
          )}
        </div>
      </div>
      <div className="flex justify-between items-center">
        <p className="text-sm font-medium text-gray-600">Select one option:</p>
        {currentResponse && (
          <button
            type="button"
            onClick={() => updateResponse(question._id || "", "")}
            className="clear-button"
          >
            Clear Selection
          </button>
        )}
      </div>
      <div className="space-y-3">
        {question.multiple?.map((choice, choiceIdx) => {
          const isSelected =
            currentResponse === choice.content ||
            currentResponse === choice.idx ||
            currentResponse === choice.idx?.toString();

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
                  updateResponse(
                    question._id || "",
                    choice.content || choice.idx?.toString() || ""
                  );
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
