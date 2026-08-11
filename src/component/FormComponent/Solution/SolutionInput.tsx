import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
  memo,
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

/* -------------------------------- Utilities ------------------------------- */
export interface SolutionInputProps {
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

interface ScoreValidationResult {
  score?: number;
  errorMessage?: string;
}

function hasAnswerValue(answer: ContentAnswerType): boolean {
  if (answer === "" || answer === null || answer === undefined) return false;
  if (Array.isArray(answer)) return answer.length > 0;
  if (typeof answer === "object" && "start" in answer && "end" in answer) {
    return answer.start !== undefined && answer.end !== undefined;
  }
  return true;
}

function safeParseDateValue(dateString: string): DateValue | null {
  try {
    if (!dateString || typeof dateString !== "string") return null;
    return parseAbsoluteToLocal(dateString);
  } catch (error) {
    console.error("Error parsing date value:", error, dateString);
    return null;
  }
}

function validateScoreInput(
  inputValue: number,
  opts: {
    parentScore?: number;
    childSiblingScore?: number;
    parentUseChildSum?: boolean;
    isBonusScore?: boolean;
  },
): ScoreValidationResult {
  if (inputValue < 0 || isNaN(inputValue)) return { score: 0 };

  const { parentScore, childSiblingScore, parentUseChildSum, isBonusScore } =
    opts;

  if (parentUseChildSum && parentScore !== undefined && !isBonusScore) {
    const remaining = parentScore - (childSiblingScore ?? 0);
    if (inputValue > remaining) {
      return {
        score: undefined,
        errorMessage: `Score exceeds remaining (${remaining} pts available)`,
      };
    }
    return { score: Math.floor(inputValue) };
  }

  if (!parentUseChildSum && parentScore !== undefined && !isBonusScore) {
    if (inputValue > parentScore) {
      return {
        score: undefined,
        errorMessage: `Score exceeds max score (${parentScore} pts)`,
      };
    }
  }

  return { score: Math.floor(inputValue) };
}

interface CheckboxGroupInputProps {
  options: Array<{ content?: string }>;
  localAnswer?: LocalAnswerType;
  keyPrefix: string;
  onAnswerChange: (answer: ContentAnswerType) => void;
}

const CheckboxGroupInput = memo(
  ({
    options,
    localAnswer,
    keyPrefix,
    onAnswerChange,
  }: CheckboxGroupInputProps) => (
    <div className="space-y-2">
      <p className="text-sm font-medium">Select correct answer(s):</p>
      <div className="space-y-2 flex flex-col gap-y-5 dark:bg-gray-600 p-2">
        {options.map((option, index) => (
          <Checkbox
            key={`${keyPrefix}-${index}`}
            size="lg"
            isSelected={
              Array.isArray(localAnswer) &&
              (localAnswer as number[]).includes(index)
            }
            onValueChange={(checked) => {
              const current = Array.isArray(localAnswer)
                ? (localAnswer as number[])
                : [];
              const next: number[] = checked
                ? [...current, index]
                : current.filter((i) => i !== index);
              onAnswerChange(next as ContentAnswerType);
            }}
            aria-label={`${option.content ?? `Option ${index + 1}`}`}
            color="warning"
          >
            {option.content || `Option ${index + 1}`}
          </Checkbox>
        ))}
      </div>
    </div>
  ),
);
CheckboxGroupInput.displayName = "CheckboxGroupInput";

// ---------------------------------------------------------------------------

interface RadioGroupInputProps {
  options: Array<{ content?: string }>;
  localAnswer?: LocalAnswerType;
  keyPrefix: string;
  color?: "warning" | "default";
  onAnswerChange: (answer: ContentAnswerType) => void;
}

const RadioGroupInput = memo(
  ({
    options,
    localAnswer,
    keyPrefix,
    color = "warning",
    onAnswerChange,
  }: RadioGroupInputProps) => (
    <div
      className={`space-y-2 ${color === "default" ? "dark:bg-gray-500 dark:p-2" : "dark:bg-gray-600 dark:p-2"}`}
    >
      <p className="text-sm font-medium">Select correct answer:</p>
      <RadioGroup
        value={localAnswer !== undefined ? String(localAnswer) : undefined}
        onValueChange={(value) => onAnswerChange(Number(value))}
        className="flex flex-col gap-2"
        color={color}
      >
        {options.map((option, index) => (
          <Radio key={`${keyPrefix}-${index}`} value={String(index)}>
            {option.content || `Option ${index + 1}`}
          </Radio>
        ))}
      </RadioGroup>
    </div>
  ),
);
RadioGroupInput.displayName = "RadioGroupInput";

// ---------------------------------------------------------------------------

interface RangeDateInputProps {
  localAnswer?: LocalAnswerType;
  rangedate?: ContentType["rangedate"];
  onAnswerChange: (answer: ContentAnswerType) => void;
}

const RangeDateInput = memo(
  ({ localAnswer, rangedate, onAnswerChange }: RangeDateInputProps) => {
    const answer = { ...((localAnswer ?? {}) as RangeType<string>) };
    const currentRange = {
      start: safeParseDateValue(answer.start),
      end: safeParseDateValue(answer.end),
    };

    let questionRangeDisplay: RangeValue<DateValue> | null = null;
    if (rangedate?.start && rangedate?.end) {
      const start = safeParseDateValue(rangedate.start);
      const end = safeParseDateValue(rangedate.end);
      if (start && end) questionRangeDisplay = { start, end };
    }

    const validation = validateRangeDateValues(currentRange, rangedate);

    return (
      <div className="space-y-3">
        <p className="text-sm font-medium">Set correct date range:</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-2">
          <DatePicker
            label="Start Date"
            value={currentRange.start as never}
            granularity="day"
            minValue={questionRangeDisplay?.start}
            maxValue={questionRangeDisplay?.end}
            onChange={(dateValue) => {
              if (!dateValue) return;
              const newRange: RangeType<string | null> = {
                start: convertDateValueToString(dateValue as DateValue),
                end: currentRange.end
                  ? convertDateValueToString(currentRange.end as DateValue)
                  : null,
              };
              onAnswerChange(newRange);
            }}
            variant="bordered"
            size="sm"
            isInvalid={!validation.isValid}
          />
          <span className="text-gray-400 text-center sm:mt-2">to</span>
          <DatePicker
            label="End Date"
            granularity="day"
            value={currentRange.end as never}
            minValue={questionRangeDisplay?.start}
            maxValue={questionRangeDisplay?.end}
            onChange={(dateValue) => {
              if (!dateValue) return;
              const newRange: RangeType<string | null> = {
                start: currentRange.start
                  ? convertDateValueToString(currentRange.start)
                  : null,
                end: convertDateValueToString(dateValue as DateValue),
              };
              onAnswerChange(newRange);
            }}
            variant="bordered"
            size="sm"
            isInvalid={!validation.isValid}
            errorMessage={validation.message}
          />
        </div>
      </div>
    );
  },
);
RangeDateInput.displayName = "RangeDateInput";

// ---------------------------------------------------------------------------

interface RangeNumberInputProps {
  localAnswer?: LocalAnswerType;
  rangenumber?: ContentType["rangenumber"];
  onAnswerChange: (answer: ContentAnswerType) => void;
}

const RangeNumberInput = memo(
  ({ localAnswer, rangenumber, onAnswerChange }: RangeNumberInputProps) => {
    const currentRange = (localAnswer as unknown as RangeType<number>) || {
      start: 0,
      end: 0,
    };
    const validation = validateRangeNumberValues(currentRange, rangenumber);

    return (
      <div className="space-y-3">
        <p className="text-sm font-medium">Set correct number range:</p>
        {rangenumber && (
          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
            Question allows range: {rangenumber.start} to {rangenumber.end}
          </div>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-2">
          <NumberInput
            label="Min Value"
            placeholder="Minimum"
            value={currentRange.start}
            onValueChange={(value) =>
              onAnswerChange({ start: value ?? 0, end: currentRange.end ?? 0 })
            }
            variant="bordered"
            size="sm"
            isInvalid={!validation.isValid}
          />
          <span className="text-gray-400 text-center sm:mt-2">to</span>
          <NumberInput
            label="Max Value"
            placeholder="Maximum"
            value={currentRange.end}
            onValueChange={(value) =>
              onAnswerChange({
                start: currentRange.start ?? 0,
                end: value ?? 0,
              })
            }
            variant="bordered"
            size="sm"
            isInvalid={!validation.isValid}
            errorMessage={validation.message}
          />
        </div>
      </div>
    );
  },
);
RangeNumberInput.displayName = "RangeNumberInput";

// ---------------------------------------------------------------------------
// Range validation helpers (pure, outside components for stable references)
// ---------------------------------------------------------------------------

function validateRangeDateValues(
  range: { start: DateValue | null; end: DateValue | null },
  questionRange?: ContentType["rangedate"],
): { isValid: boolean; message: string } {
  if (!range.start || !range.end) {
    return { isValid: false, message: "Both start and end dates are required" };
  }
  if (range.start.compare(range.end) === 0) {
    return {
      isValid: false,
      message: "Start date and end date cannot be the same",
    };
  }
  if (range.end.compare(range.start) < 0) {
    return { isValid: false, message: "End date must be after start date" };
  }
  if (questionRange?.start && questionRange?.end) {
    try {
      const qStart = safeParseDateValue(questionRange.start);
      const qEnd = safeParseDateValue(questionRange.end);
      if (
        qStart &&
        qEnd &&
        (range.start.compare(qStart) < 0 ||
          range.end.compare(qEnd) > 0 ||
          range.start.compare(qEnd) > 0 ||
          range.end.compare(qStart) < 0)
      ) {
        return {
          isValid: false,
          message: "Solution must be within question range",
        };
      }
    } catch (error) {
      console.error("Error validating range date:", error);
    }
  }
  return { isValid: true, message: "" };
}

function validateRangeNumberValues(
  range: RangeType<number>,
  questionRange?: ContentType["rangenumber"],
): { isValid: boolean; message: string } {
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
    questionRange &&
    typeof questionRange.start === "number" &&
    typeof questionRange.end === "number" &&
    (range.start < questionRange.start || range.end > questionRange.end)
  ) {
    return {
      isValid: false,
      message: `Solution range must be within ${questionRange.start} to ${questionRange.end}`,
    };
  }
  return { isValid: true, message: "" };
}

/* ----------------------------- Main Component ----------------------------- */

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
  const initialBackendScoreRef = useRef<number | undefined>(content.score);

  const [localAnswer, setLocalAnswer] = useState<LocalAnswerType>();
  const [warningMessage, setWarningMessage] = useState<string | undefined>(
    isChildHasScore ? undefined : "",
  );
  const [isBonusScoreEnabled, setIsBonusScoreEnabled] = useState<
    boolean | undefined
  >(isBonusScore);
  const [isChildScoreSumMode, setIsChildScoreSumMode] = useState<boolean>(
    content.useChildScoreSum ?? false,
  );
  const [scoreInputValue, setScoreInputValue] = useState<number>(
    content.score ?? 0,
  );
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const isConditionalQuestion = !!content.parentcontent;

  useEffect(() => {
    // content.answer can be AnswerKey | AnswerKeyPairValueType | AnswerKeyPairValueType[]
    // Only AnswerKey carries an `.answer` field — guard before accessing it.
    const raw = content.answer;
    const newAnswer =
      raw && !Array.isArray(raw) && "answer" in raw
        ? (raw as AnswerKey).answer
        : undefined;

    if (newAnswer === previousAnswerRef.current) return;
    previousAnswerRef.current = newAnswer;
    setLocalAnswer(newAnswer);
  }, [content.answer, content.type]);

  useEffect(() => {
    const newScore = content.score ?? 0;
    if (newScore === previousScoreRef.current) return;
    previousScoreRef.current = newScore;
    setScoreInputValue(newScore);
  }, [content.score]);

  useEffect(() => {
    if (previousParentScoreRef.current === parentScore) return;
    previousParentScoreRef.current = parentScore;
    setErrorMessage(undefined);
    if (!isConditionalQuestion || isBonusScore) return;
    setScoreInputValue(0);
    previousScoreRef.current = 0;
    onUpdateContent({ score: 0 });
  }, [parentScore, isConditionalQuestion, isBonusScore, onUpdateContent]);

  const handleAnswerChange = useCallback(
    (answer?: ContentAnswerType) => {
      try {
        setLocalAnswer(answer);
        const answerUpdate: AnswerKey | undefined =
          answer !== undefined && answer !== null
            ? ({ ...(content.answer || {}), answer } as AnswerKey)
            : undefined;
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

  const handleSetBonusScore = useCallback(
    (val: boolean) => {
      setIsBonusScoreEnabled(val);
      onUpdateContent({ isBonusScore: val });
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
      setErrorMessage(undefined);
      if (finalScore !== content.score) {
        onUpdateContent({ score: finalScore });
      }
      previousScoreRef.current = finalScore;
    },
    [content.score, onUpdateContent],
  );

  const handleScoreChange = useCallback(
    (inputValue: number) => {
      const result = validateScoreInput(inputValue, {
        parentScore,
        childSiblingScore,
        parentUseChildSum,
        isBonusScore,
      });

      if (result.errorMessage) {
        setScoreInputValue(Math.floor(inputValue));
        setErrorMessage(result.errorMessage);
        return;
      }

      const newScore = result.score ?? 0;
      setScoreInputValue(newScore);
      setErrorMessage(undefined);
      handleScoreSave(newScore);
    },
    [
      parentScore,
      childSiblingScore,
      parentUseChildSum,
      isBonusScore,
      handleScoreSave,
    ],
  );

  const handleScoreBlur = useCallback(() => {
    if (warningMessage) setWarningMessage("");

    const maxAllowed =
      parentScore !== undefined && !isBonusScore
        ? parentUseChildSum
          ? parentScore - (childSiblingScore ?? 0)
          : parentScore
        : undefined;

    if (maxAllowed !== undefined && scoreInputValue > maxAllowed) {
      const revert = initialBackendScoreRef.current;
      const safeRevert =
        revert !== undefined && revert >= 0 && revert <= maxAllowed
          ? revert
          : 0;
      setScoreInputValue(safeRevert);
      handleScoreSave(safeRevert);
      setErrorMessage(undefined);
    }
  }, [
    warningMessage,
    parentScore,
    isBonusScore,
    parentUseChildSum,
    childSiblingScore,
    scoreInputValue,
    handleScoreSave,
  ]);

  const handleScoreFocus = useCallback(() => {
    if (errorMessage) setErrorMessage(undefined);
    if (isChildHasScore) setWarningMessage("Child Score Will Reset");
  }, [errorMessage, isChildHasScore]);

  // --- Derived state -------------------------------------------------------

  const validationStatus = useMemo(() => {
    if (content.type === QuestionType.Text) {
      return { color: "success" as const, text: "Display text" };
    }

    const hasAnswer = hasAnswerValue(localAnswer as ContentAnswerType);

    let isValidRange = true;
    let rangeError = "";

    if (content.type === QuestionType.RangeDate && localAnswer) {
      const answer = { ...((localAnswer ?? {}) as RangeType<string>) };
      const result = validateRangeDateValues(
        {
          start: safeParseDateValue(answer.start),
          end: safeParseDateValue(answer.end),
        },
        content.rangedate,
      );
      isValidRange = result.isValid;
      rangeError = result.message;
    }

    if (content.type === QuestionType.RangeNumber && localAnswer) {
      const result = validateRangeNumberValues(
        localAnswer as RangeType<number>,
        content.rangenumber,
      );
      isValidRange = result.isValid;
      rangeError = result.message;
    }

    if (!hasAnswer && !scoreInputValue) {
      return { color: "warning" as const, text: "Missing answer and score" };
    }
    if (!hasAnswer) {
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
    content.rangedate,
    content.rangenumber,
    localAnswer,
    scoreInputValue,
    isValidated,
  ]);

  // Remaining score for child-sum display
  const remainingScore = useMemo(() => {
    if (!parentUseChildSum || parentScore === undefined) return undefined;
    return Math.max(
      0,
      parentScore -
        (childSiblingScore ?? 0) -
        (errorMessage ? 0 : scoreInputValue),
    );
  }, [
    parentUseChildSum,
    parentScore,
    childSiblingScore,
    errorMessage,
    scoreInputValue,
  ]);

  const isScoreOverBudget =
    remainingScore !== undefined &&
    parentScore !== undefined &&
    parentScore - (childSiblingScore ?? 0) - scoreInputValue < 0;

  // --- Render answer input --------------------------------------------------

  const renderAnswerInput = useMemo(() => {
    switch (content.type) {
      case QuestionType.Text:
        return (
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              Display text questions don&apos;t require answer keys.
            </p>
          </div>
        );

      case QuestionType.MultipleChoice:
        return (
          <RadioGroupInput
            options={content.multiple ?? []}
            localAnswer={localAnswer}
            keyPrefix="mc"
            color="warning"
            onAnswerChange={handleAnswerChange}
          />
        );

      case QuestionType.Selection:
        return (
          <RadioGroupInput
            options={content.selection ?? []}
            localAnswer={localAnswer}
            keyPrefix="sel"
            color="default"
            onAnswerChange={handleAnswerChange}
          />
        );

      case QuestionType.CheckBox:
        return (
          <CheckboxGroupInput
            options={content.checkbox ?? []}
            localAnswer={localAnswer}
            keyPrefix="cb"
            onAnswerChange={handleAnswerChange}
          />
        );

      case QuestionType.MultipleSelection:
        return (
          <CheckboxGroupInput
            options={content.selection ?? []}
            localAnswer={localAnswer}
            keyPrefix="msel"
            onAnswerChange={handleAnswerChange}
          />
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

      case QuestionType.Date:
        return (
          <DatePicker
            label="Date"
            value={safeParseDateValue(localAnswer as string) as never}
            granularity="day"
            onChange={(dateValue) => {
              if (dateValue) {
                handleAnswerChange(
                  convertDateValueToString(dateValue as DateValue),
                );
              }
            }}
            variant="bordered"
            size="lg"
          />
        );

      case QuestionType.RangeDate:
        return (
          <RangeDateInput
            localAnswer={localAnswer}
            rangedate={content.rangedate}
            onAnswerChange={handleAnswerChange}
          />
        );

      case QuestionType.RangeNumber:
        return (
          <RangeNumberInput
            localAnswer={localAnswer}
            rangenumber={content.rangenumber}
            onAnswerChange={handleAnswerChange}
          />
        );

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
  ]);

  const isDistributedScoreAvailable =
    content.type === QuestionType.CheckBox ||
    content.type === QuestionType.MultipleSelection;

  // --- Render --------------------------------------------------------------

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

      {/* Conditional question notice */}
      {isConditionalQuestion && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800 font-medium">
            Conditional Question
          </p>
          <p className="text-xs text-blue-600 mt-1">
            This question appears only when a specific answer is selected in its
            parent question. You can still assign scores and answer keys — they
            will be used when the condition is met.
          </p>
        </div>
      )}

      {content.type === QuestionType.Text ? (
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            This is a display text question. No scoring or answer key required.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Score</label>
            <NumberInput
              type="number"
              label="Score"
              placeholder="Enter score points"
              value={scoreInputValue}
              onFocus={handleScoreFocus}
              onValueChange={handleScoreChange}
              onBlur={handleScoreBlur}
              variant={isDark ? "flat" : "bordered"}
              min={0}
              max={parentScore}
              startContent={<span className="text-sm text-gray-500">pts</span>}
              isInvalid={!!errorMessage}
              errorMessage={errorMessage}
            />

            {/* Score remain indicator */}
            {parentUseChildSum &&
              isConditionalQuestion &&
              parentScore !== undefined &&
              !isBonusScore && (
                <p
                  className={`text-xs font-medium ${
                    isScoreOverBudget ? "text-red-500" : "text-gray-500"
                  }`}
                >
                  Remaining: {remainingScore} / {parentScore} pts
                </p>
              )}

            {!parentUseChildSum &&
              isConditionalQuestion &&
              parentScore !== undefined &&
              !isBonusScore && (
                <p className="text-xs text-gray-500">Max: {parentScore} pts</p>
              )}

            {warningMessage && (
              <p className="text-xs font-bold text-red-400">{warningMessage}</p>
            )}
          </div>

          {/* Answer key input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Answer Key</label>
            {renderAnswerInput}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex flex-col gap-3 pt-3 border-t">
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

        {/* Toggle settings */}
        {content.type !== QuestionType.Text && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-600 divide-y divide-gray-200 dark:divide-gray-600 overflow-hidden">
            {/* Bonus score toggle */}
            <div
              className={`flex items-center justify-between px-4 py-3 ${
                content.parentcontent ? "cursor-not-allowed opacity-50" : ""
              }`}
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium">Bonus Score</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Set question as bonus score
                </span>
              </div>
              <Tooltip delay={0} content="Set question as extra">
                <Switch
                  size="sm"
                  isSelected={isBonusScoreEnabled}
                  onValueChange={handleSetBonusScore}
                  isDisabled={!!content.parentcontent}
                />
              </Tooltip>
            </div>

            {/* Distributed score toggle */}
            <div
              className={`flex items-center justify-between px-4 py-3 ${
                !isDistributedScoreAvailable
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
                    : !isDistributedScoreAvailable
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
                    !isDistributedScoreAvailable
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

export default memo(SolutionInput);
