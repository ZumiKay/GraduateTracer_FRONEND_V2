import { Input, RadioGroup } from "@heroui/react";
import { AnswerKey, ContentType, QuestionType } from "../../types/Form.types";
import Tiptap from "../FormComponent/TipTabEditor";
import { ChangeEvent, useCallback, useState } from "react";
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
  onSelectAnswer?: (val: Pick<AnswerKey, "answer">) => void;
}

const Respondant_Question_Card = ({
  content,
  color,
  onSelectAnswer,
}: TextCardProps) => {
  const [score, setscore] = useState({
    score: 0,
    total: 1,
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { value, name } = e.target;

    setscore((prev) => ({ ...prev, [name]: value }));
  };

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
            choicety={content.type as never}
            data={{
              label: choice.content,
              value: choice.idx,
            }}
            onChange={handleAnswer}
          />
        ));
        if (content.type === QuestionType.MultipleChoice) {
          return (
            <RadioGroup className="w-full h-fit  p-3">{Choices}</RadioGroup>
          );
        }
        return Choices;
      }
      case QuestionType.Paragraph:
        return <ParagraphAnswer onChange={handleAnswer} />;
      case QuestionType.RangeNumber:
        return (
          <RangeNumberAnswer onChange={handleAnswer} value={content.numrange} />
        );
      case QuestionType.Date:
        return (
          <DateQuestionType
            value={content.date}
            placeholder="Select Date"
            onChange={handleAnswer}
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
            onChange={(e) => handleAnswer(e.target.value)}
          />
        );
      case QuestionType.RangeDate:
        return <DateRangePickerQuestionType />;

      default:
        return <></>;
    }
  }, [content]);

  const ContentTitle = useCallback(() => {
    return content.parentcontent
      ? `Question ${content.idx + 1} (Belong to Q${
          content.parentcontent.idx + 1
        })`
      : `Question ${content.idx + 1}`;
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

      {content.type !== QuestionType.Text && (
        <div
          className={`score_container w-fit self-end h-[50px] flex flex-row gap-x-5 border-t-2 border-blue-200 mt-5 p-2`}
        >
          <Input
            size="md"
            radius={"none"}
            className="max-w-xs h-full"
            type="number"
            min={0}
            value={score.score.toString()}
            placeholder="Enter Score"
            label="Score"
            onChange={handleChange}
          />
          <Input
            size="md"
            radius={"none"}
            className="w-full h-full"
            label="Total Score"
            type="number"
            min={1}
            value={score.total.toString()}
            placeholder="Total score"
            onChange={handleChange}
          />
        </div>
      )}
    </div>
  );
};

export default Respondant_Question_Card;
