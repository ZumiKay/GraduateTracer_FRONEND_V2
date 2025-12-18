import { RangeValue } from "@heroui/react";
import { AnswerKey, QuestionType } from "../types/Form.types";
import {
  AnswerKeyPairValueType,
  ResponseValueType,
} from "../component/Response/Response.type";

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
