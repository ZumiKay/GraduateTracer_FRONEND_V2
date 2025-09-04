import React, { useCallback, useMemo } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Card,
  Chip,
  Divider,
  CircularProgress,
} from "@heroui/react";
import {
  FormDataType,
  FormTypeEnum,
  QuestionType,
  ContentType,
} from "../../../types/Form.types";
import {
  AnswerKeyPairValueType,
  ResponseDataType,
  ResponseSetType,
  ResponseValueType,
  statusColor,
} from "../Response.type";
import { getResponseDisplayName } from "../../../utils/respondentUtils";
import StyledTiptap from "./StyledTiptap";
import { ConditionalIndicator } from "./ConditionalIndicator";

interface ViewResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedResponse: ResponseDataType | null;
  form: FormDataType;
  onEditScore: () => void;
  formatDate: (date: Date) => string;
  getStatusColor: (status: string) => statusColor;
  isLoading: boolean;
}

const ResponseItem = React.memo<{
  response: ResponseSetType;
  question: ContentType;
  isAutoScore: boolean;
  isQuizForm: boolean;
  allQuestions: ContentType[];
  renderAnswer: (
    response: ResponseValueType,
    qType: QuestionType
  ) => React.ReactNode;
}>(
  ({
    response: resp,
    question,
    isAutoScore,
    isQuizForm,
    allQuestions,
    renderAnswer,
  }) => (
    <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="p-5">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 space-y-4">
            {/* Question Header */}
            <div className="flex items-center gap-2 flex-wrap">
              {question.qIdx && !question.parentcontent ? (
                <Chip
                  size="sm"
                  color="secondary"
                  variant="flat"
                  className="font-medium"
                >
                  Q{question.qIdx}
                </Chip>
              ) : (
                <ConditionalIndicator
                  question={question}
                  questions={allQuestions}
                />
              )}
              <Chip size="sm" color="primary" variant="bordered">
                {question?.type || "Unknown"}
              </Chip>
              {isQuizForm && (
                <Chip
                  size="sm"
                  color={isAutoScore ? "success" : "warning"}
                  variant="flat"
                >
                  {isAutoScore ? "Auto-Scored" : "Manual"}
                </Chip>
              )}
            </div>

            {/* Question Title */}
            {question?.title && (
              <div className="bg-gray-50 rounded-lg p-4">
                <StyledTiptap
                  value={question.title as never}
                  readonly
                  variant="question"
                />
              </div>
            )}

            {/* Answer */}
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

            {/* Correct Answer (Quiz Only) */}
            {question?.answer && isQuizForm && (
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
          </div>

          {isQuizForm && (
            <div className="flex flex-col items-end gap-2 min-w-[100px]">
              <div className="bg-gray-50 rounded-lg px-3 py-2 text-center">
                <div className="text-lg font-bold text-gray-900">
                  {resp.score || 0}
                </div>
                <div className="text-xs text-gray-500">
                  of {question?.score || 0}
                </div>
              </div>
              <div className="text-xs text-gray-500">points</div>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
);

ResponseItem.displayName = "ResponseItem";

const ViewResponseModal = React.memo<ViewResponseModalProps>(
  ({
    isOpen,
    onClose,
    selectedResponse,
    form,
    onEditScore,
    formatDate,
    getStatusColor,
    isLoading,
  }) => {
    const isQuizForm = form.type === FormTypeEnum.Quiz;

    const isAutoScoreable = useCallback((questionType: QuestionType) => {
      return ![
        QuestionType.ShortAnswer,
        QuestionType.Paragraph,
        QuestionType.Text,
      ].includes(questionType as never);
    }, []);

    const computedData = useMemo(() => {
      if (!selectedResponse) return null;

      const displayName = getResponseDisplayName(selectedResponse);
      const email =
        selectedResponse.respondentEmail ||
        selectedResponse.guest?.email ||
        "No email provided";
      const totalScore = selectedResponse.totalScore || 0;
      const submittedDate = selectedResponse.submittedAt
        ? formatDate(selectedResponse.submittedAt)
        : "Not yet submitted";

      return { displayName, email, totalScore, submittedDate };
    }, [selectedResponse, formatDate]);

    const renderAnswer = useCallback(
      (response: ResponseValueType, qType: QuestionType) => {
        switch (qType) {
          case QuestionType.CheckBox: {
            const ress = response as AnswerKeyPairValueType;
            return (
              <div className="flex flex-col gap-2">
                {Array.isArray(ress.key) &&
                  ress.key.map((key, idx) => (
                    <Chip
                      size="md"
                      key={idx}
                      variant="bordered"
                      color="primary"
                      className="font-medium text-sm"
                    >
                      {`${key} – ${ress.val[idx]}`}
                    </Chip>
                  ))}
              </div>
            );
          }

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

    // Memoize response items for better performance
    const responseItems = useMemo(() => {
      if (!selectedResponse) return [];

      return selectedResponse.responseset?.map(
        (resp: ResponseSetType, index: number) => {
          const question = resp.question;
          const isAutoScore = question ? isAutoScoreable(question.type) : false;

          return {
            id: `${resp._id}-${index}`,
            response: resp,
            question,
            isAutoScore,
            index,
          };
        }
      );
    }, [selectedResponse, isAutoScoreable]);

    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="4xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h3 className="text-xl font-semibold">Response Summary</h3>
                <p className="text-sm text-gray-500 font-normal">
                  Detailed view of response data and scores
                </p>
              </ModalHeader>
              <ModalBody className="px-6 flex flex-col items-center">
                {isLoading && <CircularProgress />}
                {selectedResponse && computedData && (
                  <div className="space-y-6">
                    {/* Respondent Information Card */}
                    <Card className="shadow-sm border-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
                      <div className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="space-y-2">
                            <h4 className="text-xl font-semibold text-gray-900">
                              {computedData.displayName}
                            </h4>
                            <p className="text-gray-600 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                              {computedData.email}
                            </p>
                          </div>
                          <div className="flex flex-col lg:items-end gap-3">
                            {isQuizForm && (
                              <div className="bg-white/70 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
                                <div className="text-2xl font-bold text-blue-600">
                                  {computedData.totalScore}
                                </div>
                                <div className="text-sm text-gray-600">
                                  Total Points
                                </div>
                              </div>
                            )}
                            <div className="flex flex-wrap gap-2">
                              <Chip
                                size="md"
                                color={getStatusColor(
                                  selectedResponse.completionStatus || "default"
                                )}
                                variant="flat"
                                className="font-medium"
                              >
                                {selectedResponse.completionStatus || "Unknown"}
                              </Chip>
                              {selectedResponse.isManuallyScored && (
                                <Chip
                                  size="md"
                                  color="warning"
                                  variant="flat"
                                  className="font-medium"
                                >
                                  Manually Scored
                                </Chip>
                              )}
                            </div>
                          </div>
                        </div>
                        <Divider className="my-4" />
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="font-medium">Submitted:</span>
                          <span>{computedData.submittedDate}</span>
                        </div>
                      </div>
                    </Card>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h5 className="text-lg font-semibold text-gray-900">
                          Question Responses
                        </h5>
                        <Chip size="sm" variant="flat" color="default">
                          {responseItems.length} questions
                        </Chip>
                      </div>

                      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                        {responseItems.map(
                          ({ id, response: resp, question, isAutoScore }) => (
                            <ResponseItem
                              key={id}
                              response={resp}
                              question={question}
                              isAutoScore={isAutoScore}
                              isQuizForm={isQuizForm}
                              allQuestions={selectedResponse.responseset.map(
                                (i) => i.question
                              )}
                              renderAnswer={renderAnswer}
                            />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </ModalBody>
              <ModalFooter className="justify-between">
                <div className="text-sm text-gray-500">
                  {selectedResponse &&
                    `${responseItems.length} questions answered`}
                </div>
                <div className="flex gap-2">
                  <Button variant="light" onClick={onClose}>
                    Close
                  </Button>
                  {isQuizForm && selectedResponse && (
                    <Button color="primary" onClick={onEditScore}>
                      Edit Scores
                    </Button>
                  )}
                </div>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    );
  }
);

ViewResponseModal.displayName = "ViewResponseModal";

export default ViewResponseModal;
