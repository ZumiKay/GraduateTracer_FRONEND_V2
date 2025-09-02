import { QuestionType, ContentType } from "../../../types/Form.types";

export const getQuestionTypeLabel = (type: QuestionType): string => {
  const typeMap = {
    [QuestionType.MultipleChoice]: "Multiple Choice",
    [QuestionType.CheckBox]: "Checkbox",
    [QuestionType.Text]: "Text",
    [QuestionType.ShortAnswer]: "Short Answer",
    [QuestionType.Paragraph]: "Paragraph",
    [QuestionType.Number]: "Number",
    [QuestionType.Date]: "Date",
    [QuestionType.RangeNumber]: "Range Number",
    [QuestionType.RangeDate]: "Range Date",
    [QuestionType.Selection]: "Selection",
  };
  return typeMap[type] || "Unknown";
};

export const getQuestionTitle = (question: ContentType): string => {
  if (typeof question.title === "string") return question.title;

  if (question.title && typeof question.title === "object") {
    try {
      const titleStr = JSON.stringify(question.title);
      const textMatches = titleStr.match(/"text":"([^"]+)"/g);
      if (textMatches) {
        return textMatches
          .map((match) => match.replace(/"text":"([^"]+)"/, "$1"))
          .join(" ");
      }
    } catch (error) {
      console.error("Error parsing title:", error);
    }
  }
  return "Untitled Question";
};

export const canToggleVisibility = (question: ContentType): boolean => {
  return Boolean(question.conditional && question.conditional.length > 0);
};

export const generateQuestionKey = (
  question: ContentType,
  index: number = 0
): string => {
  if (question._id) return question._id.toString();

  const titleHash =
    typeof question.title === "string"
      ? question.title.slice(0, 10)
      : JSON.stringify(question.title).slice(0, 20);

  return `${question.type}-${index}-${titleHash.replace(/[^a-zA-Z0-9]/g, "")}`;
};

export const filterQuestions = {
  types: [
    { key: "all", label: "All", color: "default" as const },
    { key: "required", label: "Required", color: "danger" as const },
    { key: "conditional", label: "Conditional", color: "warning" as const },
    { key: "multiple", label: "Multiple Choice", color: "primary" as const },
    { key: "text", label: "Text", color: "secondary" as const },
    { key: "number", label: "Number", color: "success" as const },
    { key: "date", label: "Date", color: "default" as const },
  ],

  applyFilter: (questions: ContentType[], filter: string) => {
    switch (filter) {
      case "required":
        return questions.filter((q) => q.require);
      case "conditional":
        return questions.filter(
          (q) => q.conditional && q.conditional.length > 0
        );
      case "multiple":
        return questions.filter((q) => q.type === QuestionType.MultipleChoice);
      case "text":
        return questions.filter((q) =>
          [
            QuestionType.Text,
            QuestionType.ShortAnswer,
            QuestionType.Paragraph,
          ].includes(q.type)
        );
      case "number":
        return questions.filter((q) =>
          [QuestionType.Number, QuestionType.RangeNumber].includes(q.type)
        );
      case "date":
        return questions.filter((q) =>
          [QuestionType.Date, QuestionType.RangeDate].includes(q.type)
        );
      default:
        return questions;
    }
  },
};
