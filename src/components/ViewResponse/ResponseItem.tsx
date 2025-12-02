import React from "react";
import { Card, Chip } from "@heroui/react";
import { QuestionType, ContentType } from "../../types/Form.types";
import {
  ResponseSetType,
  ResponseValueType,
} from "../../component/Response/Response.type";
import StyledTiptap from "../../component/Response/components/StyledTiptap";
import { ConditionalIndicator } from "../../component/Response/components/ConditionalIndicator";
import { ScoreModeInput } from "../../component/FormComponent/Solution/ScoreComponent";
import { isResponseEmpty, renderAnswer } from "../../utils/responseUtils";

interface ResponseItemProps {
  response: ResponseSetType;
  question: ContentType;
  isAutoScore: boolean;
  isQuizForm: boolean;
  allQuestions: ContentType[];
  onScoreUpdate?: (questionId: string, score: number, comment?: string) => void;
  responseId?: string;
}

const ResponseItem = React.memo<ResponseItemProps>(
  ({
    response: resp,
    question,
    isAutoScore,
    isQuizForm,
    allQuestions,
    onScoreUpdate,
    responseId,
  }) => {
    const isTextType = question?.type === QuestionType.Text;
    const canScore = isQuizForm && !isTextType;

    // Render answer content
    const renderAnswerContent = (
      response: ResponseValueType,
      qType: QuestionType
    ) => {
      const result = renderAnswer(
        response,
        qType,
        <div className="flex items-center gap-2">
          <Chip size="sm" variant="flat" color="default" className="italic">
            No answer
          </Chip>
        </div>
      );

      if (!result) return null;

      // Handle CheckBox array response
      if (Array.isArray(result)) {
        return (
          <div className="flex flex-col gap-2">
            {result.map((item) => (
              <Chip
                size="lg"
                key={item.key}
                variant="bordered"
                color="primary"
                className="font-medium text-sm"
              >
                {item.label}
              </Chip>
            ))}
          </div>
        );
      }

      // Handle Range response
      if (typeof result === "object" && "start" in result && "end" in result) {
        return (
          <div className="w-full h-full flex flex-row items-center gap-x-5">
            <Chip
              size="lg"
              variant="flat"
              color="primary"
              className="font-medium"
            >
              {result.start}
            </Chip>
            <Chip
              size="lg"
              variant="flat"
              color="primary"
              className="font-medium"
            >
              {result.end}
            </Chip>
          </div>
        );
      }

      // Handle simple string/selection response
      if (typeof result === "string") {
        return qType === QuestionType.MultipleChoice ||
          qType === QuestionType.Selection ? (
          <Chip
            size="lg"
            variant="flat"
            color="primary"
            className="font-medium"
          >
            {result}
          </Chip>
        ) : (
          <span className="font-medium text-gray-900">{result}</span>
        );
      }

      return null;
    };

    // Text type questions: display like in question tab (title only, no answer/scoring)
    if (isTextType) {
      return (
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
          <div className="p-8">
            <div className="space-y-6">
              {/* Question Header */}
              <div className="flex items-center gap-3 flex-wrap">
                {question.qIdx && !question.parentcontent ? (
                  <Chip
                    size="md"
                    color="secondary"
                    variant="flat"
                    className="font-semibold"
                  >
                    Q{question.qIdx}
                  </Chip>
                ) : (
                  <ConditionalIndicator
                    question={question}
                    questions={allQuestions}
                  />
                )}
                <Chip size="md" color="primary" variant="bordered">
                  Text Display
                </Chip>
              </div>

              {/* Question Title - Larger display */}
              {question?.title && (
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border-l-4 border-primary">
                  <div className="text-lg">
                    <StyledTiptap
                      value={question.title as never}
                      readonly
                      variant="question"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      );
    }

    // Non-text questions: show with answers and scoring
    return (
      <Card className="shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-gray-200 hover:border-blue-300 bg-gradient-to-br from-white to-gray-50">
        {question.parentcontent && (
          <Card className="m-4 bg-blue-50 border-l-4 border-blue-500">
            <ConditionalIndicator
              question={question}
              questions={allQuestions}
            />
          </Card>
        )}
        <div className="p-8">
          <div className="flex justify-between items-start gap-6">
            <div className="flex-1 space-y-6">
              {/* Question Header */}
              <div className="flex items-center gap-3 flex-wrap">
                <Chip
                  size="lg"
                  color="secondary"
                  variant="flat"
                  className="font-bold text-base px-5 py-2 shadow-sm"
                >
                  Q{question.questionId}
                </Chip>

                <Chip
                  size="md"
                  color="primary"
                  variant="bordered"
                  className="font-semibold shadow-sm"
                >
                  {question?.type || "Unknown"}
                </Chip>
                {isQuizForm && (
                  <Chip
                    size="md"
                    color={isAutoScore ? "success" : "warning"}
                    variant="flat"
                    className="font-semibold shadow-sm"
                  >
                    {isAutoScore ? "✓ Auto-Scored" : "✎ Manual Scoring"}
                  </Chip>
                )}
              </div>

              {/* Question Title */}
              {question?.title && (
                <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl p-6 border-l-4 border-blue-600 shadow-sm">
                  <div className="text-base font-medium text-gray-800">
                    <StyledTiptap
                      value={question.title as never}
                      readonly
                      variant="question"
                    />
                  </div>
                </div>
              )}

              {/* Answer */}
              <div className="bg-white border-2 border-blue-300 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow duration-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center shadow-sm">
                    <span className="text-blue-600 text-sm font-bold">✎</span>
                  </div>
                  <span className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                    Respondent's Answer
                  </span>
                </div>
                <div className="text-gray-900 text-base leading-relaxed">
                  {renderAnswerContent(resp.response, resp.question.type)}
                </div>
              </div>

              {/* Correct Answer (Quiz Only) */}
              {question?.answer && isQuizForm && (
                <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border-2 border-green-400 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow duration-200">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-200 to-green-300 flex items-center justify-center shadow-sm">
                      <span className="text-green-700 text-sm font-bold">
                        ✓
                      </span>
                    </div>
                    <span className="text-sm font-bold text-green-800 uppercase tracking-wider">
                      Correct Answer
                    </span>
                  </div>
                  <div className="text-green-900 text-base font-semibold leading-relaxed">
                    {renderAnswerContent(
                      question.answer as never,
                      question.type
                    )}
                  </div>
                </div>
              )}
            </div>

            {isQuizForm && (
              <div className="flex flex-col items-end gap-3 min-w-[160px]">
                {!canScore ? (
                  <div className="bg-gradient-to-br from-purple-100 via-purple-50 to-pink-100 rounded-2xl px-6 py-5 text-center border-2 border-purple-300 shadow-lg hover:shadow-xl transition-all duration-200">
                    <div className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                      {resp.score || 0}
                    </div>
                    <div className="text-base text-purple-700 font-bold mt-1">
                      / {question?.score || 0}
                    </div>
                    <div className="text-xs text-purple-600 uppercase tracking-widest mt-2 font-semibold">
                      Points
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Score Mode Input for non-text, non-auto-scored questions */}
          {onScoreUpdate &&
            responseId &&
            question._id &&
            !isResponseEmpty(resp.response, resp.question.type) && (
              <div className="mt-8 pt-6 border-t-2 border-dashed border-gray-300">
                <div className="bg-gray-50 rounded-xl p-6 shadow-inner">
                  <ScoreModeInput
                    maxScore={question?.score || 0}
                    initialScore={resp.score || 0}
                    initialComment={resp.comment}
                    onScoreChange={({ score, comment }) => {
                      onScoreUpdate(question._id as string, score, comment);
                    }}
                  />
                </div>
              </div>
            )}
        </div>
      </Card>
    );
  }
);

ResponseItem.displayName = "ResponseItem";

export default ResponseItem;
