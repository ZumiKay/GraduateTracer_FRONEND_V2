import React from "react";
import { ContentType } from "../../../types/Form.types";
import { FormResponse } from "../hooks/useFormResponses";

type QuestionType = ContentType<unknown>;

interface DebugPanelProps {
  questions: QuestionType[];
  currentPage: number;
  totalPages: number;
  isLoading: boolean;
  responses: FormResponse[];
  checkIfQuestionShouldShow: (
    question: QuestionType,
    responses: FormResponse[]
  ) => boolean;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  questions,
  currentPage,
  totalPages,
  isLoading,
  responses,
  checkIfQuestionShouldShow,
}) => {
  if (!import.meta.env.DEV) return null;

  const getCurrentPageQuestions = () => {
    return questions.filter((question) => {
      if (!question._id) return false;
      try {
        return checkIfQuestionShouldShow(question, responses);
      } catch (error) {
        console.error(error);
        return false;
      }
    });
  };

  const uniqueIds = new Set(questions.map((q) => q._id)).size;
  const hasDuplicates = questions.length !== uniqueIds;

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
      <h3 className="text-sm font-medium text-blue-800 mb-2">
        Debug: Paginated Form Status
      </h3>
      <div className="text-xs text-blue-600 space-y-1">
        <p>
          Total questions: {questions.length} | Current page: {currentPage}/
          {totalPages} | Loading: {isLoading ? "Yes" : "No"} | Current page
          questions: {getCurrentPageQuestions().length} | Unique IDs:{" "}
          {uniqueIds} | Responses with values:{" "}
          {
            responses.filter(
              (r) =>
                r.response !== "" &&
                r.response !== null &&
                r.response !== undefined
            ).length
          }
        </p>

        {hasDuplicates && (
          <p className="text-red-600 font-bold">
            ⚠️ DUPLICATES DETECTED: {questions.length - uniqueIds} duplicate
            question(s) found!
          </p>
        )}

        {questions
          .filter((q) => q.require)
          .map((q) => {
            const isVisible = checkIfQuestionShouldShow(q, responses);
            const response = responses.find((r) => r.question === q._id);
            const hasValidResponse =
              response &&
              response.response !== "" &&
              response.response !== null &&
              response.response !== undefined;
            const title =
              typeof q.title === "string" ? q.title : String(q.title);

            return (
              <div
                key={q._id}
                className={`p-1 rounded ${
                  isVisible && q.require && !hasValidResponse
                    ? "bg-red-100"
                    : "bg-green-100"
                }`}
              >
                <strong>{title.substring(0, 30)}...</strong> | Visible:{" "}
                {isVisible ? "✓" : "✗"} | Required: {q.require ? "✓" : "✗"} |
                Has Response: {hasValidResponse ? "✓" : "✗"} | Value:{" "}
              </div>
            );
          })}
      </div>
    </div>
  );
};
