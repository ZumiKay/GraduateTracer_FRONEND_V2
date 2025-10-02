import React, { useState, useCallback, useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Chip,
  Input,
  Button,
  Divider,
  Spinner,
  Select,
  SelectItem,
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
  ScoringMethod,
} from "../Response.type";
import StyledTiptap from "./StyledTiptap";
import useResponseById, {
  useGetAllUniqueRespondent,
} from "../hooks/useResponseById";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

interface ManualScoringViewProps {
  formId: string;
  form: FormDataType;
  onScoreUpdate: (
    responseId: string,
    questionId: string,
    score: number
  ) => void;
}

const ManualScoringView: React.FC<ManualScoringViewProps> = ({
  formId,
  form,
  onScoreUpdate,
}) => {
  const [selectedRespondentEmail, setSelectedRespondentEmail] =
    useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [manualScores, setManualScores] = useState<Record<string, number>>({});
  const [scoringMethods, setScoringMethods] = useState<
    Record<string, ScoringMethod>
  >({});

  // Get unique respondents using the hook
  const {
    uniqueRespondents,
    isLoading: isLoadingRespondents,
    error: respondentsError,
  } = useGetAllUniqueRespondent(formId);

  const { responseData, isLoading, error } = useResponseById({
    formId,
    respondentEmail: selectedRespondentEmail,
    page: currentPage,
  });

  const currentResponse = responseData?.responses?.[0];
  const pagination = responseData?.pagination;

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedRespondentEmail]);

  const handleScoreUpdate = useCallback(
    (responseId: string, questionId: string, score: number) => {
      const scoreKey = `${responseId}-${questionId}`;
      setManualScores((prev) => ({ ...prev, [scoreKey]: score }));
      setScoringMethods((prev) => ({
        ...prev,
        [scoreKey]: ScoringMethod.MANUAL,
      }));
      onScoreUpdate(responseId, questionId, score);
    },
    [onScoreUpdate]
  );

  // Navigation functions
  const goToPreviousResponse = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  }, [currentPage]);

  const goToNextResponse = useCallback(() => {
    if (pagination && currentPage < pagination.totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [currentPage, pagination]);

  // Initialize scores and methods when response changes
  useEffect(() => {
    if (currentResponse) {
      const initialScores: Record<string, number> = {};
      const initialMethods: Record<string, ScoringMethod> = {};

      currentResponse.responseset.forEach((resp) => {
        const scoreKey = `${currentResponse._id}-${resp.question._id}`;
        if (resp.score !== undefined) {
          initialScores[scoreKey] = resp.score;
        }
        initialMethods[scoreKey] = resp.scoringMethod || ScoringMethod.NONE;
      });

      setManualScores(initialScores);
      setScoringMethods(initialMethods);
    }
  }, [currentResponse]);

  const renderAnswer = useCallback(
    (response: ResponseValueType, qType: QuestionType) => {
      switch (qType) {
        case QuestionType.CheckBox:
          return (
            <div className="flex flex-wrap gap-2">
              {(response as Array<AnswerKeyPairValueType>)?.map((res, idx) => (
                <Chip
                  key={idx}
                  size="sm"
                  variant="flat"
                  color="primary"
                  className="font-medium"
                >
                  {res.val}
                </Chip>
              ))}
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

  const canBeScored = (qType: QuestionType) => {
    return qType !== QuestionType.Text;
  };

  const calculateCurrentScore = (response: ResponseDataType) => {
    return response.responseset.reduce((total, resp) => {
      const scoreKey = `${response._id}-${resp.question._id}`;
      const currentScore = manualScores[scoreKey] ?? resp.score ?? 0;
      return total + currentScore;
    }, 0);
  };

  const getTotalPossibleScore = (response: ResponseDataType) => {
    return response.responseset.reduce((total, resp) => {
      const question = getQuestionById(resp.question._id || "");
      return total + (question?.score || 0);
    }, 0);
  };

  // Show respondent selection if no email is selected
  if (!selectedRespondentEmail) {
    return (
      <div className="w-full space-y-6">
        <Card className="shadow-sm border-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
          <div className="p-6">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Select Respondent for Manual Scoring:
              </h3>

              {isLoadingRespondents ? (
                <div className="flex items-center gap-2">
                  <Spinner size="sm" />
                  <span className="text-sm text-gray-600">
                    Loading respondents...
                  </span>
                </div>
              ) : respondentsError ? (
                <div className="text-red-500 text-sm">
                  Error loading respondents: {respondentsError.message}
                </div>
              ) : (
                <Select
                  label="Choose a respondent to score"
                  placeholder="Select respondent"
                  selectedKeys={
                    selectedRespondentEmail ? [selectedRespondentEmail] : []
                  }
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setSelectedRespondentEmail(selected);
                  }}
                  className="max-w-md"
                >
                  {uniqueRespondents?.map((respondent) => (
                    <SelectItem
                      key={respondent.respondentEmail}
                      textValue={respondent.respondentEmail}
                    >
                      <div className="flex justify-between items-center w-full">
                        <div>
                          <div className="font-medium">
                            {respondent.respondentName || "Anonymous"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {respondent.respondentEmail}
                          </div>
                          {respondent.responseCount && (
                            <div className="text-xs text-gray-400">
                              {respondent.responseCount} response
                              {respondent.responseCount > 1 ? "s" : ""}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <Chip
                            size="sm"
                            color={
                              respondent.respondentType === "USER"
                                ? "primary"
                                : "secondary"
                            }
                            variant="flat"
                          >
                            {respondent.respondentType || "GUEST"}
                          </Chip>
                        </div>
                      </div>
                    </SelectItem>
                  )) || []}
                </Select>
              )}
            </div>
          </div>
        </Card>

        {!isLoadingRespondents &&
          !respondentsError &&
          uniqueRespondents &&
          uniqueRespondents.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">
                No responses available for manual scoring
              </p>
            </div>
          )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner size="lg" label="Loading responses..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Error loading responses: {String(error)}</p>
      </div>
    );
  }

  if (!currentResponse) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">
          No responses found for {selectedRespondentEmail}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Respondent Selection Header */}
      <Card className="shadow-sm border-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Manual Scoring - {selectedRespondentEmail}
              </h3>
              <Button
                size="sm"
                variant="bordered"
                onPress={() => setSelectedRespondentEmail("")}
              >
                Change Respondent
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Navigation Header */}
      <Card className="shadow-sm">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="bordered"
                  onPress={goToPreviousResponse}
                  isDisabled={currentPage <= 1}
                  startContent={<ChevronLeftIcon className="w-4 h-4" />}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600 px-3">
                  Response {currentPage} of {pagination?.totalPages || 1}
                </span>
                <Button
                  size="sm"
                  variant="bordered"
                  onPress={goToNextResponse}
                  isDisabled={
                    !pagination || currentPage >= pagination.totalPages
                  }
                  endContent={<ChevronRightIcon className="w-4 h-4" />}
                >
                  Next
                </Button>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">
                Total: {pagination?.totalCount || 0} responses from this
                respondent
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Response Header */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start w-full">
            <div>
              <h3 className="text-lg font-semibold">
                {getResponseDisplayName(currentResponse)}
              </h3>
              <p className="text-sm text-gray-600">{selectedRespondentEmail}</p>
              <p className="text-xs text-gray-500 mt-1">
                Submitted:{" "}
                {currentResponse.submittedAt
                  ? new Date(currentResponse.submittedAt).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {calculateCurrentScore(currentResponse)}/
                {getTotalPossibleScore(currentResponse)}
              </div>
              <p className="text-sm text-gray-500">Total Score</p>
              <Chip
                size="sm"
                color={
                  currentResponse.completionStatus === "completed"
                    ? "success"
                    : "warning"
                }
                variant="flat"
                className="mt-1"
              >
                {currentResponse.completionStatus || "partial"}
              </Chip>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Questions */}
      <div className="space-y-4">
        {currentResponse.responseset.map((resp, index) => {
          const question = getQuestionById(resp.question._id || "");
          const scoreKey = `${currentResponse._id}-${resp.question._id}`;
          const currentQuestionScore =
            manualScores[scoreKey] ?? resp.score ?? 0;
          const currentScoringMethod =
            scoringMethods[scoreKey] ||
            resp.scoringMethod ||
            ScoringMethod.NONE;
          const maxScore = question?.score || 0;
          const isScoreable = canBeScored(resp.question.type);

          return (
            <Card
              key={`${currentResponse._id}-${resp.question._id}-${index}`}
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
                      {currentScoringMethod === ScoringMethod.AUTO && (
                        <Chip size="sm" color="success" variant="flat">
                          Auto-Scored
                        </Chip>
                      )}
                      {currentScoringMethod === ScoringMethod.MANUAL && (
                        <Chip size="sm" color="warning" variant="flat">
                          Manual
                        </Chip>
                      )}
                      {!isScoreable && (
                        <Chip size="sm" color="default" variant="flat">
                          Not Scoreable
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
                      {renderAnswer(question.answer as never, question.type)}
                    </div>
                  </div>
                )}

                <Divider />

                {/* Score Input Section */}
                {isScoreable ? (
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
                          handleScoreUpdate(
                            currentResponse._id,
                            resp.question._id || "",
                            score
                          );
                        }}
                        className="w-20"
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
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-100 p-4 rounded-lg text-center">
                    <p className="text-sm text-gray-600">
                      This question type cannot be scored
                    </p>
                  </div>
                )}
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
                  currentResponse.responseset.filter((resp) => {
                    const scoreKey = `${currentResponse._id}-${resp.question._id}`;
                    const hasScore =
                      manualScores[scoreKey] !== undefined ||
                      (resp.score !== undefined && resp.score > 0);
                    const isScoreable = canBeScored(resp.question.type);
                    return hasScore && isScoreable;
                  }).length
                }
                /
                {
                  currentResponse.responseset.filter((resp) =>
                    canBeScored(resp.question.type)
                  ).length
                }
              </p>
              <p className="text-xs text-gray-500">
                {currentResponse.responseset.filter((resp) => {
                  const scoreKey = `${currentResponse._id}-${resp.question._id}`;
                  const hasScore =
                    manualScores[scoreKey] !== undefined ||
                    (resp.score !== undefined && resp.score > 0);
                  const isScoreable = canBeScored(resp.question.type);
                  return hasScore && isScoreable;
                }).length ===
                currentResponse.responseset.filter((resp) =>
                  canBeScored(resp.question.type)
                ).length
                  ? "All scoreable questions have been scored"
                  : `${
                      currentResponse.responseset.filter((resp) =>
                        canBeScored(resp.question.type)
                      ).length -
                      currentResponse.responseset.filter((resp) => {
                        const scoreKey = `${currentResponse._id}-${resp.question._id}`;
                        const hasScore =
                          manualScores[scoreKey] !== undefined ||
                          (resp.score !== undefined && resp.score > 0);
                        const isScoreable = canBeScored(resp.question.type);
                        return hasScore && isScoreable;
                      }).length
                    } scoreable questions remaining`}
              </p>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-primary">
                {calculateCurrentScore(currentResponse)} /{" "}
                {getTotalPossibleScore(currentResponse)}
              </div>
              <p className="text-sm text-gray-600">
                {getTotalPossibleScore(currentResponse) > 0
                  ? Math.round(
                      (calculateCurrentScore(currentResponse) /
                        getTotalPossibleScore(currentResponse)) *
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
  );
};

export default ManualScoringView;
