import React, { useMemo } from "react";
import { Card, Chip } from "@heroui/react";
import {
  QuestionType,
  ContentType,
  ChoiceQuestionType,
  AnswerKey,
} from "../../types/Form.types";
import {
  ResponseSetType,
  AnswerKeyPairValueType,
  ResponseValueType,
} from "../../component/Response/Response.type";
import StyledTiptap from "../../component/Response/components/StyledTiptap";
import { ConditionalIndicator } from "../../component/Response/components/ConditionalIndicator";
import { ScoreModeInput } from "../../component/FormComponent/Solution/ScoreComponent";
import { isResponseEmpty } from "../../utils/responseUtils";
import { RangeValue } from "@heroui/react";

interface ResponseItemProps {
  response: ResponseSetType;
  question: ContentType;
  isAutoScore: boolean;
  isQuizForm: boolean;
  allQuestions: ContentType[];
  onScoreUpdate?: (questionId: string, score: number, comment?: string) => void;
  responseId?: string;
}

// Helper to check if a question is a range type
const isRangeType = (qType: QuestionType) =>
  qType === QuestionType.RangeDate || qType === QuestionType.RangeNumber;

// Helper to check if a question is a choice type
const isChoiceType = (qType: QuestionType) =>
  qType === QuestionType.CheckBox ||
  qType === QuestionType.MultipleChoice ||
  qType === QuestionType.Selection;

// Get options for choice questions
const getChoiceOptions = (question: ContentType): ChoiceQuestionType[] => {
  switch (question.type) {
    case QuestionType.CheckBox:
      return question.checkbox || [];
    case QuestionType.MultipleChoice:
      return question.multiple || [];
    case QuestionType.Selection:
      return question.selection || [];
    default:
      return [];
  }
};

