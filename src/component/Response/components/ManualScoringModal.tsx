import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Card,
  Chip,
  Input,
} from "@heroui/react";
import {
  FormDataType,
  ContentType,
  AnswerKey,
} from "../../../types/Form.types";
import SuccessToast from "../../Modal/AlertModal";
import { getResponseDisplayName } from "../../../utils/respondentUtils";

interface ResponseSetType {
  questionId: string;
  response: string | number | boolean | string[] | number[];
  score?: number;
  isManuallyScored?: boolean;
}

interface ResponseData {
  _id: string;
  formId: string;
  userId?: string;
  guest?: {
    email: string;
    name?: string;
  };
  respondentEmail?: string;
  respondentName?: string;
  totalScore?: number;
  completionStatus?: "completed" | "partial" | "abandoned";
  submittedAt?: Date;
  isManuallyScored?: boolean;
  responseset: ResponseSetType[];
  isCompleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ManualScoringModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedResponse: ResponseData | null;
  form: FormDataType;
  manualScores: Record<string, number>;
  onScoreUpdate: (
    responseId: string,
    questionId: string,
    score: number
  ) => void;
}

const ManualScoringModal: React.FC<ManualScoringModalProps> = ({
  isOpen,
  onClose,
  selectedResponse,
  form,
  manualScores,
  onScoreUpdate,
}) => {
  const isAutoScoreable = (questionType: string) => {
    const autoScoreableTypes = [
      "multiplechoice",
      "checkbox",
      "truefalse",
      "dropdown",
      "rating",
      "scale",
      "yesno",
    ];
    return autoScoreableTypes.includes(questionType.toLowerCase());
  };

  const getQuestionById = (questionId: string) => {
    return form.contents?.find((q: ContentType) => q._id === questionId);
  };

  const getQuestionText = (question: ContentType) => {
    if (!question.title) return "Untitled Question";

    if (typeof question.title === "string") {
      return question.title;
    }

    const content = question.title as {
      content?: Array<{ content?: Array<{ text?: string }> }>;
    };
    if (content?.content?.[0]?.content?.[0]?.text) {
      return content.content[0].content[0].text;
    }

    return "Question text";
  };

  const handleClose = () => {
    onClose();
    SuccessToast({
      title: "Success",
      content: "Manual scoring completed!",
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl">
      <ModalContent>
        <ModalHeader>Manual Scoring - Question by Question</ModalHeader>
        <ModalBody>
          {selectedResponse && (
            <div className="space-y-6">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-semibold">
                    {getResponseDisplayName(selectedResponse)}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {selectedResponse.respondentEmail ||
                      selectedResponse.guest?.email ||
                      "N/A"}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">
                    Total: {selectedResponse.totalScore || 0} points
                  </div>
                  <div className="text-sm text-gray-600">
                    {selectedResponse.isManuallyScored
                      ? "Manually Scored"
                      : "Auto Scored"}
                  </div>
                </div>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {selectedResponse.responseset.map(
                  (resp: ResponseSetType, index: number) => {
                    const question = getQuestionById(resp.questionId || "");
                    const isAutoScore = question
                      ? isAutoScoreable(question.type)
                      : false;
                    const maxScore = question?.score || 0;

                    return (
                      <Card key={index} className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-medium">
                                  Question {index + 1}
                                </span>
                                <Chip
                                  size="sm"
                                  color={isAutoScore ? "success" : "warning"}
                                  variant="flat"
                                >
                                  {isAutoScore
                                    ? "Auto-Scored"
                                    : "Manual Required"}
                                </Chip>
                                <span className="text-sm text-gray-500">
                                  Type: {question?.type || "Unknown"}
                                </span>
                              </div>

                              {question?.title && (
                                <div className="text-sm mb-2 p-2 bg-blue-50 rounded">
                                  <strong>Question:</strong>{" "}
                                  {getQuestionText(question)}
                                </div>
                              )}

                              <div className="p-2 bg-gray-50 rounded">
                                <strong>Response:</strong>{" "}
                                {String(resp.response)}
                              </div>

                              {question?.answer && (
                                <div className="text-sm text-green-600 mt-1">
                                  <strong>Correct Answer:</strong>{" "}
                                  {String(
                                    (question.answer as AnswerKey).answer
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="ml-4 min-w-0">
                              <div className="text-right mb-2">
                                <span className="text-sm text-gray-500">
                                  Score
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  size="sm"
                                  placeholder="0"
                                  value={
                                    manualScores[
                                      `${selectedResponse._id}-${resp.questionId}`
                                    ]?.toString() ||
                                    resp.score?.toString() ||
                                    "0"
                                  }
                                  onChange={(e) => {
                                    const score = Math.min(
                                      parseInt(e.target.value) || 0,
                                      maxScore
                                    );
                                    onScoreUpdate(
                                      selectedResponse._id,
                                      resp.questionId || "",
                                      score
                                    );
                                  }}
                                  className="w-20"
                                  min="0"
                                  max={maxScore}
                                  disabled={isAutoScore}
                                />
                                <span className="text-sm text-gray-500">
                                  / {maxScore}
                                </span>
                              </div>
                              {isAutoScore && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Auto-calculated
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  }
                )}
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onClick={onClose}>
            Close
          </Button>
          <Button color="primary" onClick={handleClose}>
            Save & Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ManualScoringModal;
