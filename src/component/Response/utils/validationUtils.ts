import {
  ContentType,
  QuestionType,
  QuestionValidationIssue,
} from "../../../types/Form.types";
import { FormResponse } from "../hooks/useFormResponses";

export interface ValidationSummary {
  totalQuestions: number;
  visibleQuestions: number;
  requiredQuestions: number;
  completedRequired: number;
  missingRequired: string[];
  conditionalQuestions: number;
  hiddenQuestions: number;
}

export const createValidationSummary = (
  questions: ContentType[],
  visibleQuestions: ContentType[],
  responses: FormResponse[],
): ValidationSummary => {
  const requiredQuestions = visibleQuestions.filter((q) => q.require);
  const completedRequired = requiredQuestions.filter((q) => {
    const response = responses.find((r) => r.question === q._id);
    if (!response) return false;

    switch (q.type) {
      case QuestionType.MultipleSelection:
      case QuestionType.CheckBox:
      case QuestionType.MultipleChoice:
      case QuestionType.Selection:
        return Array.isArray(response.response) && response.response.length > 0;

      case QuestionType.ShortAnswer:
      case QuestionType.Paragraph:
        return (
          typeof response.response === "string" &&
          response.response.trim() !== ""
        );
      case QuestionType.Number:
        return (
          response.response !== "" &&
          response.response !== null &&
          !isNaN(Number(response.response))
        );
      case QuestionType.Date:
        return (
          response.response instanceof Date ||
          (response.response && response.response !== "")
        );
      case QuestionType.RangeNumber:
      case QuestionType.RangeDate:
        return (
          response.response &&
          typeof response.response === "object" &&
          "start" in (response.response as object) &&
          "end" in (response.response as object)
        );
      default:
        return (
          response.response !== "" &&
          response.response !== null &&
          response.response !== undefined
        );
    }
  });

  const missingRequired = requiredQuestions
    .filter((q) => !completedRequired.includes(q))
    .map((q) => {
      const index = questions.findIndex((originalQ) => originalQ._id === q._id);
      return `Question ${index + 1}`;
    });

  return {
    totalQuestions: questions.length,
    visibleQuestions: visibleQuestions.length,
    requiredQuestions: requiredQuestions.length,
    completedRequired: completedRequired.length,
    missingRequired,
    conditionalQuestions: questions.filter((q) => q.parentcontent).length,
    hiddenQuestions: questions.length - visibleQuestions.length,
  };
};

export const logValidationSummary = (summary: ValidationSummary) => {
  if (import.meta.env.DEV) {
    console.log("🔍 Form Validation Summary:", {
      "📋 Total Questions": summary.totalQuestions,
      "👁️ Visible Questions": summary.visibleQuestions,
      "❗ Required Questions": summary.requiredQuestions,
      "✅ Completed Required": summary.completedRequired,
      "❌ Missing Required": summary.missingRequired,
      "🔗 Conditional Questions": summary.conditionalQuestions,
      "🙈 Hidden Questions": summary.hiddenQuestions,
      "✨ Form Valid": summary.missingRequired.length === 0,
    });
  }
};

/**
 * Helper to check if a question title is using default placeholder content.
 */
export const isQuestionDefaultContent = (question: ContentType): boolean => {
  if (!question.title) return true;

  if (typeof question.title === "string") {
    const trimmed = question.title.trim();
    if (!trimmed || trimmed === "Untitled Question") return true;
    if (
      trimmed.includes("Hello this is header 1") ||
      trimmed.includes("This is a paragraph below the header.")
    ) {
      return true;
    }
    return false;
  }

  if (typeof question.title === "object") {
    try {
      const titleStr = JSON.stringify(question.title);
      if (
        titleStr.includes("Hello this is header 1") ||
        titleStr.includes("This is a paragraph below the header.")
      ) {
        return true;
      }
      const matches = titleStr.match(/"text":"([^"]+)"/g);
      if (!matches || matches.length === 0) return true;
      const combinedText = matches
        .map((m) => m.replace(/"text":"([^"]+)"/, "$1"))
        .join(" ")
        .trim();
      if (!combinedText || combinedText === "Untitled Question") return true;
    } catch {
      return true;
    }
  }

  return false;
};