const ResponseItem = React.memo<ResponseItemProps>(
  ({
    response: resp,
    question,
    isQuizForm,
    isAutoScore,
    allQuestions,
    onScoreUpdate,
    responseId,
  }) => {
    const isTextType = question?.type === QuestionType.Text;
    const canScore = isQuizForm && !isTextType;

    const questionTypeInfo = useMemo(
      () => ({
        isRange: isRangeType(question.type),
        isChoice: isChoiceType(question.type),
      }),
      [question.type]
    );

    const choiceOptions = useMemo(
      () => (questionTypeInfo.isChoice ? getChoiceOptions(question) : []),
      [questionTypeInfo.isChoice, question]
    );

    const userSelectedIndices = useMemo(() => {
      if (!questionTypeInfo.isChoice) return new Set<number>();

      const response = resp.response as AnswerKeyPairValueType;
      if (!response || !response.key) return new Set<number>();

      if (Array.isArray(response.key)) {
        return new Set(response.key);
      }
      return new Set([response.key]);
    }, [questionTypeInfo.isChoice, resp.response]);

    // Parse correct answer for choice questions (Quiz mode)
    const correctAnswerIndices = useMemo(() => {
      if (!questionTypeInfo.isChoice || !isQuizForm || !question.answer)
        return new Set<number>();

      const answer = question.answer as AnswerKey;
      if (!answer || answer.answer === undefined || answer.answer === null)
        return new Set<number>();

      // AnswerKey type: answer.answer is Array<number> for choice questions
      if (Array.isArray(answer.answer)) {
        return new Set(answer.answer as number[]);
      }

      // Handle single number answer
      if (typeof answer.answer === "number") {
        return new Set([answer.answer]);
      }

      return new Set<number>();
    }, [questionTypeInfo.isChoice, isQuizForm, question.answer]);

    const renderRangeContent = () => {
      const userResponse = resp.response as unknown as RangeValue<
        string | number
      >;

      let answerKeyRange: RangeValue<string | number> | null = null;
      if (question.answer) {
        if (
          typeof question.answer === "object" &&
          "answer" in question.answer
        ) {
          const answerKey = question.answer as AnswerKey;
          if (
            answerKey.answer &&
            typeof answerKey.answer === "object" &&
            "start" in answerKey.answer
          ) {
            answerKeyRange = answerKey.answer as RangeValue<string | number>;
          }
        } else if (
          typeof question.answer === "object" &&
          "start" in question.answer
        ) {
          // Direct RangeValue
          answerKeyRange = question.answer as unknown as RangeValue<
            string | number
          >;
        }
      }

      return (
        <div className="space-y-4">
          {isQuizForm && answerKeyRange && (
            <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border-2 border-green-400 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-200 to-green-300 flex items-center justify-center">
                  <span className="text-green-700 text-xs font-bold">✓</span>
                </div>
                <span className="text-sm font-bold text-green-800 uppercase tracking-wider">
                  Answer Key
                </span>
              </div>
              <div className="flex flex-row items-center gap-3 font-bold">
                <Chip size="lg" variant="solid" color="default">
                  Start: {answerKeyRange.start}
                </Chip>
                <span className="text-gray-400">→</span>
                <Chip size="lg" variant="solid" color="default">
                  End: {answerKeyRange.end}
                </Chip>
              </div>
            </div>
          )}

          {/* User Response */}
          <div className="bg-white border-2 border-blue-300 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                <span className="text-blue-600 text-xs font-bold">✎</span>
              </div>
              <span className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                User Response
              </span>
            </div>
            {userResponse?.start !== undefined &&
            userResponse?.end !== undefined ? (
              <div className="flex flex-row items-center gap-3 font-bold">
                <Chip size="lg" variant="solid" color="default">
                  Start: {userResponse.start}
                </Chip>
                <span className="text-gray-400">→</span>
                <Chip size="lg" variant="solid" color="default">
                  End: {userResponse.end}
                </Chip>
              </div>
            ) : (
              <Chip size="sm" variant="flat" color="default" className="italic">
                No answer
              </Chip>
            )}
          </div>
        </div>
      );
    };

    // Render Choice Type Question (show all options with selections)
    const renderChoiceContent = () => {
      const hasUserResponse = userSelectedIndices.size > 0;
      const userResponse = resp.response as AnswerKeyPairValueType;

      return (
        <div className="space-y-4">
          {/* All Options with Correct Answer & User Selection */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                Options
              </span>
              {question.type === QuestionType.CheckBox && (
                <Chip size="sm" variant="flat" color="secondary">
                  Multiple Select
                </Chip>
              )}
            </div>
            <div className="space-y-2">
              {choiceOptions.map((option, idx) => {
                const optionIdx = option.idx ?? idx;
                const isUserSelected = userSelectedIndices.has(optionIdx);
                const isCorrectAnswer = correctAnswerIndices.has(optionIdx);

                return (
                  <div
                    key={`option-${question._id}-${idx}`}
                    className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                      isUserSelected && isCorrectAnswer
                        ? "bg-green-50 border-green-400"
                        : isUserSelected && !isCorrectAnswer && isQuizForm
                        ? "bg-red-50 border-red-300"
                        : isCorrectAnswer && isQuizForm
                        ? "bg-green-50 border-green-300 border-dashed"
                        : isUserSelected
                        ? "bg-blue-50 border-blue-300"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          isUserSelected
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {optionIdx + 1}
                      </div>
                      <span
                        className={`font-medium ${
                          isUserSelected ? "text-gray-900" : "text-gray-600"
                        }`}
                      >
                        {option.content}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isQuizForm && isCorrectAnswer && (
                        <Chip
                          size="sm"
                          variant="flat"
                          color="success"
                          startContent={<span>✓</span>}
                        >
                          Correct
                        </Chip>
                      )}
                      {isUserSelected && (
                        <Chip
                          size="sm"
                          variant="flat"
                          color={
                            isQuizForm
                              ? isCorrectAnswer
                                ? "success"
                                : "danger"
                              : "primary"
                          }
                          startContent={<span>👤</span>}
                        >
                          Selected
                        </Chip>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* User Response Summary */}
          <div className="bg-white border-2 border-blue-300 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                <span className="text-blue-600 text-xs font-bold">✎</span>
              </div>
              <span className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                User Response
              </span>
            </div>
            {hasUserResponse ? (
              <div className="flex flex-wrap gap-2">
                {Array.isArray(userResponse?.val)
                  ? userResponse.val.map((val, idx) => {
                      const selectedKey = Array.isArray(userResponse.key)
                        ? userResponse.key[idx]
                        : userResponse.key;
                      const isCorrect =
                        isQuizForm && correctAnswerIndices.has(selectedKey);
                      const isWrong =
                        isQuizForm && !correctAnswerIndices.has(selectedKey);

                      return (
                        <Chip
                          key={idx}
                          size="md"
                          variant={isQuizForm ? "flat" : "bordered"}
                          color={
                            isQuizForm
                              ? isCorrect
                                ? "success"
                                : isWrong
                                ? "danger"
                                : "primary"
                              : "primary"
                          }
                          className="font-medium"
                          startContent={
                            isQuizForm ? (
                              isCorrect ? (
                                <span>✓</span>
                              ) : (
                                <span>✗</span>
                              )
                            ) : undefined
                          }
                        >
                          {val}
                        </Chip>
                      );
                    })
                  : (() => {
                      const selectedKey = userResponse?.key as number;
                      const isCorrect =
                        isQuizForm && correctAnswerIndices.has(selectedKey);
                      const isWrong =
                        isQuizForm && !correctAnswerIndices.has(selectedKey);

                      return (
                        <Chip
                          size="md"
                          variant={isQuizForm ? "flat" : "bordered"}
                          color={
                            isQuizForm
                              ? isCorrect
                                ? "success"
                                : isWrong
                                ? "danger"
                                : "primary"
                              : "primary"
                          }
                          className="font-medium"
                          startContent={
                            isQuizForm ? (
                              isCorrect ? (
                                <span>✓</span>
                              ) : (
                                <span>✗</span>
                              )
                            ) : undefined
                          }
                        >
                          {userResponse?.val}
                        </Chip>
                      );
                    })()}
              </div>
            ) : (
              <Chip size="sm" variant="flat" color="default" className="italic">
                No answer
              </Chip>
            )}
          </div>

          {/* Correct Answer Summary - Show when user got it wrong */}
          {isQuizForm &&
            correctAnswerIndices.size > 0 &&
            (() => {
              // Check if user got any answer wrong
              const userKeys = Array.isArray(
                (resp.response as AnswerKeyPairValueType)?.key
              )
                ? ((resp.response as AnswerKeyPairValueType).key as number[])
                : [
                    (resp.response as AnswerKeyPairValueType)?.key as number,
                  ].filter(Boolean);

              const hasWrongAnswer =
                userKeys.length === 0 ||
                userKeys.some((k) => !correctAnswerIndices.has(k)) ||
                [...correctAnswerIndices].some((k) => !userKeys.includes(k));

              if (!hasWrongAnswer) return null;

              const correctOptions = choiceOptions.filter((opt) =>
                correctAnswerIndices.has(opt.idx ?? choiceOptions.indexOf(opt))
              );

              return (
                <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border-2 border-green-400 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-200 to-green-300 flex items-center justify-center">
                      <span className="text-green-700 text-xs font-bold">
                        ✓
                      </span>
                    </div>
                    <span className="text-sm font-bold text-green-800 uppercase tracking-wider">
                      Correct Answer
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {correctOptions.map((opt, idx) => (
                      <Chip
                        key={idx}
                        size="md"
                        variant="flat"
                        color="success"
                        className="font-medium"
                        startContent={<span>✓</span>}
                      >
                        {opt.content}
                      </Chip>
                    ))}
                  </div>
                </div>
              );
            })()}
        </div>
      );
    };

    // Helper to render response value properly
    const renderResponseValue = (value: ResponseValueType) => {
      if (!value) return null;

      // Handle CheckBox array response
      if (Array.isArray(value)) {
        return (
          <div className="flex flex-col gap-2">
            {value.map((item) => {
              const val = item as AnswerKeyPairValueType;
              return (
                <Chip
                  size="md"
                  key={val.key as never}
                  variant="flat"
                  color="primary"
                  className="font-bold text-black"
                >
                  {val.val}
                </Chip>
              );
            })}
          </div>
        );
      }

      // Handle simple string response
      if (typeof value === "string") {
        return <span className="font-medium">{value}</span>;
      }

      return null;
    };

    // Helper to render answer key based on its type
    const renderAnswerKey = (
      answerData:
        | AnswerKey
        | AnswerKeyPairValueType[]
        | AnswerKeyPairValueType
        | undefined
    ): React.ReactNode => {
      if (!answerData) return null;

      // Check if it's AnswerKey type (has 'answer' property)
      if (typeof answerData === "object" && "answer" in answerData) {
        const answerKey = answerData as AnswerKey;
        const answer = answerKey.answer;

        // Handle Array of numbers (checkbox answers)
        if (Array.isArray(answer)) {
          return (
            <div className="flex flex-wrap gap-2">
              {answer.map((idx, i) => (
                <Chip key={i} size="md" variant="flat" color="success">
                  Option {idx + 1}
                </Chip>
              ))}
            </div>
          );
        }

        // Handle simple string/number answer
        if (typeof answer === "string" || typeof answer === "number") {
          return (
            <Chip
              size="md"
              variant="solid"
              color="default"
              className="font-bold"
            >
              {String(answer)}
            </Chip>
          );
        }
      }

      // Check if it's AnswerKeyPairValueType array
      if (Array.isArray(answerData)) {
        return (
          <div className="flex flex-wrap gap-2">
            {answerData.map((item, idx) => {
              const pair = item as AnswerKeyPairValueType;
              return (
                <Chip
                  key={idx}
                  size="md"
                  variant="flat"
                  color="success"
                  className="font-medium"
                >
                  {Array.isArray(pair.val) ? pair.val.join(", ") : pair.val}
                </Chip>
              );
            })}
          </div>
        );
      }

      // Check if it's AnswerKeyPairValueType (has 'key' and 'val' properties)
      if (
        typeof answerData === "object" &&
        "key" in answerData &&
        "val" in answerData
      ) {
        const pair = answerData as AnswerKeyPairValueType;
        if (Array.isArray(pair.val)) {
          return (
            <div className="flex flex-wrap gap-2">
              {pair.val.map((val, idx) => (
                <Chip
                  key={idx}
                  size="md"
                  variant="flat"
                  color="success"
                  className="font-medium"
                >
                  {val}
                </Chip>
              ))}
            </div>
          );
        }
        return (
          <Chip
            size="md"
            variant="flat"
            color="success"
            className="font-medium"
          >
            {pair.val}
          </Chip>
        );
      }

      // Fallback: render as string
      return (
        <span className="font-medium text-green-900">{String(answerData)}</span>
      );
    };

    // Render Other Question Types
    const renderOtherContent = () => {
      const hasAnswerKey =
        question.answer !== undefined && question.answer !== null;

      return (
        <div className="space-y-4">
          {isQuizForm && hasAnswerKey && (
            <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border-2 border-green-400 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-200 to-green-300 flex items-center justify-center">
                  <span className="text-green-700 text-xs font-bold">✓</span>
                </div>
                <span className="text-sm font-bold text-green-800 uppercase tracking-wider">
                  Answer Key
                </span>
              </div>
              <div className="text-green-900 font-medium">
                {renderAnswerKey(question.answer)}
              </div>
            </div>
          )}

          {/* User Response */}
          <div className="bg-white border-2 border-blue-300 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                <span className="text-blue-600 text-xs font-bold">✎</span>
              </div>
              <span className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                User Response
              </span>
            </div>
            <div className="text-gray-900">
              {renderResponseValue(resp.response) || (
                <Chip
                  size="sm"
                  variant="flat"
                  color="default"
                  className="italic"
                >
                  No answer
                </Chip>
              )}
            </div>
          </div>
        </div>
      );
    };

    // Main content renderer based on question type
    const renderMainContent = () => {
      if (questionTypeInfo.isRange) {
        return renderRangeContent();
      }
      if (questionTypeInfo.isChoice) {
        return renderChoiceContent();
      }
      return renderOtherContent();
    };

    // Text type question
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
                <Chip
                  size="md"
                  color="primary"
                  className="dark:text-white"
                  variant="bordered"
                >
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

    // Non-text questions
    return (
      <Card className="shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-gray-200 hover:border-blue-300 bg-gradient-to-br from-white to-gray-50 dark:bg-black">
        {question.parentcontent && (
          <div className="w-full h-fit p-3 dark:text-black">
            <ConditionalIndicator
              question={question}
              questions={allQuestions}
            />
          </div>
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
                {isQuizForm && question.score && (
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

              {/* Response Content - Type-specific rendering */}
              {renderMainContent()}
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

          {/* Score Mode Input */}
          {question.score &&
            onScoreUpdate &&
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
