/**
 * Integration test for condition question functionality
 * Tests both frontend and backend validation of condition questions
 */

import { ContentType, QuestionType } from "../types/Form.types";
import ConditionQuestionVerification from "../utils/ConditionQuestionVerification";

describe("Condition Question Functionality", () => {
  describe("Frontend Validation", () => {
    test("should allow conditions for checkbox questions", () => {
      const checkboxQuestion: ContentType = {
        _id: "checkbox-question-1",
        type: QuestionType.CheckBox,
        formId: "form-1",
        title: "Select your preferences",
        checkbox: [
          { idx: 0, content: "Option A" },
          { idx: 1, content: "Option B" },
          { idx: 2, content: "Option C" },
        ],
        conditional: [
          { key: 0, contentId: "follow-up-1" },
          { key: 1, contentId: "follow-up-2" },
        ],
        page: 1,
      };

      const result =
        ConditionQuestionVerification.validateConditionQuestionTypes(
          checkboxQuestion
        );
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test("should allow conditions for multiple choice questions", () => {
      const multipleChoiceQuestion: ContentType = {
        _id: "multiple-choice-1",
        type: QuestionType.MultipleChoice,
        formId: "form-1",
        title: "What is your favorite color?",
        multiple: [
          { idx: 0, content: "Red" },
          { idx: 1, content: "Blue" },
          { idx: 2, content: "Green" },
        ],
        conditional: [
          { key: 0, contentId: "red-follow-up" },
          { key: 2, contentId: "green-follow-up" },
        ],
        page: 1,
      };

      const result =
        ConditionQuestionVerification.validateConditionQuestionTypes(
          multipleChoiceQuestion
        );
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test("should reject conditions for text questions", () => {
      const textQuestion: ContentType = {
        _id: "text-question-1",
        type: QuestionType.Text,
        formId: "form-1",
        title: "This is just informational text",
        conditional: [{ key: 0, contentId: "invalid-follow-up" }],
        page: 1,
      };

      const result =
        ConditionQuestionVerification.validateConditionQuestionTypes(
          textQuestion
        );
      expect(result.isValid).toBe(false);
      expect(result.error).toContain(
        "Condition questions are only allowed for checkbox and multiple choice questions"
      );
    });

    test("should reject conditions for short answer questions", () => {
      const shortAnswerQuestion: ContentType = {
        _id: "short-answer-1",
        type: QuestionType.ShortAnswer,
        formId: "form-1",
        title: "What is your name?",
        conditional: [{ key: 0, contentId: "invalid-follow-up" }],
        page: 1,
      };

      const result =
        ConditionQuestionVerification.validateConditionQuestionTypes(
          shortAnswerQuestion
        );
      expect(result.isValid).toBe(false);
      expect(result.error).toContain(
        "Condition questions are only allowed for checkbox and multiple choice questions"
      );
    });

    test("should reject conditions for paragraph questions", () => {
      const paragraphQuestion: ContentType = {
        _id: "paragraph-1",
        type: QuestionType.Paragraph,
        formId: "form-1",
        title: "Tell us about yourself",
        conditional: [{ key: 0, contentId: "invalid-follow-up" }],
        page: 1,
      };

      const result =
        ConditionQuestionVerification.validateConditionQuestionTypes(
          paragraphQuestion
        );
      expect(result.isValid).toBe(false);
      expect(result.error).toContain(
        "Condition questions are only allowed for checkbox and multiple choice questions"
      );
    });

    test("should reject conditions for number questions", () => {
      const numberQuestion: ContentType = {
        _id: "number-1",
        type: QuestionType.Number,
        formId: "form-1",
        title: "Enter your age",
        conditional: [{ key: 0, contentId: "invalid-follow-up" }],
        page: 1,
      };

      const result =
        ConditionQuestionVerification.validateConditionQuestionTypes(
          numberQuestion
        );
      expect(result.isValid).toBe(false);
      expect(result.error).toContain(
        "Condition questions are only allowed for checkbox and multiple choice questions"
      );
    });

    test("should reject conditions for date questions", () => {
      const dateQuestion: ContentType = {
        _id: "date-1",
        type: QuestionType.Date,
        formId: "form-1",
        title: "Select your birth date",
        conditional: [{ key: 0, contentId: "invalid-follow-up" }],
        page: 1,
      };

      const result =
        ConditionQuestionVerification.validateConditionQuestionTypes(
          dateQuestion
        );
      expect(result.isValid).toBe(false);
      expect(result.error).toContain(
        "Condition questions are only allowed for checkbox and multiple choice questions"
      );
    });

    test("should validate condition keys match existing options", () => {
      const invalidKeyQuestion: ContentType = {
        _id: "invalid-key-1",
        type: QuestionType.MultipleChoice,
        formId: "form-1",
        title: "Test question",
        multiple: [
          { idx: 0, content: "Option A" },
          { idx: 1, content: "Option B" },
        ],
        conditional: [
          { key: 0, contentId: "valid-follow-up" },
          { key: 5, contentId: "invalid-follow-up" }, // Key 5 doesn't exist
        ],
        page: 1,
      };

      const result =
        ConditionQuestionVerification.validateConditionKeys(invalidKeyQuestion);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Condition 1 references non-existent option key: 5"
      );
    });

    test("should validate complete form structure", () => {
      const { validScenario, invalidScenario } =
        ConditionQuestionVerification.createTestScenario();

      const validResult =
        ConditionQuestionVerification.validateFormConditions(validScenario);
      expect(validResult.isValid).toBe(true);
      expect(validResult.errors).toHaveLength(0);

      const invalidResult =
        ConditionQuestionVerification.validateFormConditions(invalidScenario);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    });
  });

  describe("Autosave Functionality", () => {
    test("should maintain condition relationships during autosave", () => {
      const originalQuestions: ContentType[] = [
        {
          _id: "q1",
          type: QuestionType.MultipleChoice,
          formId: "form-1",
          title: "Original question",
          multiple: [
            { idx: 0, content: "Option A" },
            { idx: 1, content: "Option B" },
          ],
          conditional: [{ key: 0, contentId: "q2" }],
          page: 1,
        },
        {
          _id: "q2",
          type: QuestionType.Text,
          formId: "form-1",
          title: "Follow-up question",
          parentcontent: { qId: "q1", optIdx: 0 },
          page: 1,
        },
      ];

      const updatedQuestions: ContentType[] = [
        {
          _id: "q1",
          type: QuestionType.MultipleChoice,
          formId: "form-1",
          title: "Updated question",
          multiple: [
            { idx: 0, content: "Option A" },
            { idx: 1, content: "Option B" },
          ],
          conditional: [{ key: 0, contentId: "q2" }],
          page: 1,
        },
        {
          _id: "q2",
          type: QuestionType.Text,
          formId: "form-1",
          title: "Follow-up question",
          parentcontent: { qId: "q1", optIdx: 0 },
          page: 1,
        },
      ];

      const result =
        ConditionQuestionVerification.validateAutosaveCompatibility(
          originalQuestions,
          updatedQuestions
        );
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test("should detect broken condition relationships during autosave", () => {
      const originalQuestions: ContentType[] = [
        {
          _id: "q1",
          type: QuestionType.MultipleChoice,
          formId: "form-1",
          title: "Original question",
          multiple: [
            { idx: 0, content: "Option A" },
            { idx: 1, content: "Option B" },
          ],
          conditional: [{ key: 0, contentId: "q2" }],
          page: 1,
        },
      ];

      const updatedQuestions: ContentType[] = [
        {
          _id: "q1",
          type: QuestionType.MultipleChoice,
          formId: "form-1",
          title: "Updated question",
          multiple: [
            { idx: 0, content: "Option A" },
            { idx: 1, content: "Option B" },
          ],
          conditional: [], // Condition removed
          page: 1,
        },
      ];

      const result =
        ConditionQuestionVerification.validateAutosaveCompatibility(
          originalQuestions,
          updatedQuestions
        );
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Question 0: Conditional count mismatch (1 vs 0)"
      );
    });
  });

  describe("Manual Save Functionality", () => {
    test("should validate conditions before manual save", () => {
      const questionsToSave: ContentType[] = [
        {
          _id: "manual-save-1",
          type: QuestionType.CheckBox,
          formId: "form-1",
          title: "Manual save test",
          checkbox: [
            { idx: 0, content: "Option A" },
            { idx: 1, content: "Option B" },
          ],
          conditional: [{ key: 0, contentId: "manual-follow-up-1" }],
          page: 1,
        },
        {
          _id: "manual-follow-up-1",
          type: QuestionType.ShortAnswer,
          formId: "form-1",
          title: "Follow-up for manual save",
          parentcontent: { qId: "manual-save-1", optIdx: 0 },
          page: 1,
        },
      ];

      const result =
        ConditionQuestionVerification.validateFormConditions(questionsToSave);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test("should reject invalid conditions during manual save", () => {
      const invalidQuestionsToSave: ContentType[] = [
        {
          _id: "manual-save-invalid",
          type: QuestionType.ShortAnswer, // Invalid type for conditions
          formId: "form-1",
          title: "Invalid manual save test",
          conditional: [{ key: 0, contentId: "manual-follow-up-invalid" }],
          page: 1,
        },
      ];

      const result = ConditionQuestionVerification.validateFormConditions(
        invalidQuestionsToSave
      );
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("Comprehensive Integration Test", () => {
    test("should run all verification tests", () => {
      const testResults = ConditionQuestionVerification.runVerificationTests();
      expect(testResults.allTestsPassed).toBe(true);

      testResults.results.forEach((result) => {
        expect(result.passed).toBe(true);
        if (result.details) {
          console.log(`Test "${result.testName}" details:`, result.details);
        }
      });
    });
  });
});

// Mock API request for testing
export const mockApiRequest = async (endpoint: string, data: any) => {
  // Simulate API validation
  if (endpoint === "/handlecondition") {
    const { content, key, newContent } = data;

    // Simulate backend validation
    if (
      content.type !== QuestionType.CheckBox &&
      content.type !== QuestionType.MultipleChoice
    ) {
      return {
        success: false,
        error:
          "Condition questions are only allowed for checkbox and multiple choice questions",
      };
    }

    return { success: true, data: { id: "new-content-id" } };
  }

  if (endpoint === "/savequestion") {
    const { data: questions } = data;

    // Validate all questions
    const validation =
      ConditionQuestionVerification.validateFormConditions(questions);
    if (!validation.isValid) {
      return {
        success: false,
        errors: validation.errors,
      };
    }

    return { success: true, data: questions };
  }

  return { success: true };
};

export default ConditionQuestionVerification;
