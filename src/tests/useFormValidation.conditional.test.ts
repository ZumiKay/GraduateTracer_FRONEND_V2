import { renderHook } from "@testing-library/react";
import { useFormValidation } from "../component/Response/hooks/useFormValidation";
import { ContentType, QuestionType } from "../types/Form.types";
import { FormResponse } from "../component/Response/hooks/useFormResponses";

describe("useFormValidation with conditional questions", () => {
  const parentQuestion: ContentType = {
    _id: "parent1",
    formId: "f1",
    qIdx: 1,
    type: QuestionType.MultipleChoice,
    require: true,
    title: "Parent Question",
    multiple: [
      { idx: 0, content: "Yes" },
      { idx: 1, content: "No" },
    ],
  };

  const conditionalQuestion: ContentType = {
    _id: "child1",
    qIdx: 1,
    formId: "f1",
    type: QuestionType.Text,
    require: true,
    title: "Conditional Question",
    parentcontent: { qId: "parent1", optIdx: 0 }, // Only shows when parent = "Yes" (index 0)
  };

  const alwaysVisibleQuestion: ContentType = {
    _id: "always1",
    qIdx: 1,
    formId: "f1",
    type: QuestionType.Text,
    require: true,
    title: "Always Visible Question",
  };

  const questions = [
    parentQuestion,
    conditionalQuestion,
    alwaysVisibleQuestion,
  ];

  // Mock visibility checker: child1 shows only when parent1 = 0
  const mockCheckIfQuestionShouldShow = (
    question: ContentType,
    responses: FormResponse[]
  ): boolean => {
    if (!question.parentcontent) return true;

    const parentResponse = responses.find(
      (r) => r.questionId === question.parentcontent!.qId
    );
    if (!parentResponse) return false;

    return parentResponse.response === question.parentcontent.optIdx;
  };

  test("validates required conditional question when it should be visible", () => {
    const { result } = renderHook(() =>
      useFormValidation(mockCheckIfQuestionShouldShow)
    );

    const responses: FormResponse[] = [
      { questionId: "parent1", response: 0 }, // Makes child1 visible
      { questionId: "always1", response: "filled" },
      // child1 is missing but should be required since it's visible
    ];

    const validationError = result.current.validateForm(questions, responses);
    expect(validationError).toContain("Conditional Question"); // Should complain about missing child1
  });

  test("ignores required conditional question when it should be hidden", () => {
    const { result } = renderHook(() =>
      useFormValidation(mockCheckIfQuestionShouldShow)
    );

    const responses: FormResponse[] = [
      { questionId: "parent1", response: 1 }, // Makes child1 hidden
      { questionId: "always1", response: "filled" },
      // child1 is missing but should be ignored since it's hidden
    ];

    const validationError = result.current.validateForm(questions, responses);
    expect(validationError).toBeNull(); // Should pass validation
  });

  test("isPageComplete ignores hidden conditional questions", () => {
    const { result } = renderHook(() =>
      useFormValidation(mockCheckIfQuestionShouldShow)
    );

    const responses: FormResponse[] = [
      { questionId: "parent1", response: 1 }, // Makes child1 hidden
      { questionId: "always1", response: "filled" },
      // child1 is missing but hidden
    ];

    const isComplete = result.current.isPageComplete(questions, responses);
    expect(isComplete).toBe(true); // Should be complete since hidden questions are ignored
  });

  test("isPageComplete requires visible conditional questions", () => {
    const { result } = renderHook(() =>
      useFormValidation(mockCheckIfQuestionShouldShow)
    );

    const responses: FormResponse[] = [
      { questionId: "parent1", response: 0 }, // Makes child1 visible
      { questionId: "always1", response: "filled" },
      // child1 is missing but visible and required
    ];

    const isComplete = result.current.isPageComplete(questions, responses);
    expect(isComplete).toBe(false); // Should be incomplete since child1 is required and visible
  });
});
