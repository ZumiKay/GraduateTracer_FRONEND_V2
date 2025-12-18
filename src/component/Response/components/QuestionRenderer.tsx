import React, { lazy } from "react";
import {
  ContentType,
  AnswerKey,
  QuestionType as QType,
} from "../../../types/Form.types";
import { FormResponse } from "../hooks/useFormResponses";

type QuestionType = ContentType<unknown>;

const Respondant_Question_Card = lazy(
  () => import("../../Card/Respondant.card")
);
const ConditionalIndicator = lazy(() =>
  import("./ConditionalIndicator").then((m) => ({
    default: m.ConditionalIndicator,
  }))
);
const CheckboxQuestion = lazy(() =>
  import("./CheckboxQuestion").then((m) => ({
    default: m.CheckboxQuestion,
  }))
);
const MultipleChoiceQuestion = lazy(() =>
  import("./MultipleChoiceQuestion").then((m) => ({
    default: m.MultipleChoiceQuestion,
  }))
);

interface QuestionRendererProps {
  question: QuestionType;
  index: number;
  questions: QuestionType[];
  currentResponse?: FormResponse;
  formQColor?: string;
  onAnswer: (questionId: string, answer: Pick<AnswerKey, "answer">) => void;
  updateResponse: (questionId: string, response: unknown) => void;
}

export const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  question,
  index,
  questions,
  currentResponse,
  formQColor,
  onAnswer,
  updateResponse,
}) => {
  if (!question._id) {
    console.error("Question missing ID:", question);
    return null;
  }

  return (
    <div key={question._id} className="question-wrapper">
      <ConditionalIndicator question={question} questions={questions} />

      {question.type === QType.CheckBox ? (
        <CheckboxQuestion
          question={question}
          currentResponse={currentResponse?.response as never}
          updateResponse={updateResponse}
        />
      ) : question.type === QType.MultipleChoice ? (
        <MultipleChoiceQuestion
          question={question}
          currentResponse={currentResponse?.response as never}
          updateResponse={updateResponse}
        />
      ) : (
        <div className="p-6 bg-white rounded-lg border shadow-sm">
          <Respondant_Question_Card
            content={{
              ...question,
              idx: index,
              answer:
                currentResponse?.response !== undefined &&
                currentResponse.response !== null
                  ? ({
                      answer: currentResponse.response,
                    } as AnswerKey)
                  : undefined,
            }}
            color={formQColor}
            ty="form"
            idx={index}
            onSelectAnswer={(answer) => onAnswer(question._id || "", answer)}
            isDisable={false}
          />
        </div>
      )}
    </div>
  );
};
