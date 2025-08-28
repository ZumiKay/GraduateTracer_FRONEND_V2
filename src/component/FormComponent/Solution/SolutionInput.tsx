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
import {
  DateValue,
  CalendarDate,
  now,
  getLocalTimeZone,
} from "@internationalized/date";
import { RootState } from "../../../redux/store";
import { ErrorToast } from "../../Modal/AlertModal";

interface SolutionInputProps {
  content: ContentType;
  onUpdateContent: (updates: Partial<ContentType>) => void;
  isValidated?: boolean;
  parentScore?: number;
}

const SolutionInput: React.FC<SolutionInputProps> = ({
  content,
  onUpdateContent,
  isValidated = false,
  parentScore,
}) => {
  const formstate = useSelector((root: RootState) => root.allform.formstate);
  const dispatch = useDispatch();
  const previousAnswerRef = useRef<
    | string
    | number
    | number[]
    | Date
    | RangeType<Date>
    | RangeType<DateValue>
    | RangeType<number>
    | undefined
  >(undefined);

  const [localAnswer, setLocalAnswer] = useState<
    string | number | number[] | RangeType<DateValue> | RangeType<number>
  >(
    ((content.answer as AnswerKey)?.answer as string | number | number[]) ?? ""
  );

  const [localScore, setLocalScore] = useState<number>(content.score || 0);
  const [scoreInputValue, setScoreInputValue] = useState<string>(
    String(content.score || 0)
  );
  const [scoreBeforeEdit, setScoreBeforeEdit] = useState<number>(
    content.score || 0
  );
  const [errorMess, seterrorMess] = useState<string>();
  const isConditionalQuestion = !!content.parentcontent;

  //Insert new answer
  useEffect(() => {
    const newAnswer = (content.answer as AnswerKey)?.answer;

    if (newAnswer === previousAnswerRef.current) {
      return;
    }

    previousAnswerRef.current = newAnswer;

    if (content.type === QuestionType.RangeDate) {
      if (!newAnswer) {
        setLocalAnswer({
          start: now(getLocalTimeZone()),
          end: now(getLocalTimeZone()),
        });
      } else {
        const val = newAnswer as unknown as RangeValue<DateValue>;

        setLocalAnswer({
          start: new CalendarDate(
            val.start.year,
            val.start.month,
            val.start.day
          ),
          end: new CalendarDate(val.end.year, val.end.month, val.end.day),
        });
      }
    } else if (newAnswer !== undefined) {
      setLocalAnswer(
        newAnswer as
          | string
          | number
          | number[]
          | RangeType<DateValue>
          | RangeType<number>
      );
    }
  }, [content.answer, content.type]);

  const handleAnswerChange = useCallback(
    (
      answer:
        | string
        | number
        | number[]
        | RangeType<DateValue>
        | RangeType<number>
    ) => {
      setLocalAnswer(answer);
      const answerUpdate = {
        answer: { ...content.answer, answer },
        hasAnswer: true, // Mark as having an answer
      };
      onUpdateContent(answerUpdate);
      dispatch(setdisbounceQuestion({ ...content, ...answerUpdate }));
    },
    [content, onUpdateContent, dispatch]
  );

  const handleScoreChange = useCallback((score: number) => {
    setLocalScore(score);
  }, []);

  const handleScoreSave = useCallback(
    (finalScore: number) => {
      //Verify Child Score
      if (isConditionalQuestion && parentScore && parentScore > finalScore) {
        ErrorToast({ title: "Validation", content: "Wrong Score" });
        return;
      }

      if (finalScore !== content.score) {
        onUpdateContent({ score: finalScore });
      }
    },
    [content.score, isConditionalQuestion, onUpdateContent, parentScore]
  );

  const handleTotalScoreUpdate = useCallback(
    (newScore: number) => {
      const scoreDiff = newScore - scoreBeforeEdit;
      if (scoreDiff !== 0) {
        dispatch(
          setformstate({
            ...formstate,
            totalscore: (formstate.totalscore || 0) + scoreDiff,
          })
        );
        setScoreBeforeEdit(newScore);
      }
    },
    [scoreBeforeEdit, dispatch, formstate]
  );

  const renderAnswerInput = useMemo(() => {
    switch (content.type) {
      case QuestionType.Text:
        // Text type questions are just for display, no answer key needed
        return (
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              Display text questions don't require answer keys.
            </p>
          </div>
        );

      case QuestionType.MultipleChoice:
        return (
          <div className="space-y-2">
            <p className="text-sm font-medium">Select correct answer:</p>
            <RadioGroup
              value={String(localAnswer)}
              onValueChange={(value) => handleAnswerChange(Number(value))}
            >
              {content.multiple?.map((option, index) => (
                <Radio key={index} value={String(index)}>
                  {option.content}
                </Radio>
              ))}
            </RadioGroup>
          </div>
        );

      case QuestionType.CheckBox:
        return (
          <div className="space-y-2">
            <p className="text-sm font-medium">Select correct answer(s):</p>
            {content.checkbox?.map((option, index) => (
              <Checkbox
                key={index}
                isSelected={
                  Array.isArray(localAnswer) && localAnswer.includes(index)
                }
                onValueChange={(checked) => {
                  const currentAnswers = Array.isArray(localAnswer)
                    ? localAnswer
                    : [];
                  const newAnswers = checked
                    ? [...currentAnswers, index]
                    : currentAnswers.filter((idx) => idx !== index);
                  handleAnswerChange(newAnswers);
                }}
              >
                {option.content}
              </Checkbox>
            ))}
          </div>
        );

      case QuestionType.ShortAnswer:
      case QuestionType.Paragraph:
        return (
          <Input
            label="Correct Answer"
            placeholder="Enter the correct answer"
            value={String(localAnswer)}
            onChange={(e) => handleAnswerChange(e.target.value)}
            variant="bordered"
          />
        );

      case QuestionType.Number:
        return (
          <Input
            label="Correct Answer"
            placeholder="Enter the correct number"
            type="number"
            value={String(localAnswer)}
            onChange={(e) => handleAnswerChange(Number(e.target.value))}
            variant="bordered"
          />
        );

      case QuestionType.Date:
        return (
          <Input
            label="Correct Date"
            type="date"
            value={localAnswer ? String(localAnswer) : ""}
            onChange={(e) => handleAnswerChange(e.target.value)}
            variant="bordered"
          />
        );

      case QuestionType.Selection:
        return (
          <div className="space-y-2">
            <p className="text-sm font-medium">Select correct options:</p>
            {content.selection?.map((option, index) => (
              <Checkbox
                key={index}
                isSelected={
                  Array.isArray(localAnswer) && localAnswer.includes(index)
                }
                onValueChange={(checked) => {
                  const currentAnswers = Array.isArray(localAnswer)
                    ? localAnswer
                    : [];
                  const newAnswers = checked
                    ? [...currentAnswers, index]
                    : currentAnswers.filter((idx) => idx !== index);
                  handleAnswerChange(newAnswers);
                }}
              >
                {option.content}
              </Checkbox>
            ))}
          </div>
        );

      case QuestionType.RangeDate: {
        const value = content.rangedate;
        if (!value) return null;
        const questionRange: RangeValue<DateValue> = {
          start: new CalendarDate(
            value.start.year,
            value.start.month,
            value.start.day
          ),
          end: new CalendarDate(value.end.year, value.end.month, value.end.day),
        };
        const rawRange = localAnswer as RangeType<DateValue>;

        const currentRange = {
          start:
            rawRange?.start instanceof CalendarDate
              ? rawRange.start
              : new CalendarDate(2024, 1, 1),
          end:
            rawRange?.end instanceof CalendarDate
              ? rawRange.end
              : new CalendarDate(2024, 12, 31),
        };

        const isInvalidRange = currentRange.end.compare(currentRange.start) < 0;

        let isOutsideQuestionRange = false;
        let rangeValidationMessage = "";

        if (questionRange?.start && questionRange?.end) {
          const questionStart = questionRange.start;
          const questionEnd = questionRange.end;

          if (
            currentRange.start.compare(questionStart) < 0 ||
            currentRange.end.compare(questionEnd) > 0
          ) {
            isOutsideQuestionRange = true;
            rangeValidationMessage = `Solution range must be within question range: ${questionStart.toString()} to ${questionEnd.toString()}`;
          }
        }

        return (
          <div className="space-y-2">
            <p className="text-sm font-medium">Set correct date range:</p>
            {questionRange && (
              <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                Question allows range: {questionRange.start.toString()} to{" "}
                {questionRange.end.toString()}
              </div>
            )}
            <div className="flex gap-2 items-center">
              <DatePicker
                label="Start Date"
                value={currentRange.start}
                onChange={(dateValue) => {
                  if (dateValue) {
                    const newRange: RangeType<DateValue> = {
                      start: dateValue,
                      end: currentRange.end,
                    };
                    handleAnswerChange(newRange);
                  }
                }}
                variant="bordered"
                size="sm"
                isInvalid={isOutsideQuestionRange}
              />
              <span className="text-gray-400">to</span>
              <DatePicker
                label="End Date"
                value={currentRange.end}
                onChange={(dateValue) => {
                  if (dateValue) {
                    const newRange: RangeType<DateValue> = {
                      start: currentRange.start,
                      end: dateValue,
                    };
                    handleAnswerChange(newRange);
                  }
                }}
                variant="bordered"
                size="sm"
                isInvalid={isInvalidRange || isOutsideQuestionRange}
                errorMessage={
                  isInvalidRange
                    ? "End date must be after or equal to start date"
                    : isOutsideQuestionRange
                    ? rangeValidationMessage
                    : ""
                }
              />
            </div>
            {(isInvalidRange || isOutsideQuestionRange) && (
              <div className="space-y-1">
                {isInvalidRange && (
                  <p className="text-tiny text-danger">
                    Invalid date range: End date must be after or equal to start
                    date
                  </p>
                )}
                {isOutsideQuestionRange && (
                  <p className="text-tiny text-danger">
                    {rangeValidationMessage}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      }

      case QuestionType.RangeNumber: {
        const questionRange = content.rangenumber; // The range defined in question settings
        const currentRange = (localAnswer as RangeType<number>) || {
          start: 0,
          end: 0,
        };

        const isInvalidRange = currentRange.end < currentRange.start;

        let isOutsideQuestionRange = false;
        let rangeValidationMessage = "";

        if (
          questionRange &&
          typeof questionRange.start === "number" &&
          typeof questionRange.end === "number"
        ) {
          if (
            currentRange.start < questionRange.start ||
            currentRange.end > questionRange.end
          ) {
            isOutsideQuestionRange = true;
            rangeValidationMessage = `Solution range must be within question range: ${questionRange.start} to ${questionRange.end}`;
          }
        }

        return (
          <div className="space-y-2">
            <p className="text-sm font-medium">Set correct number range:</p>
            {questionRange && (
              <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                Question allows range: {questionRange.start} to{" "}
                {questionRange.end}
              </div>
            )}
            <div className="flex gap-2 items-center">
              <NumberInput
                label="Min Value"
                placeholder="Minimum"
                value={currentRange.start || 0}
                onValueChange={(value) => {
                  const newRange: RangeType<number> = {
                    start: value || 0,
                    end: currentRange.end || 0,
                  };
                  handleAnswerChange(newRange);
                }}
                variant="bordered"
                size="sm"
                isInvalid={isOutsideQuestionRange}
              />
              <span className="text-gray-400">to</span>
              <NumberInput
                label="Max Value"
                placeholder="Maximum"
                value={currentRange.end || 0}
                onValueChange={(value) => {
                  const newRange: RangeType<number> = {
                    start: currentRange.start || 0,
                    end: value || 0,
                  };
                  handleAnswerChange(newRange);
                }}
                variant="bordered"
                size="sm"
                isInvalid={isInvalidRange || isOutsideQuestionRange}
                errorMessage={
                  isInvalidRange
                    ? "End value must be greater than or equal to start value"
                    : isOutsideQuestionRange
                    ? rangeValidationMessage
                    : ""
                }
              />
            </div>
            {(isInvalidRange || isOutsideQuestionRange) && (
              <div className="space-y-1">
                {isInvalidRange && (
                  <p className="text-tiny text-danger">
                    Invalid range: End value must be greater than or equal to
                    start value
                  </p>
                )}
                {isOutsideQuestionRange && (
                  <p className="text-tiny text-danger">
                    {rangeValidationMessage}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      }

      default:
        return (
          <Input
            label="Answer"
            placeholder="Enter answer"
            value={String(localAnswer)}
            onChange={(e) => handleAnswerChange(e.target.value)}
            variant="bordered"
          />
        );
    }
  }, [content, localAnswer, handleAnswerChange]);

  const validationStatus = useMemo(() => {
    if (content.type === QuestionType.Text) {
      return { color: "success" as const, text: "Display text" };
    }

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
        const rawRange = localAnswer as RangeType<DateValue>;

        if (
          !(rawRange.start instanceof CalendarDate) ||
          !(rawRange.end instanceof CalendarDate)
        ) {
          return false;
        }

        const range = rawRange as RangeType<CalendarDate>;

        if (range.end.compare(range.start) < 0) return false;

        if (content.rangedate?.start && content.rangedate?.end) {
          const questionStart = content.rangedate.start;
          const questionEnd = content.rangedate.end;

          if (
            range.start.compare(questionStart) < 0 ||
            range.end.compare(questionEnd) > 0
          ) {
            return false;
          }
        }

        return true;
      }

      if (
        content.type === QuestionType.RangeNumber &&
        typeof localAnswer === "object" &&
        localAnswer !== null &&
        "start" in localAnswer &&
        "end" in localAnswer
      ) {
        const range = localAnswer as RangeType<number>;

        if (range.end < range.start) return false;

        if (
          content.rangenumber &&
          typeof content.rangenumber.start === "number" &&
          typeof content.rangenumber.end === "number"
        ) {
          if (
            range.start < content.rangenumber.start ||
            range.end > content.rangenumber.end
          ) {
            return false;
          }
        }
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
  }, [
    content.type,
    content?.rangedate?.start,
    content?.rangedate?.end,
    content?.rangenumber,
    localScore,
    isValidated,
    localAnswer,
  ]);

  return (
    <div className="w-full space-y-4 p-4 bg-white rounded-lg border">
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

      {/* Text type questions are just for display, no need for scoring */}
      {content.type === QuestionType.Text ? (
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              This is a display text question. No scoring or answer key
              required.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Score</label>
            <Input
              type="number"
              label="Score"
              placeholder="Enter score points"
              value={scoreInputValue}
              onFocus={() => {
                if (errorMess) seterrorMess(undefined);
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
              variant="bordered"
              min="0"
              max={parentScore}
              startContent={<span className="text-sm">pts</span>}
            />
            {errorMess && <p className="text-sm text-red-400">{errorMess}</p>}
            {isConditionalQuestion && (
              <p className="text-xs text-blue-600">
                ✓ Score input enabled for conditional questions
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Answer Key</label>
            {renderAnswerInput}
          </div>
        </div>
      )}

      <div className="flex justify-end items-center pt-2 border-t">
        <div className="text-sm text-gray-500">
          {content.type === QuestionType.Text ? (
            "Display text only"
          ) : (
            <>
              {(() => {
                const currentHasAnswer = (() => {
                  if (
                    localAnswer === "" ||
                    localAnswer === null ||
                    localAnswer === undefined
                  ) {
                    return false;
                  }

                  if (Array.isArray(localAnswer)) {
                    return localAnswer.length > 0;
                  }

                  if (typeof localAnswer === "object" && localAnswer !== null) {
                    if ("start" in localAnswer && "end" in localAnswer) {
                      return (
                        localAnswer.start !== undefined &&
                        localAnswer.end !== undefined
                      );
                    }
                  }

                  // For other types (string, number, date)
                  return true;
                })();
                return currentHasAnswer ? "✓ Has answer" : "⚠ No answer";
              })()}
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
