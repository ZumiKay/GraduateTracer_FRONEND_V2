import { ContentType, QuestionType } from "../../../types/Form.types";
import { FormResponse } from "../hooks/useFormResponses";

export interface ConditionalTestCase {
  description: string;
  parentResponse:
    | string
    | number
    | boolean
    | string[]
    | number[]
    | Date
    | object;
  expectedVisible: boolean;
  parentQuestionType: QuestionType;
  expectedAnswer: number;
}

export const testConditionalLogic = (
  question: ContentType,
  parentQuestion: ContentType,
  testCases: ConditionalTestCase[],
) => {
  if (import.meta.env.DEV) {
    console.group(`🧪 Testing conditional logic for question: ${question._id}`);

    testCases.forEach((testCase, index) => {
      const mockResponses: FormResponse[] = [
        {
          question: parentQuestion._id || "",
          response: testCase.parentResponse,
        },
      ];

      // Mock the conditional check logic
      const checkResult = (() => {
        if (!question.parentcontent) return true;

        const parentResponse = mockResponses.find(
          (r) => r.question === parentQuestion._id,
        );
        if (!parentResponse || !parentResponse.response) return false;

        const expectedAnswer = question.parentcontent.optIdx;

        if (parentQuestion.type === QuestionType.MultipleChoice) {
          const responseValue = parentResponse.response;
          const selectedOption = parentQuestion.multiple?.find((option) => {
            if (option.content === responseValue) return true;
            if (option.idx === responseValue) return true;
            if (option.idx === Number(responseValue)) return true;
            if (option.idx?.toString() === responseValue) return true;
            return false;
          });
          return selectedOption?.idx === expectedAnswer;
        }

        if (parentQuestion.type === QuestionType.CheckBox) {
          const selectedIndices = Array.isArray(parentResponse.response)
            ? (parentResponse.response as number[])
            : typeof parentResponse.response === "number"
              ? [parentResponse.response as number]
              : [];
          return selectedIndices.includes(expectedAnswer);
        }

        return parentResponse.response === expectedAnswer;
      })();

      const passed = checkResult === testCase.expectedVisible;
      console.log(
        `${passed ? "✅" : "❌"} Test ${index + 1}: ${testCase.description}`,
        {
          parentResponse: testCase.parentResponse,
          expectedVisible: testCase.expectedVisible,
          actualVisible: checkResult,
          passed,
        },
      );
    });

    console.groupEnd();
  }
};

// Helper function to test form submission data
export const validateSubmissionData = (
  visibleQuestions: ContentType[],
  responses: FormResponse[],
) => {
  if (import.meta.env.DEV) {
    console.group("📤 Submission Data Validation");

    const submissionStats = {
      visibleQuestions: visibleQuestions.length,
      requiredQuestions: visibleQuestions.filter((q) => q.require).length,
      responsesWithData: responses.filter(
        (r) =>
          r.response !== "" && r.response !== null && r.response !== undefined,
      ).length,
      conditionalQuestions: visibleQuestions.filter((q) => q.parentcontent)
        .length,
    };

    console.log("📊 Submission Statistics:", submissionStats);

    // Check for potential issues
    const issues = [];

    const requiredQuestions = visibleQuestions.filter((q) => q.require);
    const missingRequired = requiredQuestions.filter((q) => {
      const response = responses.find((r) => r.question === q._id);
      return !response || !response.response;
    });

    if (missingRequired.length > 0) {
      issues.push(`Missing ${missingRequired.length} required responses`);
    }

    const responseCount = responses.filter(
      (r) =>
        visibleQuestions.some((q) => q._id === r.question) &&
        r.response !== "" &&
        r.response !== null &&
        r.response !== undefined,
    ).length;

    if (responseCount === 0 && requiredQuestions.length > 0) {
      issues.push("No responses found for required questions");
    }

    console.log(
      issues.length > 0 ? "⚠️ Issues found:" : "✅ No issues found:",
      issues,
    );

    console.groupEnd();
  }
};
