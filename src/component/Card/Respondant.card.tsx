import { Chip, Input, RadioGroup } from "@heroui/react";
import { AnswerKey, ContentType, QuestionType } from "../../types/Form.types";
import Tiptap from "../FormComponent/TipTabEditor";
import { useCallback } from "react";
import {
  ChoiceAnswer,
  DateQuestionType,
  DateRangePickerQuestionType,
  ParagraphAnswer,
  RangeNumberAnswer,
} from "../FormComponent/Solution/Answer_Component";

interface TextCardProps {
  content: ContentType;
  color?: string;
  onChangeScore: (score: number) => void;
  onSelectAnswer?: (val: Pick<AnswerKey, "answer">) => void;
  ty?: "result" | "form";
  idx: number;
}

const Respondant_Question_Card = ({
  content,
  color,
  ty,
  onSelectAnswer,
  onChangeScore,
  idx,
}: TextCardProps) => {
  function handleAnswer<t>(ans: t) {
    if (onSelectAnswer) {
      onSelectAnswer({ answer: ans as never });
    }
  }

  const RenderAnswers = useCallback(() => {
    switch (content.type) {
      case QuestionType.MultipleChoice:
      case QuestionType.CheckBox: {
        const Choices = content[content.type]?.map((choice, cIdx) => (
          <ChoiceAnswer
            key={`choice${cIdx}`}
            name={`choicename${cIdx}`}
            choicety={content.type as never}
            value={content.answer?.answer as number}
            data={{
              label: choice.content,
              value: choice.idx,
            }}
            onChange={(val) => handleAnswer(Number(val))}
          />
        ));
        if (content.type === QuestionType.MultipleChoice) {
          return (
            <RadioGroup
              value={content.answer?.answer as string}
              onValueChange={(val) => handleAnswer(val)}
              className="w-full h-fit p-3"
              name={`radiogroup${content.idx}`}
            >
              {Choices}
            </RadioGroup>
          );
        }
        return Choices;
      }
      case QuestionType.Paragraph:
        return (
          <ParagraphAnswer
            name={`paragraph${content.idx}`}
            onChange={handleAnswer}
            readonly={!ty}
          />
        );
      case QuestionType.RangeNumber:
        return (
          <RangeNumberAnswer
            name={`range${content.idx}`}
            onChange={handleAnswer}
            value={content.numrange}
          />
        );
      case QuestionType.Date:
        return (
          <DateQuestionType
            value={content.answer?.answer as Date}
            placeholder="Select Date"
            onChange={handleAnswer}
            name={`date${content.idx}`}
          />
        );
      case QuestionType.Number: {
        return (
          <Input
            size="md"
            radius="none"
            type="number"
            placeholder="Answer"
            errorMessage="Please enter a valid number"
            onChange={(e) => handleAnswer(e.target.value)}
            aria-label={`number${content.idx}`}
          />
        );
      }

      case QuestionType.ShortAnswer:
        return (
          <Input
            fullWidth
            size="md"
            type="text"
            placeholder="Answer"
            aria-label={`shortanswer${content.idx}`}
            onChange={(e) => handleAnswer(e.target.value)}
            readOnly={!ty}
          />
        );
      case QuestionType.RangeDate:
        return (
          <DateRangePickerQuestionType name={`dateranage${content.idx}`} />
        );

      default:
        return <></>;
    }
  }, [content]);

  const ContentTitle = useCallback(() => {
    return content.parentcontent
      ? `Question ${idx + 1} (Belong to Q${
          content.parentcontent.qIdx ?? 0 + 1
        } Opt.${content.parentcontent.optIdx})`
      : `Question ${idx + 1}`;
  }, [content]);

  return (
    <div
      style={{ border: `20px solid ${color}` }}
      className="repsondant_response_card relative w-card_respondant_width h-fit text-black rounded-lg 
    flex flex-col gap-y-5 p-5 bg-white"
    >
      <p
        style={{ backgroundColor: color }}
        className="text-lg font-bold absolute top-[-50px] p-2"
      >
        {ContentTitle()}
      </p>
      <div
        className={`tiptab_container w-full h-fit pb-2 ${
          content.type !== QuestionType.Text ? "border-b-2 border-blue-200" : ""
        }`}
      >
        <Tiptap value={content.title as never} readonly />
      </div>
      <div className="answer_container w-full h-full bg-white rounded-md">
        {RenderAnswers()}
      </div>

      {content.type !== QuestionType.Text && !ty && (
        <div
          className={`score_container w-fit self-end h-[50px] flex flex-row gap-x-5 border-t-2 border-blue-200 mt-5 p-2`}
        >
          <Input
            size="md"
            radius={"none"}
            className="max-w-xs h-full"
            type="number"
            validationBehavior="aria"
            aria-label={`score${content.idx}`}
            value={content.score ? content.score.toString() : undefined}
            min={0}
            onChange={(e) => onChangeScore(Number(e.target.value ?? "0"))}
            label="Score"
            endContent={ty && "/10"}
          />
        </div>
      )}
      {content.require && (
        <div className="required_container self-start">
          <Chip color="danger">Required</Chip>
        </div>
      )}
    </div>
  );
};

export default Respondant_Question_Card;
