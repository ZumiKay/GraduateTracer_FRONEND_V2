import React from "react";
import { ContentType } from "../../../types/Form.types";
import { ResponseValue } from "../hooks/useFormResponses";
import Tiptap from "../../FormComponent/TipTabEditor";

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
  return (
    <div className="space-y-4 p-6 bg-white rounded-lg border shadow-sm">
      <div className="flex items-start gap-3">
        <div className="question-type-icon">☑️</div>
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
          const isChecked = Array.isArray(currentResponse)
            ? (currentResponse as number[]).includes(choice.idx || choiceIdx)
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
                    ? (currentResponse as number[])
                    : [];

                  const value = choice.idx ?? choiceIdx;
                  let newSelections: number[];

                  if (e.target.checked) {
                    newSelections = [...currentSelections, value];
                  } else {
                    newSelections = currentSelections.filter(
                      (val) => val !== value
                    );
                  }

                  updateResponse(question._id || "", newSelections);
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
