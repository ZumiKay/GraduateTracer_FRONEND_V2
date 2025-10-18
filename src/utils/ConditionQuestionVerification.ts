/**
 * Verification utility for condition questions in Graduate Tracer
 * Ensures that condition questions work properly with checkbox and multiple choice questions
 * and validates both manual save and autosave functionality
 */

import { ContentType, QuestionType } from "../types/Form.types";

export class ConditionQuestionVerification {
  /**
   * Validates that condition questions are only allowed for checkbox and multiple choice questions
   */
  static validateConditionQuestionTypes(question: ContentType): {
    isValid: boolean;
    error?: string;
  } {
    if (!question.conditional || question.conditional.length === 0) {
      return { isValid: true };
    }

    const allowedTypes = [QuestionType.CheckBox, QuestionType.MultipleChoice];

    if (!allowedTypes.includes(question.type)) {
      return {
        isValid: false,
        error: `Condition questions are only allowed for checkbox and multiple choice questions. Current type: ${question.type}`,
      };
    }

    return { isValid: true };
  }

  /**
   * Validates that condition keys correspond to valid option indices
   */
  static validateConditionKeys(question: ContentType): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!question.conditional || question.conditional.length === 0) {
      return { isValid: true, errors };
    }

    const options =
      question.type === QuestionType.MultipleChoice
        ? question.multiple
        : question.checkbox;

    if (!options || options.length === 0) {
      errors.push("Question has conditional logic but no options defined");
      return { isValid: false, errors };
    }

    question.conditional.forEach((condition, conditionIndex) => {
      if (condition.key === undefined || condition.key === null) {
        errors.push(`Condition ${conditionIndex} has undefined key`);
        return;
      }

      const optionExists = options.some(
        (option) => option.idx === condition.key
      );
      if (!optionExists) {
        errors.push(
          `Condition ${conditionIndex} references non-existent option key: ${condition.key}`
        );
      }
    });

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validates the structure of conditional questions
   */
  static validateConditionalStructure(questions: ContentType[]): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    questions.forEach((question, questionIndex) => {
      if (!question.conditional || question.conditional.length === 0) {
        return;
      }

      // Check if question type supports conditions
      const typeValidation = this.validateConditionQuestionTypes(question);
      if (!typeValidation.isValid) {
        errors.push(`Question ${questionIndex}: ${typeValidation.error}`);
      }

      // Check if condition keys are valid
      const keyValidation = this.validateConditionKeys(question);
      if (!keyValidation.isValid) {
        keyValidation.errors.forEach((error) => {
          errors.push(`Question ${questionIndex}: ${error}`);
        });
      }

      // Check if conditional content exists
      question.conditional.forEach((condition, conditionIndex) => {
        const conditionalContent = questions.find(
          (q) =>
            q._id === condition.contentId ||
            (condition.contentIdx !== undefined &&
              questions.indexOf(q) === condition.contentIdx)
        );

        if (!conditionalContent) {
          errors.push(
            `Question ${questionIndex}, Condition ${conditionIndex}: Referenced conditional content not found`
          );
        } else {
          // Validate parent-child relationship
          if (conditionalContent.parentcontent) {
            const parentId = question._id || questionIndex.toString();
            const parentMatch =
              conditionalContent.parentcontent.qId === parentId ||
              conditionalContent.parentcontent.qIdx === questionIndex;

            if (!parentMatch) {
              errors.push(
                `Question ${questionIndex}, Condition ${conditionIndex}: Parent-child relationship mismatch`
              );
            }

            if (conditionalContent.parentcontent.optIdx !== condition.key) {
              errors.push(
                `Question ${questionIndex}, Condition ${conditionIndex}: Option index mismatch`
              );
            }
          }
        }
      });
    });

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validates that condition questions work with autosave
   */
  static validateAutosaveCompatibility(
    originalQuestions: ContentType[],
    updatedQuestions: ContentType[]
  ): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check if all conditional relationships are preserved
    originalQuestions.forEach((originalQuestion, index) => {
      const updatedQuestion = updatedQuestions[index];

      if (!updatedQuestion) {
        errors.push(`Question ${index}: Missing in updated questions`);
        return;
      }

      // Compare conditional arrays
      const originalConditionals = originalQuestion.conditional || [];
      const updatedConditionals = updatedQuestion.conditional || [];

      if (originalConditionals.length !== updatedConditionals.length) {
        errors.push(
          `Question ${index}: Conditional count mismatch (${originalConditionals.length} vs ${updatedConditionals.length})`
        );
        return;
      }

      originalConditionals.forEach((originalCondition, conditionIndex) => {
        const updatedCondition = updatedConditionals[conditionIndex];

        if (!updatedCondition) {
          errors.push(
            `Question ${index}, Condition ${conditionIndex}: Missing in updated questions`
          );
          return;
        }

        if (originalCondition.key !== updatedCondition.key) {
          errors.push(
            `Question ${index}, Condition ${conditionIndex}: Key mismatch`
          );
        }

        if (originalCondition.contentId !== updatedCondition.contentId) {
          errors.push(
            `Question ${index}, Condition ${conditionIndex}: Content ID mismatch`
          );
        }
      });
    });

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validates the entire question form for condition question compliance
   */
  static validateFormConditions(questions: ContentType[]): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic structure validation
    const structureValidation = this.validateConditionalStructure(questions);
    if (!structureValidation.isValid) {
      errors.push(...structureValidation.errors);
    }

    // Check for orphaned conditional questions
    questions.forEach((question, index) => {
      if (question.parentcontent && !question.parentcontent.qId) {
        warnings.push(`Question ${index}: Has parent content but no parent ID`);
      }
    });

    // Check for circular dependencies
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCircularDependency = (questionId: string): boolean => {
      if (recursionStack.has(questionId)) {
        return true;
      }

      if (visited.has(questionId)) {
        return false;
      }

      visited.add(questionId);
      recursionStack.add(questionId);

      const question = questions.find((q) => q._id === questionId);
      if (question?.conditional) {
        for (const condition of question.conditional) {
          if (
            condition.contentId &&
            hasCircularDependency(condition.contentId)
          ) {
            return true;
          }
        }
      }

      recursionStack.delete(questionId);
      return false;
    };

    questions.forEach((question) => {
      if (question._id && hasCircularDependency(question._id)) {
        errors.push(
          `Circular dependency detected involving question ${question._id}`
        );
      }
    });

    return { isValid: errors.length === 0, errors, warnings };
  }
}
