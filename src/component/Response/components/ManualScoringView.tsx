import React, { useState, useCallback } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Chip,
  Input,
  Select,
  SelectItem,
  Divider,
} from "@heroui/react";
import {
  FormDataType,
  ContentType,
  QuestionType,
} from "../../../types/Form.types";
import { getResponseDisplayName } from "../../../utils/respondentUtils";
import {
  ResponseDataType,
  ResponseValueType,
  AnswerKeyPairValueType,
} from "../Response.type";
import StyledTiptap from "./StyledTiptap";

interface ManualScoringViewProps {
  responses: ResponseDataType[]; // Manual scoring requires full response data
  form: FormDataType;
  manualScores: Record<string, number>;
  onScoreUpdate: (
    responseId: string,
    questionId: string,
    score: number
  ) => void;
}

const ManualScoringView: React.FC<ManualScoringViewProps> = ({
  responses,
  form,
  manualScores,
  onScoreUpdate,
}) => {
  const [selectedRespondent, setSelectedRespondent] = useState<string>(
    responses[0]?._id || ""
  );

  const isAutoScoreable = (questionType: QuestionType) => {
    const notAutoScoreable = [
      QuestionType.ShortAnswer,
      QuestionType.Paragraph,
      QuestionType.Text,
    ];

    return !notAutoScoreable.includes(questionType);
  };

  const renderAnswer = useCallback(
    (response: ResponseValueType, qType: QuestionType) => {
      switch (qType) {
        case QuestionType.CheckBox:
          return (
            <div className="flex flex-wrap gap-2">
              {/* {(response as Array<AnswerKeyPairValueType>)?.map((res, idx) => (
                <Chip
                  key={idx}
                  size="sm"
                  variant="flat"
                  color="primary"
                  className="font-medium"
                >
                  {res.val}
                </Chip>
              ))} */}
              {JSON.stringify(response)}
            </div>
          );

        case QuestionType.MultipleChoice:
        case QuestionType.Selection: {
          const singleResponse = response as AnswerKeyPairValueType;
          return (
            <Chip
              size="sm"
              variant="flat"
              color="primary"
              className="font-medium"
            >
              {singleResponse.val}
            </Chip>
          );
        }

        default:
          return (
            <span className="font-medium text-gray-900">
              {String(response)}
            </span>
          );
      }
    },
    []
  );

  const getQuestionById = (questionId: string) => {
    return form.contents?.find((q: ContentType) => q._id === questionId);
  };

  const getRespondentName = (response: ResponseDataType) => {
    return getResponseDisplayName(response);
  };

  const getRespondentEmail = (response: ResponseDataType) => {
    return response.respondentEmail || response.guest?.email || "N/A";
  };

  const calculateCurrentScore = (response: ResponseDataType) => {
    return response.responseset.reduce((total, resp) => {
      const currentScore =
        manualScores[`${response._id}-${resp.question._id}`] ?? resp.score ?? 0;
      return total + currentScore;
    }, 0);
  };

  const getTotalPossibleScore = (response: ResponseDataType) => {
    return response.responseset.reduce((total, resp) => {
      const question = getQuestionById(resp.question._id || "");
      return total + (question?.score || 0);
    }, 0);
  };

  const selectedResponse = responses.find((r) => r._id === selectedRespondent);

  if (responses.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">
          No responses available for manual scoring
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Respondent Selection */}
      <Card className="shadow-sm border-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="p-6">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Select Respondent:
            </h3>
            <Select
              label="Choose a respondent to score"
              placeholder="Select respondent"
              selectedKeys={selectedRespondent ? [selectedRespondent] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                setSelectedRespondent(selected);
              }}
              className="max-w-md"
            >
              {responses.map((response) => {
                const currentScore = calculateCurrentScore(response);
                const totalPossible = getTotalPossibleScore(response);
                const scoredQuestions = response.responseset.filter(
                  (resp) =>
                    manualScores[`${response._id}-${resp.question._id}`] !==
                      undefined ||
                    (resp.score !== undefined && resp.score > 0)
                ).length;

                return (
                  <SelectItem
                    key={response._id}
                    textValue={getRespondentName(response)}
                  >
                    <div className="flex justify-between items-center w-full">
                      <div>
                        <div className="font-medium">
                          {getRespondentName(response)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {getRespondentEmail(response)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {currentScore}/{totalPossible} pts
                        </div>
                        <div className="text-xs text-gray-500">
                          {scoredQuestions}/{response.responseset.length} scored
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                );
              })}
            </Select>
          </div>
        </div>
      </Card>

      {selectedResponse && (
        <div>
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start w-full">
                <div>
                  <h3 className="text-lg font-semibold">
                    {getRespondentName(selectedResponse)}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {getRespondentEmail(selectedResponse)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Submitted:{" "}
                    {selectedResponse.submittedAt
                      ? new Date(
                          selectedResponse.submittedAt
                        ).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">
                    {calculateCurrentScore(selectedResponse)}/
                    {getTotalPossibleScore(selectedResponse)}
                  </div>
                  <p className="text-sm text-gray-500">Total Score</p>
                  <Chip
                    size="sm"
                    color={
                      selectedResponse.completionStatus === "completed"
                        ? "success"
                        : "warning"
                    }
                    variant="flat"
                    className="mt-1"
                  >
                    {selectedResponse.completionStatus || "partial"}
                  </Chip>
                </div>
              </div>
            </CardHeader>
          </Card>

          <div className="space-y-4">
            {selectedResponse.responseset.map((resp, index) => {
              const question = getQuestionById(resp.question._id || "");
              const isAutoScore = question
                ? isAutoScoreable(question.type)
                : false;
              const currentQuestionScore =
                manualScores[`${selectedResponse._id}-${resp.question._id}`] ??
                resp.score ??
                0;
              const maxScore = question?.score || 0;

              return (
                <Card
                  key={`${selectedResponse._id}-${resp.question._id}-${index}`}
                  className="shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <div className="p-5 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          <Chip
                            size="sm"
                            color="secondary"
                            variant="flat"
                            className="font-medium"
                          >
                            Q{index + 1}
                          </Chip>
                          {question && (
                            <Chip size="sm" color="primary" variant="bordered">
                              {question.type}
                            </Chip>
                          )}
                          {isAutoScore && (
                            <Chip size="sm" color="success" variant="flat">
                              Auto-Scored
                            </Chip>
                          )}
                          {resp.isManuallyScored && (
                            <Chip size="sm" color="warning" variant="flat">
                              Manual
                            </Chip>
                          )}
                        </div>

                        {question?.title && (
                          <div className="bg-gray-50 rounded-lg p-4 mb-3">
                            <StyledTiptap
                              value={question.title as never}
                              readonly
                              variant="question"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Response Display */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          Answer:
                        </span>
                      </div>
                      <div className="text-gray-900">
                        {renderAnswer(resp.response, resp.question.type)}
                      </div>
                    </div>

                    {/* Correct Answer (if available) */}
                    {question?.answer && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-green-700">
                            Correct Answer:
                          </span>
                        </div>
                        <div className="text-green-800">
                          {renderAnswer(
                            question.answer as never,
                            question.type
                          )}
                        </div>
                      </div>
                    )}

                    <Divider />

                    {/* Score Input Section */}
                    <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-700">
                          Score:
                        </span>
                        <Input
                          type="number"
                          size="sm"
                          placeholder="0"
                          value={currentQuestionScore.toString()}
                          onChange={(e) => {
                            const score = Math.max(
                              0,
                              Math.min(maxScore, parseInt(e.target.value) || 0)
                            );
                            onScoreUpdate(
                              selectedResponse._id,
                              resp.question._id || "",
                              score
                            );
                          }}
                          className="w-20"
                          disabled={isAutoScore}
                          min={0}
                          max={maxScore}
                        />
                        <span className="text-sm text-gray-500">
                          / {maxScore} points
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {currentQuestionScore === maxScore && maxScore > 0 && (
                          <Chip size="sm" color="success" variant="flat">
                            Perfect!
                          </Chip>
                        )}
                        {isAutoScore && (
                          <Chip size="sm" color="primary" variant="flat">
                            Auto-scored
                          </Chip>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Summary Footer */}
          <Card className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardBody>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">
                    Questions Scored:{" "}
                    {
                      selectedResponse.responseset.filter(
                        (resp) =>
                          manualScores[
                            `${selectedResponse._id}-${resp.question._id}`
                          ] !== undefined ||
                          (resp.score !== undefined && resp.score > 0)
                      ).length
                    }
                    /{selectedResponse.responseset.length}
                  </p>
                  <p className="text-xs text-gray-500">
                    {selectedResponse.responseset.filter(
                      (resp) =>
                        manualScores[
                          `${selectedResponse._id}-${resp.question._id}`
                        ] !== undefined ||
                        (resp.score !== undefined && resp.score > 0)
                    ).length === selectedResponse.responseset.length
                      ? "All questions have been scored"
                      : `${
                          selectedResponse.responseset.length -
                          selectedResponse.responseset.filter(
                            (resp) =>
                              manualScores[
                                `${selectedResponse._id}-${resp.question._id}`
                              ] !== undefined ||
                              (resp.score !== undefined && resp.score > 0)
                          ).length
                        } questions remaining`}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-primary">
                    {calculateCurrentScore(selectedResponse)} /{" "}
                    {getTotalPossibleScore(selectedResponse)}
                  </div>
                  <p className="text-sm text-gray-600">
                    {getTotalPossibleScore(selectedResponse) > 0
                      ? Math.round(
                          (calculateCurrentScore(selectedResponse) /
                            getTotalPossibleScore(selectedResponse)) *
                            100
                        )
                      : 0}
                    %
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ManualScoringView;
