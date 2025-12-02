import { RangeValue } from "@heroui/react";
import { QuestionType } from "../types/Form.types";
import {
  AnswerKeyPairValueType,
  ResponseValueType,
} from "../component/Response/Response.type";
import { FormatDate } from "../helperFunc";

/**
 * Check if a response is empty based on its type
 */
export const isResponseEmpty = (
  response: ResponseValueType,
  qType?: QuestionType
): boolean => {
  if (response === undefined || response === null || response === "") {
    return true;
  }

  if (
    typeof response === "object" &&
    Object.keys(response).length === 0 &&
    !(response instanceof Date)
  ) {
    return true;
  }

  // Check for empty CheckBox responses
  if (qType === QuestionType.CheckBox) {
    const ress = response as AnswerKeyPairValueType;
    if (!ress.key || !Array.isArray(ress.key) || ress.key.length === 0) {
      return true;
    }
  }

  // Check for empty MultipleChoice/Selection responses
  if (
    qType === QuestionType.MultipleChoice ||
    qType === QuestionType.Selection
  ) {
    const singleResponse = response as AnswerKeyPairValueType;
    if (!singleResponse.val) {
      return true;
    }
  }

  // Check for empty Range responses
  if (qType === QuestionType.RangeDate || qType === QuestionType.RangeNumber) {
    const rangeResponse = response as unknown as RangeValue<string | number>;
    if (!rangeResponse.start || !rangeResponse.end) {
      return true;
    }
  }

  return false;
};

/**
 * Render answer based on question type
 */
export const renderAnswer = (
  response: ResponseValueType,
  qType: QuestionType,
  EmptyComponent?: React.ReactNode
) => {
  // Check if response is undefined, null, or empty
  if (isResponseEmpty(response, qType)) {
    return EmptyComponent || null;
  }

  switch (qType) {
    case QuestionType.CheckBox: {
      const ress = response as AnswerKeyPairValueType;
      const keys = Array.isArray(ress.key) ? ress.key : [ress.key];
      return keys.map((key, idx) => ({
        key: idx,
        label: `${key} – ${Array.isArray(ress.val) ? ress.val[idx] : ress.val}`,
      }));
    }

    case QuestionType.MultipleChoice:
    case QuestionType.Selection: {
      const singleResponse = response as AnswerKeyPairValueType;
      return singleResponse.val;
    }

    case QuestionType.RangeDate:
    case QuestionType.RangeNumber: {
      const RangeResponse = response as unknown as RangeValue<string | number>;
      return {
        start:
          typeof RangeResponse.start === "string"
            ? FormatDate(new Date(RangeResponse.start))
            : RangeResponse.start,
        end:
          typeof RangeResponse.end === "string"
            ? FormatDate(new Date(RangeResponse.end))
            : RangeResponse.end,
      };
    }

    default:
      return String(response);
  }
};
