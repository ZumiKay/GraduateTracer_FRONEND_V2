import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import {
  Checkbox,
  Chip,
  DatePicker,
  Input,
  NumberInput,
  Radio,
  RadioGroup,
  RangeValue,
} from "@heroui/react";
import { useDispatch, useSelector } from "react-redux";
import {
  AnswerKey,
  ContentType,
  QuestionType,
  RangeType,
} from "../../../types/Form.types";
import { setdisbounceQuestion, setformstate } from "../../../redux/formstore";
import { DateValue, parseAbsoluteToLocal } from "@internationalized/date";
import { RootState } from "../../../redux/store";
import { ErrorToast } from "../../Modal/AlertModal";
import { convertDateValueToString } from "../../../helperFunc";
import { ContentAnswerType } from "../../Response/Response.type";

interface SolutionInputProps {
  content: ContentType;
  onUpdateContent: (updates: Partial<ContentType>) => void;
  isValidated?: boolean;
  parentScore?: number;
}

type LocalAnswerType = ContentAnswerType | DateValue | RangeType<DateValue>;

/**
 * SolutionInput Component
 *
 * Handles solution input for different question types with validation and scoring.
 * Optimized for performance with proper memoization and error handling.
 *
 * @component
 */
const SolutionInput: React.FC<SolutionInputProps> = ({
  content,
  onUpdateContent,
  isValidated = false,
  parentScore,
}) => {
  const formstate = useSelector((root: RootState) => root.allform.formstate);
  const isDark = useSelector((root: RootState) => root.globalindex.darkmode);
  const dispatch = useDispatch();
  const previousAnswerRef = useRef<ContentAnswerType | undefined>(undefined);

  // State management
  const [localAnswer, setLocalAnswer] = useState<LocalAnswerType>();
  const [localScore, setLocalScore] = useState<number>(content.score || 0);
  const [scoreInputValue, setScoreInputValue] = useState<string>(
    String(content.score || 0)
  );
  const [scoreBeforeEdit, setScoreBeforeEdit] = useState<number>(
    content.score || 0
  );
  const [errorMess, setErrorMess] = useState<string>();

  const isConditionalQuestion = !!content.parentcontent;

  /**
   * Helper function to safely parse date strings to DateValue
   */
  const safeParseDateValue = useCallback(
    (dateString: string): DateValue | null => {
      try {
        if (!dateString || typeof dateString !== "string") {
          return null;
        }
        return parseAbsoluteToLocal(dateString);
      } catch (error) {
        console.error("Error parsing date value:", error, dateString);
        return null;
      }
    },
    []
  );

  /**
   * Helper function to check if answer has value
   */
  const hasAnswerValue = useCallback((answer: ContentAnswerType): boolean => {
    if (answer === "" || answer === null || answer === undefined) {
      return false;
    }

    // For arrays (checkbox, selection)
    if (Array.isArray(answer)) {
      return answer.length > 0;
    }

    // For range types
    if (typeof answer === "object" && answer !== null) {
      if ("start" in answer && "end" in answer) {
        return answer.start !== undefined && answer.end !== undefined;
      }
    }

    // For other types (string, number, date)
    return true;
  }, []);

  /**
   * Initialize and sync local answer with content.answer
   */
  useEffect(() => {
    const newAnswer = (content.answer as AnswerKey)?.answer;

    // Skip if answer hasn't changed
    if (newAnswer === previousAnswerRef.current) {
      return;
    }
    previousAnswerRef.current = newAnswer;

    setLocalAnswer(newAnswer);
  }, [content.answer, content.type]);

  /**
   * Handle answer changes with validation and state updates
   */
  const handleAnswerChange = useCallback(
    (answer?: ContentAnswerType) => {
      try {
        setLocalAnswer(answer);

        let answerUpdate: AnswerKey | undefined = undefined;
        if (answer !== undefined && answer !== null) {
          answerUpdate = {
            ...(content.answer || {}),
            answer,
          } as AnswerKey;
        }

        onUpdateContent({ answer: answerUpdate });
        dispatch(setdisbounceQuestion({ ...content, answer: answerUpdate }));
      } catch (error) {
        console.error("Error handling answer change:", error);
        ErrorToast({
          title: "Error",
          content: "Failed to update answer. Please try again.",
        });
      }
    },
    [content, onUpdateContent, dispatch]
  );

  /**
   * Handle score changes
   */
  const handleScoreChange = useCallback((score: number) => {
    setLocalScore(score);
  }, []);

  /**
   * Validate and save score
   */
  const handleScoreSave = useCallback(
    (finalScore: number) => {
      try {
        // Verify Child Score
        if (
          isConditionalQuestion &&
          parentScore !== undefined &&
          parentScore < finalScore
        ) {
          ErrorToast({
            title: "Validation Error",
            content: `Score cannot exceed parent question score (${parentScore} pts)`,
          });
          setErrorMess(`Maximum score: ${parentScore} pts`);
          // Revert to previous valid score
          setLocalScore(scoreBeforeEdit);
          setScoreInputValue(String(scoreBeforeEdit));
          return;
        }

        // Clear error if validation passes
        setErrorMess(undefined);

        if (finalScore !== content.score) {
          onUpdateContent({ score: finalScore });
        }
      } catch (error) {
        console.error("Error saving score:", error);
        ErrorToast({
          title: "Error",
          content: "Failed to save score. Please try again.",
        });
      }
    },
    [
      content.score,
      isConditionalQuestion,
      onUpdateContent,
      parentScore,
      scoreBeforeEdit,
    ]
  );

  /**
   * Update total form score
   */
  const handleTotalScoreUpdate = useCallback(
    (newScore: number) => {
      try {
        const scoreDiff = newScore - scoreBeforeEdit;
        if (scoreDiff !== 0) {
          const newTotalScore = (formstate.totalscore || 0) + scoreDiff;
          dispatch(
            setformstate({
              ...formstate,
              totalscore: newTotalScore,
            })
          );
          setScoreBeforeEdit(newScore);
        }
      } catch (error) {
        console.error("Error updating total score:", error);
      }
    },
    [scoreBeforeEdit, dispatch, formstate]
  );

  /**
   * Validate range dates
   */
  const validateRangeDate = useCallback(
    (range: RangeType<DateValue>): { isValid: boolean; message: string } => {
      if (
        !range.start ||
        !range.end ||
        typeof range.start === "string" ||
        typeof range.end === "string"
      ) {
        return {
          isValid: false,
          message: "Both start and end dates are required",
        };
      }

      // Check if start and end are the same
      if (range.start.compare(range.end) === 0) {
        return {
          isValid: false,
          message: "Start date and end date cannot be the same",
        };
      }

      // Check if range is valid (end >= start)
      if (range.end.compare(range.start) < 0) {
        return {
          isValid: false,
          message: "End date must be after start date",
        };
      }

      // Check if within question range
      if (content.rangedate?.start && content.rangedate?.end) {
        try {
          const questionStart = safeParseDateValue(content.rangedate.start);
          const questionEnd = safeParseDateValue(content.rangedate.end);

          if (questionStart && questionEnd) {
            // Allow selection to match question range boundaries

            console.log({ questionStart, rangeStart: range.start });

            if (
              range.start.compare(questionStart) < 0 ||
              range.end.compare(questionEnd) > 0 ||
              range.start.compare(questionEnd) > 0 ||
              range.end.compare(questionStart) < 0
            ) {
              return {
                isValid: false,
                message: `Solution must be within question range`,
              };
            }
          }
        } catch (error) {
          console.error("Error validating range date:", error);
        }
      }

      return { isValid: true, message: "" };
    },
    [content.rangedate, safeParseDateValue]
  );

  /**
   * Validate range numbers
   */
  const validateRangeNumber = useCallback(
    (range: RangeType<number>): { isValid: boolean; message: string } => {
      if (range.start === undefined || range.end === undefined) {
        return {
          isValid: false,
          message: "Both start and end values are required",
        };
      }

      // Check if range is valid (end >= start)
      if (range.end < range.start) {
        return {
          isValid: false,
          message: "End value must be greater than or equal to start value",
        };
      }

      // Check if within question range
      if (
        content.rangenumber &&
        typeof content.rangenumber.start === "number" &&
        typeof content.rangenumber.end === "number"
      ) {
        if (
          range.start < content.rangenumber.start ||
          range.end > content.rangenumber.end
        ) {
          return {
            isValid: false,
            message: `Solution range must be within ${content.rangenumber.start} to ${content.rangenumber.end}`,
          };
        }
      }

      return { isValid: true, message: "" };
    },
    [content.rangenumber]
  );

  /**
   * Render answer input based on question type
   */
  const renderAnswerInput = useMemo(() => {
    switch (content.type) {
      case QuestionType.Text:
        return (
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              Display text questions don't require answer keys.
            </p>
          </div>
        );

      case QuestionType.MultipleChoice:
        return (
          <div className="space-y-2 dark:bg-gray-600 dark:p-2">
            <p className="text-sm font-medium">Select correct answer:</p>
            <RadioGroup
              value={
                localAnswer !== undefined ? String(localAnswer) : undefined
              }
              onValueChange={(value) => handleAnswerChange(Number(value))}
              className="flex flex-col gap-2"
              color="warning"
            >
              {content.multiple?.map((option, index) => (
                <Radio key={`mc-${index}`} value={String(index)}>
                  {option.content || `Option ${index + 1}`}
                </Radio>
              ))}
            </RadioGroup>
          </div>
        );

      case QuestionType.CheckBox:
        return (
          <div className="space-y-2">
            <p className="text-sm font-medium">Select correct answer(s):</p>
            <div className="space-y-2">
              {content.checkbox?.map((option, index) => (
                <Checkbox
                  key={`cb-${index}`}
                  isSelected={
                    Array.isArray(localAnswer) &&
                    (localAnswer as number[]).includes(index)
                  }
                  onValueChange={(checked) => {
                    const currentAnswers = Array.isArray(localAnswer)
                      ? (localAnswer as number[])
                      : [];
                    const newAnswers: number[] = checked
                      ? [...currentAnswers, index]
                      : currentAnswers.filter((idx) => idx !== index);
                    handleAnswerChange(newAnswers as ContentAnswerType);
                  }}
                  aria-label={`${option.content}${index + 1}`}
                  color="warning"
                >
                  {option.content || `Option ${index + 1}`}
                </Checkbox>
              ))}
            </div>
          </div>
        );

      case QuestionType.ShortAnswer:
      case QuestionType.Paragraph:
        return (
          <Input
            label="Correct Answer"
            placeholder="Enter the correct answer"
            value={localAnswer ? String(localAnswer) : ""}
            onChange={(e) => handleAnswerChange(e.target.value)}
            variant="bordered"
          />
        );

      case QuestionType.Number:
        return (
          <NumberInput
            label="Correct Answer"
            placeholder="Enter the correct number"
            value={localAnswer !== undefined ? Number(localAnswer) : undefined}
            onValueChange={(value) =>
              handleAnswerChange(value as ContentAnswerType)
            }
            variant="bordered"
          />
        );

      case QuestionType.Date: {
        return (
          <DatePicker
            label="Date"
            value={safeParseDateValue(localAnswer as string)}
            granularity="day"
            onChange={(dateValue) => {
              if (dateValue) {
                const dateString = convertDateValueToString(
                  dateValue as DateValue
                );
                handleAnswerChange(dateString);
              }
            }}
            variant="bordered"
            size="lg"
          />
        );
      }

      case QuestionType.Selection:
        return (
          <div className="space-y-2 dark:bg-gray-500 dark:p-2">
            <p className="text-sm font-medium">Select correct option:</p>
            <RadioGroup
              value={
                localAnswer !== undefined ? String(localAnswer) : undefined
              }
              onValueChange={(value) => handleAnswerChange(Number(value))}
              className="flex flex-col gap-2"
              color="default"
            >
              {content.selection?.map((option, index) => (
                <Radio key={`sel-${index}`} value={String(index)}>
                  {option.content || `Option ${index + 1}`}
                </Radio>
              ))}
            </RadioGroup>
          </div>
        );

      case QuestionType.RangeDate: {
        const questionRange = content.rangedate;
        const answer = { ...((localAnswer ?? {}) as RangeType<string>) };

        //Converted Range
        const currentRange = {
          start: safeParseDateValue(answer.start),
          end: safeParseDateValue(answer.end),
        };

        let questionRangeDisplay: RangeValue<DateValue> | null = null;
        if (questionRange?.start && questionRange?.end) {
          const start = safeParseDateValue(questionRange.start);
          const end = safeParseDateValue(questionRange.end);
          if (start && end) {
            questionRangeDisplay = { start, end };
          }
        }

        const validation =
          currentRange.start && currentRange.end
            ? validateRangeDate(currentRange as RangeType<DateValue>)
            : { isValid: false, message: "Missing Value" };

        return (
          <div className="space-y-3">
            <p className="text-sm font-medium">Set correct date range:</p>
            <div className="flex gap-2 items-start">
              <DatePicker
                label="Start Date"
                value={currentRange?.start}
                granularity="day"
                minValue={questionRangeDisplay?.start}
                maxValue={questionRangeDisplay?.end}
                onChange={(dateValue) => {
                  if (dateValue) {
                    console.log({ dateValue });
                    const newRange: RangeType<string | null> = {
                      start: convertDateValueToString(dateValue as DateValue),
                      end: currentRange?.end
                        ? convertDateValueToString(
                            currentRange.end as DateValue
                          )
                        : null,
                    };
                    handleAnswerChange(newRange);
                  }
                }}
                variant="bordered"
                size="sm"
                isInvalid={!validation.isValid}
              />
              <span className="text-gray-400 mt-2">to</span>
              <DatePicker
                label="End Date"
                granularity="day"
                value={currentRange?.end}
                minValue={questionRangeDisplay?.start}
                maxValue={questionRangeDisplay?.end}
                onChange={(dateValue) => {
                  if (dateValue) {
                    const newRange: RangeType<string | null> = {
                      start: currentRange?.start
                        ? convertDateValueToString(currentRange.start)
                        : null,
                      end: convertDateValueToString(dateValue as DateValue),
                    };
                    handleAnswerChange(newRange);
                  }
                }}
                variant="bordered"
                size="sm"
                isInvalid={!validation.isValid}
                errorMessage={validation.message}
              />
            </div>
          </div>
        );
      }

      case QuestionType.RangeNumber: {
        const questionRange = content.rangenumber;
        const currentRange = (localAnswer as unknown as RangeType<number>) || {
          start: 0,
          end: 0,
        };

        const validation = validateRangeNumber(currentRange);

        return (
          <div className="space-y-3">
            <p className="text-sm font-medium">Set correct number range:</p>
            {questionRange && (
              <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                Question allows range: {questionRange.start} to{" "}
                {questionRange.end}
              </div>
            )}
            <div className="flex gap-2 items-start">
              <NumberInput
                label="Min Value"
                placeholder="Minimum"
                value={currentRange.start}
                onValueChange={(value) => {
                  const newRange: RangeType<number> = {
                    start: value ?? 0,
                    end: currentRange.end ?? 0,
                  };
                  handleAnswerChange(newRange);
                }}
                variant="bordered"
                size="sm"
                isInvalid={!validation.isValid}
              />
              <span className="text-gray-400 mt-2">to</span>
              <NumberInput
                label="Max Value"
                placeholder="Maximum"
                value={currentRange.end}
                onValueChange={(value) => {
                  const newRange: RangeType<number> = {
                    start: currentRange.start ?? 0,
                    end: value ?? 0,
                  };
                  handleAnswerChange(newRange);
                }}
                variant="bordered"
                size="sm"
                isInvalid={!validation.isValid}
                errorMessage={validation.message}
              />
            </div>
          </div>
        );
      }

      default:
        return (
          <Input
            label="Answer"
            placeholder="Enter answer"
            value={localAnswer ? String(localAnswer) : ""}
            onChange={(e) => handleAnswerChange(e.target.value)}
            variant="bordered"
          />
        );
    }
  }, [
    content.type,
    content.multiple,
    content.checkbox,
    content.selection,
    content.rangedate,
    content.rangenumber,
    localAnswer,
    handleAnswerChange,
    safeParseDateValue,
    validateRangeDate,
    validateRangeNumber,
  ]);

  /**
   * Calculate validation status
   */
  const validationStatus = useMemo(() => {
    if (content.type === QuestionType.Text) {
      return { color: "success" as const, text: "Display text" };
    }

    const currentHasAnswer = hasAnswerValue(localAnswer as ContentAnswerType);

    // Validate range types
    let isValidRange = true;
    let rangeError = "";

    if (content.type === QuestionType.RangeDate && localAnswer) {
      const validation = validateRangeDate(localAnswer as RangeType<DateValue>);
      isValidRange = validation.isValid;
      rangeError = validation.message;
    }

    if (content.type === QuestionType.RangeNumber && localAnswer) {
      const validation = validateRangeNumber(localAnswer as RangeType<number>);
      isValidRange = validation.isValid;
      rangeError = validation.message;
    }

    if (!currentHasAnswer && !localScore) {
      return { color: "danger" as const, text: "Missing answer and score" };
    }
    if (!currentHasAnswer) {
      return { color: "warning" as const, text: "Missing answer" };
    }
    if (!isValidRange) {
      return { color: "danger" as const, text: rangeError || "Invalid range" };
    }
    if (!localScore) {
      return { color: "warning" as const, text: "Missing score" };
    }
    if (isValidated) {
      return { color: "success" as const, text: "Valid" };
    }
    return { color: "default" as const, text: "Needs validation" };
  }, [
    content.type,
    localAnswer,
    localScore,
    isValidated,
    hasAnswerValue,
    validateRangeDate,
    validateRangeNumber,
  ]);

  return (
    <div className="w-full space-y-4 p-4 bg-white dark:bg-gray-700 rounded-lg border">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Solution Settings</h3>
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
      </div>

      {/* Conditional question info */}
      {isConditionalQuestion && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800 font-medium">
            📋 Conditional Question
          </p>
          <p className="text-xs text-blue-600 mt-1">
            This question appears only when a specific answer is selected in its
            parent question. You can still assign scores and answer keys - they
            will be used when the condition is met.
          </p>
        </div>
      )}

      {/* Content based on question type */}
      {content.type === QuestionType.Text ? (
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            This is a display text question. No scoring or answer key required.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Score Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Score</label>
            <Input
              type="number"
              label="Score"
              placeholder="Enter score points"
              value={scoreInputValue}
              onFocus={() => {
                if (errorMess) setErrorMess(undefined);
                setScoreBeforeEdit(localScore);
              }}
              onChange={(e) => {
                const inputValue = e.target.value;
                setScoreInputValue(inputValue);

                if (inputValue === "" || inputValue === "0") {
                  handleScoreChange(0);
                  return;
                }

                const numValue = parseFloat(inputValue);
                if (!isNaN(numValue) && numValue >= 0) {
                  const newScore = Math.floor(numValue);
                  handleScoreChange(newScore);
                }
              }}
              onBlur={() => {
                handleScoreSave(localScore);
                handleTotalScoreUpdate(localScore);
              }}
              variant={isDark ? "flat" : "bordered"}
              min={0}
              max={parentScore}
              startContent={<span className="text-sm text-gray-500">pts</span>}
              isInvalid={!!errorMess}
              errorMessage={errorMess}
            />
            {isConditionalQuestion && parentScore !== undefined && (
              <p className="text-xs text-blue-600">
                Maximum score for this conditional question: {parentScore} pts
              </p>
            )}
          </div>

          {/* Answer Key Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Answer Key</label>
            {renderAnswerInput}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-end items-center pt-2 border-t">
        <div className="text-sm text-gray-500">
          {content.type === QuestionType.Text ? (
            "Display text only"
          ) : (
            <>
              {hasAnswerValue(localAnswer as ContentAnswerType)
                ? "✓ Has answer"
                : "⚠ No answer"}
              {" | "}
              {localScore > 0 ? `${localScore} pts` : "0 pts"}
              {isConditionalQuestion && (
                <span className="ml-2 text-blue-600">| 🔗 Conditional</span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SolutionInput;
