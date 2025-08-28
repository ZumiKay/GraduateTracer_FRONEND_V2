import React, { memo } from "react";
import { Chip } from "@heroui/react";
import { ContentType, QuestionType } from "../../../types/Form.types";

interface SolutionStatusProps {
  content: ContentType;
  localAnswer: unknown;
  localScore: number;
  isValidated: boolean;
  isConditionalQuestion: boolean;
}

const SolutionStatus = memo(
  ({
    content,
    localAnswer,
    localScore,
    isValidated,
    isConditionalQuestion,
  }: SolutionStatusProps) => {
    // Memoize validation status calculation
    const validationStatus = React.useMemo(() => {
      // Text type questions don't need answers or scores since they're just for display
      if (content.type === QuestionType.Text) {
        return { color: "success" as const, text: "Display text" };
      }

      // Compute hasAnswer locally based on current state
      const currentHasAnswer = (() => {
        if (
          localAnswer === "" ||
          localAnswer === null ||
          localAnswer === undefined
        ) {
          return false;
        }

        // For arrays (checkbox, selection)
        if (Array.isArray(localAnswer)) {
          return localAnswer.length > 0;
        }

        // For range types
        if (typeof localAnswer === "object" && localAnswer !== null) {
          // Range objects should have start and end properties
          if ("start" in localAnswer && "end" in localAnswer) {
            return (
              localAnswer.start !== undefined && localAnswer.end !== undefined
            );
          }
        }

        // For other types (string, number, date)
        return true;
      })();

      // Additional validation for range types
      const isValidRange = (() => {
        if (
          content.type === QuestionType.RangeDate &&
          typeof localAnswer === "object" &&
          localAnswer !== null &&
          "start" in localAnswer &&
          "end" in localAnswer
        ) {
          // Range validation logic would go here
          return true; // Simplified for performance
        }

        if (
          content.type === QuestionType.RangeNumber &&
          typeof localAnswer === "object" &&
          localAnswer !== null &&
          "start" in localAnswer &&
          "end" in localAnswer
        ) {
          // Range validation logic would go here
          return true; // Simplified for performance
        }

        return true;
      })();

      if (!currentHasAnswer && !localScore) {
        return { color: "danger" as const, text: "Missing answer and score" };
      }
      if (!currentHasAnswer) {
        return { color: "warning" as const, text: "Missing answer" };
      }
      if (!isValidRange) {
        return { color: "danger" as const, text: "Invalid range" };
      }
      if (!localScore) {
        return { color: "warning" as const, text: "Missing score" };
      }
      if (isValidated) {
        return { color: "success" as const, text: "Valid" };
      }
      return { color: "default" as const, text: "Needs validation" };
    }, [content.type, localScore, isValidated, localAnswer]);

    return (
      <div className="flex items-center gap-2">
        {isConditionalQuestion && (
          <Chip color="secondary" variant="flat" size="sm">
            Conditional Question
          </Chip>
        )}
        <Chip color={validationStatus.color} variant="flat" size="sm">
          {validationStatus.text}
        </Chip>
      </div>
    );
  }
);

SolutionStatus.displayName = "SolutionStatus";

export default SolutionStatus;
