import { Chip, Input, RadioGroup } from "@heroui/react";
import { AnswerKey, ContentType, QuestionType } from "../../types/Form.types";
import Tiptap from "../FormComponent/TipTabEditor";
import { useCallback } from "react";
import {
  ChoiceAnswer,
  DateQuestionType,
  ParagraphAnswer,
  RangeNumberAnswer,
} from "../FormComponent/Solution/Answer_Component";
import DateRangeSelector from "../FormComponent/DateRanageSelector";

interface TextCardProps {
  content: ContentType;
  color?: string;
  onSelectAnswer?: (val: Pick<AnswerKey, "answer">) => void;
  ty?: "result" | "form";
  idx: number;
  isDisable?: boolean;
}

const Respondant_Question_Card = ({
  content,
  color,
  ty,
  onSelectAnswer,
  idx,
  isDisable,
}: TextCardProps) => {
  const handleAnswer = useCallback(
    (ans: unknown) => {
      if (onSelectAnswer && !isDisable) {
        onSelectAnswer({ answer: ans as never });
      }
    },
    [onSelectAnswer, isDisable]
  );

  const RenderAnswers = useCallback(() => {
    if (!content.type) return null;

    switch (content.type) {
      case QuestionType.MultipleChoice:
      case QuestionType.CheckBox: {
        const options = content[content.type];
        if (!options || options.length === 0) return null;

        const Choices = options.map((choice, cIdx) => (
          <ChoiceAnswer
            key={`choice-${content.idx}-${cIdx}`}
            name={`choicename${cIdx}`}
            choicety={content.type as never}
            value={content.answer?.answer as number}
            data={{
              label: choice.content,
              value: choice.idx,
            }}
            onChange={(val) => handleAnswer(Number(val))}
            isDisable={isDisable}
          />
        ));

        if (content.type === QuestionType.MultipleChoice) {
          return (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">
                Select one option:
              </p>
              <RadioGroup
                value={content.answer?.answer as string}
                onValueChange={(val) => handleAnswer(val)}
                className="w-full space-y-2"
                isDisabled={isDisable}
                aria-label="Select one option from the multiple choice list"
              >
                {Choices}
              </RadioGroup>
            </div>
          );
        }

        return (
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">
              Select multiple options:
            </p>
            <div className="grid grid-cols-1 gap-2">{Choices}</div>
          </div>
        );
      }

      case QuestionType.Paragraph:
        return (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Your answer:</p>
            <ParagraphAnswer
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
              onChange={(e) => handleAnswer(e.target.value)}
              readOnly={!ty || isDisable}
              className="w-full"
              variant="bordered"
              aria-label="Enter your short answer"
            />
          </div>
        );

      case QuestionType.RangeDate:
        return (
          <DateRangeSelector
            value={content.rangedate ?? null}
            idx={idx}
            onSelectionChange={handleAnswer}
          />
        );

      default:
        return null;
    }
  }, [content, handleAnswer, ty, isDisable, idx]);

  const ContentTitle = useCallback(() => {
    if (content.parentcontent) {
      return `Q${idx + 1} (Sub-Q of Q${(content.parentcontent.qIdx ?? 0) + 1}.${
        content.parentcontent.optIdx
      })`;
    }
    return `Question ${idx + 1}`;
  }, [content.parentcontent, idx]);

  const getQuestionTypeLabel = useCallback(() => {
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

  return (
    <div
      className={`relative w-card_respondant_width h-fit rounded-xl bg-white shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 ${
        isDisable
          ? "cursor-not-allowed"
          : "hover:shadow-xl hover:border-gray-200 hover:-translate-y-1"
      }`}
    >
      {/* Color accent bar with gradient */}
      <div
        style={{
          backgroundColor: color,
          background: color
            ? `linear-gradient(135deg, ${color}, ${color}dd)`
            : undefined,
        }}
        className="h-3 w-full relative"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
      </div>

      {/* Question number badge - improved styling */}
      <div
        style={{ backgroundColor: color }}
        className="absolute top-5 right-5 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg border-2 border-white/20 backdrop-blur-sm"
      >
        {ContentTitle()}
      </div>

      {/* Question type badge */}
      <div className="absolute top-5 left-5">
        <Chip
          color="primary"
          size="sm"
          variant="flat"
          className="text-xs font-medium"
          aria-label={`Question type: ${getQuestionTypeLabel()}`}
        >
          {getQuestionTypeLabel()}
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
};

export default Respondant_Question_Card;
