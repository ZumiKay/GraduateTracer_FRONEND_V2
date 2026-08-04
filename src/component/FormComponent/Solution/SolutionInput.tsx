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
  Switch,
  Tooltip,
} from "@heroui/react";
import { useSelector } from "react-redux";
import {
  AnswerKey,
  ContentType,
  QuestionType,
  RangeType,
} from "../../../types/Form.types";
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
  isBonusScore?: boolean;
  isChildHasScore?: boolean;
  childSiblingScore?: number;
  parentUseChildSum?: boolean;
}

type LocalAnswerType = ContentAnswerType | DateValue | RangeType<DateValue>;

const SolutionInput: React.FC<SolutionInputProps> = ({
  content,
  onUpdateContent,
  isValidated = false,
  parentScore,
  isBonusScore,
  isChildHasScore,
  childSiblingScore,
  parentUseChildSum,
}) => {
  const isDark = useSelector((root: RootState) => root.globalindex.darkmode);
  const previousAnswerRef = useRef<ContentAnswerType | undefined>(undefined);
  const previousScoreRef = useRef<number>(content.score ?? 0);
  const previousParentScoreRef = useRef<number | undefined>(parentScore);
  // Track the initial backend score for reverting on blur when exceeding max
  const initialBackendScoreRef = useRef<number | undefined>(content.score);

  // State management
  const [localAnswer, setLocalAnswer] = useState<LocalAnswerType>();
  const [warningMess, setwarningMess] = useState<string | undefined>(
    isChildHasScore ? undefined : "",
  );
  const [isExtraScore, setisBonusScore] = useState<boolean | undefined>(
    isBonusScore,
  );
  const [isChildScoreSumMode, setIsChildScoreSumMode] = useState<boolean>(
    content.useChildScoreSum ?? false,
  );
  const [scoreInputValue, setScoreInputValue] = useState<number>(
    content.score ?? 0,
  );
  const [errorMess, setErrorMess] = useState<string>();

  const isConditionalQuestion = !!content.parentcontent;

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
    [],
  );

  const hasAnswerValue = useCallback((answer: ContentAnswerType): boolean => {
    if (answer === "" || answer === null || answer === undefined) {
      return false;
    }

    if (Array.isArray(answer)) {
      return answer.length > 0;
    }

    if (typeof answer === "object" && answer !== null) {
      if ("start" in answer && "end" in answer) {
        return answer.start !== undefined && answer.end !== undefined;
      }
    }

    return true;
  }, []);

  useEffect(() => {
    const newAnswer = (content.answer as AnswerKey)?.answer;

    if (newAnswer === previousAnswerRef.current) {
      return;
    }
    previousAnswerRef.current = newAnswer;

    setLocalAnswer(newAnswer);
  }, [content.answer, content.type]);

  useEffect(() => {
    const newScore = content.score ?? 0;

    if (newScore === previousScoreRef.current) {
      return;
    }
    previousScoreRef.current = newScore;
    setScoreInputValue(newScore);
  }, [content.score]);

  useEffect(() => {
    if (previousParentScoreRef.current === parentScore) return;
    previousParentScoreRef.current = parentScore;

    setErrorMess(undefined);

    if (!isConditionalQuestion || isBonusScore) return;

    setScoreInputValue(0);
    previousScoreRef.current = 0;
    onUpdateContent({ score: 0 });
  }, [parentScore, isConditionalQuestion, isBonusScore, onUpdateContent]);

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
      } catch (error) {
        console.error("Error handling answer change:", error);
        ErrorToast({
          title: "Error",
          content: "Failed to update answer. Please try again.",
        });
      }
    },
    [content.answer, onUpdateContent],
  );

  const handleSetExtraScore = useCallback(
    (val: boolean) => {
      onUpdateContent({ isBonusScore: val });
      setisBonusScore(val);
    },
    [onUpdateContent],
  );

  const handleChangeChildScoreSumMode = useCallback(
    (val: boolean) => {
      setIsChildScoreSumMode(val);
      onUpdateContent({ useChildScoreSum: val });
    },
    [onUpdateContent],
  );

  const handleScoreSave = useCallback(
    (finalScore: number) => {
      setErrorMess(undefined);

      // Skip this legacy check for useChildScoreSum children —
      // their validation is handled in onValueChange/onBlur instead.
      if (
        !parentUseChildSum &&
        !isBonusScore &&
        parentScore !== undefined &&
        finalScore > parentScore
      ) {
        setErrorMess("Max Score Exceed");
        return;
      }

      if (finalScore !== content.score) {
        onUpdateContent({ score: finalScore });
      }

      previousScoreRef.current = finalScore;
    },
    [
      content.score,
      isBonusScore,
      onUpdateContent,
      parentScore,
      parentUseChildSum,
    ],
  );

  const handleParentWarning = useCallback(() => {
    if (!isChildHasScore) return;

    setwarningMess("Child Score Will Reset");
  }, [isChildHasScore]);

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

      if (range.start.compare(range.end) === 0) {
        return {
          isValid: false,
          message: "Start date and end date cannot be the same",
        };
      }

      if (range.end.compare(range.start) < 0) {
        return {
          isValid: false,
          message: "End date must be after start date",
        };
      }

      if (content.rangedate?.start && content.rangedate?.end) {
        try {
          const questionStart = safeParseDateValue(content.rangedate.start);
          const questionEnd = safeParseDateValue(content.rangedate.end);

          if (questionStart && questionEnd) {
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
    [content.rangedate, safeParseDateValue],
  );

  const validateRangeNumber = useCallback(
    (range: RangeType<number>): { isValid: boolean; message: string } => {
      if (range.start === undefined || range.end === undefined) {
        return {
          isValid: false,
          message: "Both start and end values are required",
        };
      }

      if (range.end < range.start) {
        return {
          isValid: false,
          message: "End value must be greater than or equal to start value",
        };
      }

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
    [content.rangenumber],
  );

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
            <div className="space-y-2 flex flex-col gap-y-5 dark:bg-gray-600 p-2">
              {content.checkbox?.map((option, index) => (
                <Checkbox
                  key={`cb-${index}`}
                  size="lg"
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
                  dateValue as DateValue,
                );
                handleAnswerChange(dateString);
              }
            }}
            variant="bordered"
            size="lg"
          />
        );
      }

      case QuestionType.MultipleSelection:
        return (
          <div className="space-y-2">
            <p className="text-sm font-medium">Select correct answer(s):</p>
            <div className="space-y-2 flex flex-col gap-y-5 dark:bg-gray-600 p-2">
              {content.selection?.map((option, index) => (
                <Checkbox
                  key={`msel-${index}`}
                  size="lg"
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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-2">
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
                            currentRange.end as DateValue,
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
              <span className="text-gray-400 text-center sm:mt-2">to</span>
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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-2">
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
              <span className="text-gray-400 text-center sm:mt-2">to</span>
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

    if (!currentHasAnswer && !scoreInputValue) {
      return { color: "warning" as const, text: "Missing answer and score" };
    }
    if (!currentHasAnswer) {
      return { color: "warning" as const, text: "Missing answer" };
    }
    if (!isValidRange) {
      return { color: "danger" as const, text: rangeError || "Invalid range" };
    }

    if (isValidated) {
      return { color: "success" as const, text: "Valid" };
    }
    return { color: "default" as const, text: "Needs validation" };
  }, [
    content.type,
    hasAnswerValue,
    localAnswer,
    scoreInputValue,
    isValidated,
    validateRangeDate,
    validateRangeNumber,
  ]);

  return (
    <div className="w-full space-y-4 p-4 bg-white dark:bg-gray-700 rounded-lg border">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
        <h3 className="text-base sm:text-lg font-medium">Solution Settings</h3>
        <div className="flex flex-wrap items-center gap-2">
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
            Conditional Question
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
            <NumberInput
              type="number"
              label="Score"
              placeholder="Enter score points"
              value={scoreInputValue}
              onFocus={() => {
                if (errorMess) setErrorMess(undefined);
                handleParentWarning();
              }}
              onValueChange={(e) => {
                const inputValue = e;

                if (inputValue < 0 || isNaN(inputValue)) {
                  setScoreInputValue(0);
                  handleScoreSave(0);
                  return;
                }

                if (inputValue >= 0) {
                  if (
                    parentUseChildSum &&
                    parentScore !== undefined &&
                    !isBonusScore
                  ) {
                    const remainingForSelf =
                      parentScore - (childSiblingScore ?? 0);
                    if (inputValue > remainingForSelf) {
                      setScoreInputValue(Math.floor(inputValue));
                      setErrorMess(
                        `Score exceeds remaining (${remainingForSelf} pts available)`,
                      );
                      return;
                    }
                    // Valid value for useChildScoreSum — save directly
                    const newScore = Math.floor(inputValue);
                    setScoreInputValue(newScore);
                    setErrorMess(undefined);
                    handleScoreSave(newScore);
                    return;
                  }

                  if (
                    !parentUseChildSum &&
                    parentScore !== undefined &&
                    !isBonusScore
                  ) {
                    if (inputValue > parentScore) {
                      setScoreInputValue(Math.floor(inputValue));
                      setErrorMess(
                        `Score exceeds max score (${parentScore} pts)`,
                      );
                      return;
                    }
                  }

                  const newScore = Math.floor(inputValue);
                  setScoreInputValue(newScore);
                  setErrorMess(undefined);
                  handleScoreSave(newScore);
                }
              }}
              onBlur={() => {
                if (warningMess) setwarningMess("");

                const maxAllowed =
                  parentScore !== undefined && !isBonusScore
                    ? parentUseChildSum
                      ? parentScore - (childSiblingScore ?? 0)
                      : parentScore
                    : undefined;

                if (maxAllowed !== undefined && scoreInputValue > maxAllowed) {
                  const revertScore = initialBackendScoreRef.current;
                  if (
                    revertScore !== undefined &&
                    revertScore >= 0 &&
                    revertScore <= maxAllowed
                  ) {
                    setScoreInputValue(revertScore);
                    handleScoreSave(revertScore);
                  } else {
                    setScoreInputValue(0);
                    handleScoreSave(0);
                  }
                  setErrorMess(undefined);
                }
              }}
              variant={isDark ? "flat" : "bordered"}
              min={0}
              max={parentScore}
              startContent={<span className="text-sm text-gray-500">pts</span>}
              isInvalid={!!errorMess}
              errorMessage={errorMess}
            />
            {parentUseChildSum &&
              isConditionalQuestion &&
              parentScore !== undefined &&
              !isBonusScore && (
                <p
                  className={`text-xs font-medium ${
                    parentScore - (childSiblingScore ?? 0) - scoreInputValue < 0
                      ? "text-red-500"
                      : "text-gray-500"
                  }`}
                >
                  Remaining :{" "}
                  {Math.max(
                    0,
                    parentScore -
                      (childSiblingScore ?? 0) -
                      (errorMess ? 0 : scoreInputValue),
                  )}{" "}
                  / {parentScore} pts
                </p>
              )}

            {!parentUseChildSum &&
              isConditionalQuestion &&
              parentScore !== undefined &&
              !isBonusScore && (
                <p className="text-xs text-gray-500">Max : {parentScore} pts</p>
              )}

            {warningMess && (
              <p className="text-xs font-bold text-red-400">{warningMess}</p>
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
      <div className="flex flex-col gap-3 pt-3 border-t">
        {/* Summary line */}
        <p className="text-xs text-gray-400 text-center">
          {content.type === QuestionType.Text ? (
            "Display text only"
          ) : (
            <>
              {hasAnswerValue(localAnswer as ContentAnswerType)
                ? "Has answer"
                : "No answer"}
              {" · "}
              {scoreInputValue > 0 ? `${scoreInputValue} pts` : "0 pts"}
              {isConditionalQuestion && (
                <span className="ml-1 text-blue-500">· 🔗 Conditional</span>
              )}
              {" · "}
              {content.isBonusScore && "Bonus Score"}
            </>
          )}
        </p>

        {content.type !== QuestionType.Text && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-600 divide-y divide-gray-200 dark:divide-gray-600 overflow-hidden">
            <div
              className={`flex items-center justify-between px-4 py-3 ${content.parentcontent ? "cursor-not-allowed opacity-50" : ""}`}
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium">Bonus Score</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Set question as bonus score
                </span>
              </div>
              <Tooltip delay={0} content={"Set question as extra"}>
                <Switch
                  size="sm"
                  isSelected={isExtraScore}
                  onValueChange={handleSetExtraScore}
                  isDisabled={!!content.parentcontent}
                />
              </Tooltip>
            </div>

            <div
              className={`flex items-center justify-between px-4 py-3 ${
                content.type !== QuestionType.CheckBox &&
                content.type !== QuestionType.MultipleSelection
                  ? "opacity-40 cursor-not-allowed"
                  : ""
              }`}
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium">Distributed Score</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {isChildScoreSumMode && content.score && content.score > 0
                    ? `Children scores must sum to ${content.score} pts`
                    : "Sum of children scores must equal this score"}
                </span>
              </div>
              <Tooltip
                delay={0}
                content={
                  !content.conditional || content.conditional.length === 0
                    ? "Add conditional children to this question first"
                    : content.type !== QuestionType.CheckBox &&
                        content.type !== QuestionType.MultipleSelection
                      ? "Only available for CheckBox and Multiple Selection types"
                      : "When enabled, the sum of all children scores must equal this question's score"
                }
              >
                <Switch
                  size="sm"
                  isSelected={isChildScoreSumMode}
                  onValueChange={handleChangeChildScoreSumMode}
                  isDisabled={
                    !content.conditional ||
                    content.conditional.length === 0 ||
                    (content.type !== QuestionType.CheckBox &&
                      content.type !== QuestionType.MultipleSelection)
                  }
                />
              </Tooltip>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

SolutionInput.displayName = "SolutionInput";

export default React.memo(SolutionInput);
