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
import StyledTiptap from "../Response/components/StyledTiptap";
import { useCallback, useMemo, memo } from "react";
import {
  ChoiceAnswer,
  DateQuestionType,
  ParagraphAnswer,
  RangeNumberAnswer,
} from "../FormComponent/Solution/Answer_Component";
import DateRangeSelector from "../FormComponent/DateRanageSelector";
import { getLocalTimeZone, now, parseDate } from "@internationalized/date";
import Selection from "../FormComponent/Selection";

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

    //Question numbering
    const contentTitle = useMemo(() => {
      if (content.parentcontent) {
        return `Question ${content.questionId} (Sub of Q-${
          content.parentcontent.questionId
        } option ${content.parentcontent.optIdx + 1})`;
      }
      return `Question ${content.questionId}`;
    }, [content.parentcontent, content.questionId]);

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

    const MultipleChoiceComponent = useMemo(() => {
      if (content.type !== QuestionType.MultipleChoice) return null;

      const options = content[content.type];
      if (!options || options.length === 0) return null;

      return (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Select one option:
          </p>
          <RadioGroup
            value={String(content.answer)}
            onValueChange={(val) => handleAnswer(Number(val))}
            className="w-full space-y-2"
            isDisabled={isDisable}
            aria-label="Select one option from the multiple choice list"
          >
            {options.map((choice, cIdx) => (
              <Radio
                key={`choice-${content.idx}-${cIdx}`}
                className="w-full h-fit p-3 mb-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-gray-300 dark:hover:border-gray-600 transition-colors duration-200"
                value={String(choice.idx ?? cIdx)}
                aria-label={`Option ${cIdx}`}
              >
                <p className="text-base font-medium text-gray-800 dark:text-gray-200 w-full h-full leading-relaxed">
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

      const answerkey = content.answer as AnswerKey;

      return (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Select multiple options:
          </p>
          <div className="grid grid-cols-1 gap-2">
            {options.map((choice, cIdx) => (
              <ChoiceAnswer
                key={`choice-${content.idx}-${cIdx}`}
                name={`choicename${cIdx}`}
                choicety={content.type as never}
                value={
                  answerkey?.answer
                    ? Array.isArray(answerkey.answer)
                      ? (answerkey.answer as number[]).includes(
                          choice.idx ?? cIdx
                        )
                        ? choice.idx ?? cIdx
                        : -1
                      : -1
                    : -1
                }
                data={{
                  label: choice.content,
                  value: choice.idx ?? cIdx,
                }}
                onChange={(val) => {
                  const currentAnswers = Array.isArray(answerkey.answer)
                    ? answerkey.answer
                    : [];
                  const choiceValue = choice.idx ?? cIdx;

                  if (val === -1) {
                    const newAnswers = currentAnswers.filter(
                      (a) => a !== choiceValue
                    );
                    handleAnswer(newAnswers);
                  } else {
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

      const parseFlexibleDate = (dateStr: string): DateValue => {
        try {
          const cleanDateStr = dateStr
            .replace(/\.\d{3}Z?$/, "")
            .replace("Z", "");

          // Extract just the date part
          const datePart = cleanDateStr.split("T")[0];

          return parseDate(datePart);
        } catch (error) {
          console.error("Error parsing date:", error, dateStr);
          return now(getLocalTimeZone());
        }
      };

      const rangeData: RangeValue<DateValue> | undefined = value
        ? {
            start: value.start
              ? parseFlexibleDate(value.start)
              : now(getLocalTimeZone()),
            end: value.end
              ? parseFlexibleDate(value.end)
              : now(getLocalTimeZone()),
          }
        : undefined;

      const answerKey = content.answer as AnswerKey;

      return (
        rangeData && (
          <DateRangeSelector
            rangvalue={rangeData as RangeValue<DateValue>}
            idx={idx}
            value={answerKey?.answer as never}
            onSelectionChange={handleAnswer}
            label={`${content._id ?? content.qIdx} range date`}
          />
        )
      );
    }, [content, handleAnswer, idx]);

    const RenderAnswers = useCallback(() => {
      if (!content.type) return null;
      const answerKey = content.answer as AnswerKey;

      switch (content.type) {
        case QuestionType.MultipleChoice:
          return MultipleChoiceComponent;

        case QuestionType.CheckBox:
          return CheckboxComponent;

        case QuestionType.RangeDate:
          return RangeDateComponent;

        case QuestionType.Paragraph: {
          return (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Your answer:
              </p>
              <ParagraphAnswer
                value={String(answerKey?.answer || "")}
                onChange={handleAnswer}
                readonly={!ty || isDisable}
              />
            </div>
          );
        }

        case QuestionType.RangeNumber:
          return (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Select range:
              </p>
              <RangeNumberAnswer
                onChange={handleAnswer}
                value={content.rangenumber}
                previousAnswer={answerKey?.answer as RangeType<number>}
                readonly={isDisable}
              />
            </div>
          );

        case QuestionType.Date:
          return (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Select date:
              </p>
              <DateQuestionType
                value={answerKey?.answer as string}
                placeholder="Select Date"
                onChange={handleAnswer}
                readonly={isDisable}
              />
            </div>
          );

        case QuestionType.Number:
          return (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Enter number:
              </p>
              <Input
                size="md"
                radius="sm"
                type="number"
                placeholder="Enter your answer"
                value={String(answerKey?.answer || "")}
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
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Your answer:
              </p>
              <Input
                fullWidth
                size="md"
                radius="sm"
                type="text"
                placeholder="Enter your answer"
                value={String(answerKey?.answer || "")}
                onChange={(e) => handleAnswer(e.target.value)}
                readOnly={!ty || isDisable}
                className="w-full"
                variant="bordered"
                aria-label="Enter your short answer"
              />
            </div>
          );

        case QuestionType.Selection: {
          return (
            <>
              <Selection
                items={
                  content.selection?.map((i) => ({
                    label: i.content,
                    value: i.idx.toString(),
                  })) as never
                }
                selectedKeys={[answerKey?.answer?.toString()]}
                onChange={(val) => {
                  handleAnswer(val.target.value);
                }}
                placeholder="Select"
                isDisabled={!ty || isDisable}
                isRequired={content.require}
                aria-label={`selection${content._id ?? content.qIdx}`}
              />
            </>
          );
        }

        default:
          return null;
      }
    }, [
      content,
      MultipleChoiceComponent,
      CheckboxComponent,
      RangeDateComponent,
      handleAnswer,
      isDisable,
      ty,
    ]);

    return (
      <div
        className={`relative w-card_respondant_width h-fit rounded-xl bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700 ${
          isDisable
            ? "cursor-not-allowed"
            : "hover:shadow-xl hover:border-gray-200 dark:hover:border-gray-600 hover:-translate-y-1"
        }`}
      >
        <div style={colorAccentStyle} className="h-3 w-full relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        </div>

        <div
          style={questionBadgeStyle}
          className="absolute top-5 right-5 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg border-2 border-white/20 backdrop-blur-sm"
        >
          {contentTitle}
        </div>

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

        {isDisable && (
          <div className="absolute inset-0 bg-gray-900/10 z-10 pointer-events-none" />
        )}

        {/* Main content */}
        <div className="p-6 pt-16 space-y-6">
          <div className="pr-4">
            <div
              className={`tiptab_container w-full ${
                content.type !== QuestionType.Text
                  ? "pb-4 border-b border-gray-200"
                  : ""
              } dark:bg-white dark:rounded-md dark:p-2`}
            >
              <StyledTiptap
                value={content.title as never}
                readonly
                variant="question"
              />
            </div>
          </div>

          {/* Answer section */}
          {RenderAnswers() && (
            <div
              className={`answer_container w-full min-h-[60px] p-4 rounded-lg border transition-colors duration-200 ${
                isDisable
                  ? "bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                  : "bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-600/50 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
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

Respondant_Question_Card.displayName = "Respondant_Question_Card";

export default Respondant_Question_Card;