export const validateRealtimeQuestion = (
  question: ContentType,
): ContentType => {
  const issues: QuestionValidationIssue[] = [];
  const warnings: QuestionValidationIssue[] = [];

  if (isQuestionDefaultContent(question)) {
    warnings.push({
      type: "warning",
      message:
        "Question is using default content. Please update the question title.",
    });
  }

  // Empty Options / Content Property Check (Error)
  switch (question.type) {
    case QuestionType.CheckBox: {
      const opts = question.checkbox;
      if (!opts || !Array.isArray(opts) || opts.length === 0) {
        issues.push({
          type: "error",
          message: "Checkbox options cannot be empty.",
        });
      } else if (
        opts.some((opt) => !opt.content || opt.content.trim() === "")
      ) {
        issues.push({
          type: "error",
          message: "Checkbox options should not contain empty choice text.",
        });
      }
      break;
    }
    case QuestionType.MultipleChoice: {
      const opts = question.multiple;
      if (!opts || !Array.isArray(opts) || opts.length === 0) {
        issues.push({
          type: "error",
          message: "Multiple choice options cannot be empty.",
        });
      } else if (
        opts.some((opt) => !opt.content || opt.content.trim() === "")
      ) {
        issues.push({
          type: "error",
          message:
            "Multiple choice options should not contain empty choice text.",
        });
      }
      break;
    }
    case QuestionType.Selection: {
      const opts = question.selection;
      if (!opts || !Array.isArray(opts) || opts.length === 0) {
        issues.push({
          type: "error",
          message: "Selection options cannot be empty.",
        });
      } else if (
        opts.some((opt) => !opt.content || opt.content.trim() === "")
      ) {
        issues.push({
          type: "error",
          message: "Selection options should not contain empty choice text.",
        });
      }

      break;
    }
    case QuestionType.MultipleSelection: {
      const opts = question.selection || question.multiple;
      if (!opts || !Array.isArray(opts) || opts.length === 0) {
        issues.push({
          type: "error",
          message: "Multiple selection options cannot be empty.",
        });
      } else if (
        opts.some((opt) => !opt.content || opt.content.trim() === "")
      ) {
        issues.push({
          type: "error",
          message:
            "Multiple selection options should not contain empty choice text.",
        });
      }
      break;
    }
    case QuestionType.RangeDate: {
      const rd = question.rangedate;
      if (!rd || !rd.start || !rd.end) {
        issues.push({
          type: "error",
          message: "Range date start and end values cannot be empty.",
        });
      }
      break;
    }
    case QuestionType.RangeNumber: {
      const rn = question.rangenumber;
      if (
        !rn ||
        rn.start === undefined ||
        rn.end === undefined ||
        rn.start === null ||
        rn.end === null
      ) {
        issues.push({
          type: "error",
          message: "Range number start and end values cannot be empty.",
        });
      }
      break;
    }
    default:
      break;
  }

  // Combine with existing backend/custom validation issues if present
  const existingIssues: QuestionValidationIssue[] = [];
  const existingWarnings: QuestionValidationIssue[] = [];

  // Merge unique issues and warnings
  const finalIssues = [...issues];
  existingIssues.forEach((item) => {
    if (!finalIssues.some((i) => i.message === item.message)) {
      finalIssues.push(item);
    }
  });

  const finalWarnings = [...warnings];
  existingWarnings.forEach((item) => {
    if (!finalWarnings.some((w) => w.message === item.message)) {
      finalWarnings.push(item);
    }
  });

  return {
    ...question,
    validationIssues: finalIssues,
    validationWarning: finalWarnings,
  };
};

export const validateRealtimeQuestions = (
  questions: ContentType[],
  currentTab: string = "question",
): ContentType[] => {
  if (currentTab !== "question") {
    return questions;
  }
  return questions.map((q) => validateRealtimeQuestion(q));
};

export const hasQuestionValidationIssues = (
  questions: ContentType[],
): boolean => {
  if (!Array.isArray(questions) || questions.length === 0) return false;
  return questions.some((q) => {
    const validated = validateRealtimeQuestion(q);
    const issues = validated.validationIssues;
    return Array.isArray(issues) && issues.some((i) => i.type === "error" || !i.type);
  });
};
