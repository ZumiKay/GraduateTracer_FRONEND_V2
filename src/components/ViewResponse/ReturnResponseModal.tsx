import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
  Switch,
} from "@heroui/react";
import { FiSend } from "react-icons/fi";

interface ReturnResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  isLoading: boolean;
  respondentEmail?: string;
  currentScore?: number;
  maxScore?: number;
  isQuizForm: boolean;
  returnReason: string;
  setReturnReason: (value: string) => void;
  returnFeedback: string;
  setReturnFeedback: (value: string) => void;
  returnAdditionalInfo: string;
  setReturnAdditionalInfo: (value: string) => void;
  includeQuestionsAndResponses: boolean;
  setIncludeQuestionsAndResponses: (value: boolean) => void;
}

const ReturnResponseModal: React.FC<ReturnResponseModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  respondentEmail,
  currentScore,
  maxScore,
  isQuizForm,
  returnReason,
  setReturnReason,
  returnFeedback,
  setReturnFeedback,
  returnAdditionalInfo,
  setReturnAdditionalInfo,
  includeQuestionsAndResponses,
  setIncludeQuestionsAndResponses,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalContent>
        {(onCloseModal) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <h3 className="text-xl font-bold">
                Return Response to Respondent
              </h3>
              <p className="text-sm text-gray-500 font-normal">
                This will send an email to {respondentEmail || "the respondent"}{" "}
                with the information below.
              </p>
            </ModalHeader>
            <ModalBody className="gap-4">
              <Input
                label="Reason for Return"
                placeholder="e.g., Incomplete answers, missing information"
                value={returnReason}
                onValueChange={setReturnReason}
                variant="bordered"
                labelPlacement="outside"
                description="Optional: Brief reason why the response is being returned"
              />

              <Textarea
                label="Feedback"
                placeholder="Provide constructive feedback to help the respondent improve their submission..."
                value={returnFeedback}
                onValueChange={setReturnFeedback}
                variant="bordered"
                labelPlacement="outside"
                minRows={4}
                description="Optional: Detailed feedback for the respondent"
              />

              <Textarea
                label="Additional Information"
                placeholder="Any other information you'd like to include in the email..."
                value={returnAdditionalInfo}
                onValueChange={setReturnAdditionalInfo}
                variant="bordered"
                labelPlacement="outside"
                minRows={6}
                description="This will be included in the email body"
                isRequired
              />

              <Switch
                isSelected={includeQuestionsAndResponses}
                onValueChange={setIncludeQuestionsAndResponses}
                classNames={{
                  base: "inline-flex flex-row-reverse w-full max-w-full bg-content1 hover:bg-content2 items-center justify-between cursor-pointer rounded-lg gap-2 p-4 border-2 border-transparent data-[selected=true]:border-primary",
                  wrapper: "p-0 h-4 overflow-visible",
                  thumb:
                    "w-6 h-6 border-2 shadow-lg group-data-[selected=true]:ml-6",
                }}
              >
                <div className="flex flex-col gap-1">
                  <p className="text-medium font-semibold">
                    Include Questions and Responses
                  </p>
                  <p className="text-tiny text-default-400">
                    Include all questions and the respondent's answers in the
                    return email
                  </p>
                </div>
              </Switch>

              {isQuizForm &&
                currentScore !== undefined &&
                maxScore !== undefined && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Current Score:</strong> {currentScore} /{" "}
                      {maxScore} points
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      The current score will be included in the email.
                    </p>
                  </div>
                )}
            </ModalBody>
            <ModalFooter>
              <Button
                color="default"
                variant="light"
                onPress={onCloseModal}
                isDisabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                color="warning"
                variant="solid"
                onPress={onSubmit}
                isLoading={isLoading}
                isDisabled={!returnAdditionalInfo.trim() || isLoading}
                startContent={isLoading ? undefined : <FiSend />}
              >
                {isLoading ? "Sending..." : "Send Return Email"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default ReturnResponseModal;
