import React from "react";
import { Button } from "@heroui/react";
import { FormStateCard } from "./FormStateCard";
import { SubmittionProcessionReturnType } from "../Response.type";
import { FormTypeEnum } from "../../../types/Form.types";

interface SubmissionSuccessViewProps {
  formType?: FormTypeEnum;
  submissionResult: SubmittionProcessionReturnType | null;
  formSubmittedResult?: SubmittionProcessionReturnType;
  formIsResponsed?: SubmittionProcessionReturnType;
  onSendCopy: () => void;
  isSendingCopy: boolean;
}

export const SubmissionSuccessView: React.FC<SubmissionSuccessViewProps> = ({
  formType,
  submissionResult,
  formSubmittedResult,
  formIsResponsed,
  onSendCopy,
  isSendingCopy,
}) => {
  const scoreData = submissionResult ?? formSubmittedResult ?? formIsResponsed;

  const hasScore =
    scoreData &&
    !scoreData.isNonScore &&
    typeof scoreData.totalScore === "number" &&
    typeof scoreData.maxScore === "number" &&
    scoreData.maxScore > 0;

  const scorePercentage =
    hasScore && scoreData.maxScore
      ? Math.round((scoreData.totalScore / scoreData.maxScore) * 100)
      : null;

  let subMessage = "";
  if (formType === FormTypeEnum.Quiz) {
    if (hasScore) {
      subMessage = `Your score: ${scoreData.totalScore}/${scoreData.maxScore}`;
      if (scorePercentage !== null) {
        subMessage += ` (${scorePercentage}%)`;
      }
    } else {
      subMessage =
        "Results will be sent to your email address if scoring is enabled.";
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 respondent-form">
      <FormStateCard
        type="success"
        icon="✓"
        title="Form Submitted Successfully!"
        message="Thank you for your response. Your submission has been recorded."
        subMessage={subMessage || undefined}
      />
      {hasScore && scoreData && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex flex-col items-center justify-center">
            <div>
              <h4 className="font-medium text-green-800">Your Score</h4>
              <p className="text-2xl font-bold text-green-600">
                {scoreData.totalScore} / {scoreData.maxScore}
              </p>
              {scorePercentage !== null && (
                <p className="text-sm text-green-600 w-full text-center">
                  ({scorePercentage}%)
                </p>
              )}
            </div>
            <div className="w-full h-fit flex flex-col justify-center">
              {scoreData.message && (
                <div className="flex items-center text-amber-600 text-sm mt-1">
                  <span className="mr-1">📝</span>
                  <span>{scoreData.message}</span>
                </div>
              )}
              {scoreData.responseId && scoreData.respondentEmail && (
                <Button
                  className="responseCopy font-bold text-black dark:text-black"
                  variant="flat"
                  color="success"
                  onPress={onSendCopy}
                  isLoading={isSendingCopy}
                >
                  {`Send a copy of the response`}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
