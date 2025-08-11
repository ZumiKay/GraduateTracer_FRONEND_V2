import {
  Chip,
  Input,
  RadioGroup,
  Radio,
  RangeValue,
  DateValue,
} from "@heroui/react";
import {
  AnswerKey,
  ContentType,
  QuestionType,
  RangeType,
} from "../../types/Form.types";
import Tiptap from "../FormComponent/TipTabEditor";
import { useCallback, useMemo, memo } from "react";
import {
  ChoiceAnswer,
  DateQuestionType,
  ParagraphAnswer,
  RangeNumberAnswer,
} from "../FormComponent/Solution/Answer_Component";
import DateRangeSelector from "../FormComponent/DateRanageSelector";
import { CalendarDate } from "@internationalized/date";

interface TextCardProps {
  content: ContentType;
  color?: string;
  onSelectAnswer?: (val: Pick<AnswerKey, "answer">) => void;
  ty?: "result" | "form";
  idx: number;
  isDisable?: boolean;
}

const Respondant_Question_Card = memo(
  ({ content, color, ty, onSelectAnswer, idx, isDisable }: TextCardProps) => {
    const handleAnswer = useCallback(
      (ans: unknown) => {
        if (onSelectAnswer && !isDisable) {
          onSelectAnswer({ answer: ans as never });
        }
      },
      [onSelectAnswer, isDisable]
    );

    // Memoize expensive computations
    const contentTitle = useMemo(() => {
      if (content.parentcontent) {
        return `(Sub-Q of Q${(content.parentcontent.qIdx ?? 0) + 1}.${
          content.parentcontent.optIdx
        })`;
      }
      return `Question ${content.qIdx ?? idx + 1}`;
    }, [content.parentcontent, content.qIdx, idx]);

    const questionTypeLabel = useMemo(() => {
      switch (content.type) {
        case QuestionType.MultipleChoice:
          return "Multiple Choice";
        case QuestionType.CheckBox:
          return "Checkbox";
        case QuestionType.Text:
          return "Text Display";
        case QuestionType.ShortAnswer:
          return "Short Answer";
        case QuestionType.Paragraph:
          return "Paragraph";
        case QuestionType.Number:
          return "Number";
        case QuestionType.Date:
          return "Date";
        case QuestionType.RangeDate:
          return "Date Range";
        case QuestionType.RangeNumber:
          return "Number Range";
        case QuestionType.Selection:
          return "Selection";
        default:
          return "Question";
      }
    }, [content.type]);

    // Memoize style objects to prevent recreation on every render
    const colorAccentStyle = useMemo(
      () => ({
        backgroundColor: color,
        background: color
          ? `linear-gradient(135deg, ${color}, ${color}dd)`
          : undefined,
      }),
      [color]
    );

    const questionBadgeStyle = useMemo(
      () => ({
        backgroundColor: color,
      }),
      [color]
    );

    // Memoized components for different question types
    const MultipleChoiceComponent = useMemo(() => {
      if (content.type !== QuestionType.MultipleChoice) return null;

      const options = content[content.type];
      if (!options || options.length === 0) return null;

      return (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">
            Select one option:
          </p>
          <RadioGroup
            value={String(content.answer?.answer ?? "")}
            onValueChange={(val) => handleAnswer(Number(val))}
            className="w-full space-y-2"
            isDisabled={isDisable}
            aria-label="Select one option from the multiple choice list"
          >
            {options.map((choice, cIdx) => (
              <Radio
                key={`choice-${content.idx}-${cIdx}`}
                className="w-full h-fit p-3 mb-3 border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-colors duration-200"
                value={String(choice.idx ?? cIdx)}
                aria-label={`Option ${cIdx + 1}`}
              >
                <p className="text-base font-medium text-gray-800 w-full h-full leading-relaxed">
                  {choice.content}
                </p>
              </Radio>
            ))}
          </RadioGroup>
        </div>
      );
    }, [content, handleAnswer, isDisable]);

    const CheckboxComponent = useMemo(() => {
      if (content.type !== QuestionType.CheckBox) return null;

      const options = content[content.type];
      if (!options || options.length === 0) return null;

      return (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">
            Select multiple options:
          </p>
          <div className="grid grid-cols-1 gap-2">
            {options.map((choice, cIdx) => (
              <ChoiceAnswer
                key={`choice-${content.idx}-${cIdx}`}
                name={`choicename${cIdx}`}
                choicety={content.type as never}
                value={
                  Array.isArray(content.answer?.answer)
                    ? (content.answer.answer as number[]).includes(
                        choice.idx ?? cIdx
                      )
                      ? choice.idx ?? cIdx
                      : -1
                    : -1
                }
                data={{
                  label: choice.content,
                  value: choice.idx ?? cIdx,
                }}
                onChange={(val) => {
                  const currentAnswers = Array.isArray(content.answer?.answer)
                    ? (content.answer.answer as number[])
                    : [];
                  const choiceValue = choice.idx ?? cIdx;

                  if (val === -1) {
                    // Remove from array
                    const newAnswers = currentAnswers.filter(
                      (a) => a !== choiceValue
                    );
                    handleAnswer(newAnswers);
                  } else {
                    // Add to array if not already there
                    if (!currentAnswers.includes(choiceValue)) {
                      handleAnswer([...currentAnswers, choiceValue]);
                    }
                  }
                }}
                isDisable={isDisable}
              />
            ))}
          </div>
        </div>
      );
    }, [content, handleAnswer, isDisable]);

    const RangeDateComponent = useMemo(() => {
      if (content.type !== QuestionType.RangeDate) return null;

      const value = content.rangedate;
      const rangeData: RangeValue<DateValue> | undefined = value
        ? {
            start: new CalendarDate(
              value.start.year,
              value?.start.month,
              value?.start.day
            ),
            end: new CalendarDate(
              value.end.year,
              value.end.month,
              value.end.day
            ),
          }
        : undefined;

      return (
        rangeData && (
          <DateRangeSelector
            rangvalue={rangeData as RangeValue<DateValue>}
            idx={idx}
            value={
              content.answer?.answer as RangeValue<DateValue> | null | undefined
            }
            onSelectionChange={handleAnswer}
          />
        )
      );
    }, [content, handleAnswer, idx]);

    // Optimized RenderAnswers with memoized components
    const RenderAnswers = useCallback(() => {
      if (!content.type) return null;

      switch (content.type) {
        case QuestionType.MultipleChoice:
          return MultipleChoiceComponent;

        case QuestionType.CheckBox:
          return CheckboxComponent;

        case QuestionType.RangeDate:
          return RangeDateComponent;

        case QuestionType.Paragraph:
          return (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Your answer:</p>
              <ParagraphAnswer
                value={String(content.answer?.answer || "")}
                onChange={handleAnswer}
                readonly={!ty || isDisable}
              />
            </div>
          );

        case QuestionType.RangeNumber:
          return (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Select range:</p>
              <RangeNumberAnswer
                onChange={handleAnswer}
                value={content.rangenumber}
                previousAnswer={content.answer?.answer as RangeType<number>}
                readonly={isDisable}
              />
            </div>
          );

        case QuestionType.Date:
          return (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Select date:</p>
              <DateQuestionType
                value={content.answer?.answer as Date}
                placeholder="Select Date"
                onChange={handleAnswer}
                readonly={isDisable}
              />
            </div>
          );

        case QuestionType.Number:
          return (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Enter number:</p>
              <Input
                size="md"
                radius="sm"
                type="number"
                placeholder="Enter your answer"
                value={String(content.answer?.answer || "")}
                errorMessage="Please enter a valid number"
                onChange={(e) => handleAnswer(e.target.value)}
                className="w-full"
                readOnly={isDisable}
                variant="bordered"
                aria-label="Enter a number for your answer"
              />
            </div>
          );

        case QuestionType.ShortAnswer:
          return (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Your answer:</p>
              <Input
                fullWidth
                size="md"
                radius="sm"
                type="text"
                placeholder="Enter your answer"
                value={String(content.answer?.answer || "")}
                onChange={(e) => handleAnswer(e.target.value)}
                readOnly={!ty || isDisable}
                className="w-full"
                variant="bordered"
                aria-label="Enter your short answer"
              />
            </div>
          );

        default:
          return null;
      }
    }, [
      content.type,
      content.answer?.answer,
      content.rangenumber,
      MultipleChoiceComponent,
      CheckboxComponent,
      RangeDateComponent,
      handleAnswer,
      ty,
      isDisable,
    ]);

    return (
      <div
        className={`relative w-card_respondant_width h-fit rounded-xl bg-white shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 ${
          isDisable
            ? "cursor-not-allowed"
            : "hover:shadow-xl hover:border-gray-200 hover:-translate-y-1"
        }`}
      >
        {/* Color accent bar with gradient */}
        <div style={colorAccentStyle} className="h-3 w-full relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        </div>

        {/* Question number badge - improved styling */}
        <div
          style={questionBadgeStyle}
          className="absolute top-5 right-5 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg border-2 border-white/20 backdrop-blur-sm"
        >
          {contentTitle}
        </div>

        {/* Question type badge */}
        <div className="absolute top-5 left-5">
          <Chip
            color="primary"
            size="sm"
            variant="flat"
            className="text-xs font-medium"
            aria-label={`Question type: ${questionTypeLabel}`}
          >
            {questionTypeLabel}
          </Chip>
        </div>

        {/* Disabled overlay */}
        {isDisable && (
          <div className="absolute inset-0 bg-gray-900/10 z-10 pointer-events-none" />
        )}

        {/* Main content */}
        <div className="p-6 pt-16 space-y-6">
          {/* Question title */}
          <div className="pr-4">
            <div
              className={`tiptab_container w-full ${
                content.type !== QuestionType.Text
                  ? "pb-4 border-b border-gray-200"
                  : ""
              }`}
            >
              <Tiptap value={content.title as never} readonly />
            </div>
          </div>

          {/* Answer section */}
          {RenderAnswers() && (
            <div
              className={`answer_container w-full min-h-[60px] p-4 rounded-lg border transition-colors duration-200 ${
                isDisable
                  ? "bg-gray-100 border-gray-200"
                  : "bg-gradient-to-br from-gray-50 to-gray-100/50 border-gray-200 hover:border-gray-300"
              }`}
            >
              {RenderAnswers()}
            </div>
          )}

          {/* Status indicators */}
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              {content.require && (
                <Chip
                  color="danger"
                  size="sm"
                  variant="flat"
                  aria-label="This question is required"
                >
                  Required
                </Chip>
              )}
              {content.score && content.score > 0 ? (
                <Chip
                  color="success"
                  size="sm"
                  variant="flat"
                  aria-label={`This question is worth ${content.score} points`}
                >
                  {content.score} pts
                </Chip>
              ) : (
                ""
              )}
            </div>

            {isDisable && (
              <Chip
                color="default"
                size="sm"
                variant="flat"
                aria-label="This question is in read-only mode"
              >
                Read-only
              </Chip>
            )}
          </div>
        </div>
      </div>
    );
  }
);

// Add display name for debugging
Respondant_Question_Card.displayName = "Respondant_Question_Card";

export default Respondant_Question_Card;
