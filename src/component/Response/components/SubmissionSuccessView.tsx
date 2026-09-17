import React, { useState, useEffect } from "react";
import { Button } from "@heroui/react";
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
    scoreData.isScoreReleased !== false &&
    typeof scoreData.totalScore === "number" &&
    typeof scoreData.maxScore === "number" &&
    scoreData.maxScore > 0;

  const scorePercentage =
    hasScore && scoreData.maxScore
      ? Math.round((scoreData.totalScore / scoreData.maxScore) * 100)
      : null;

  const circumference = 2 * Math.PI * 36;
  const targetOffset =
    scorePercentage !== null
      ? circumference - (scorePercentage / 100) * circumference
      : circumference;

  const [animatedOffset, setAnimatedOffset] = useState(circumference);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedOffset(targetOffset), 200);
    return () => clearTimeout(timer);
  }, [targetOffset]);

  let subMessage = "";
  if (formType === FormTypeEnum.Quiz && !hasScore) {
    subMessage =
      scoreData?.message ||
      "Results will be reviewed and returned by the form owner.";
  }

  return (
    <div className="max-w-2xl mx-auto p-6 respondent-form">
      {/* Success Header */}
      <div className="success-submission-wrapper">
        <div className="success-icon-container">
          <svg
            className="success-checkmark-svg"
            viewBox="0 0 52 52"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <circle
              className="success-checkmark-circle"
              cx="26"
              cy="26"
              r="23"
              fill="none"
            />
            <path
              className="success-checkmark-path"
              fill="none"
              d="M14 27l7.5 7.5L38 18"
            />
          </svg>
        </div>
        <h2 className="success-submission-title">Submitted Successfully!</h2>
        <p className="success-submission-message">
          Thank you for your response. Your submission has been recorded.
        </p>
        {subMessage && (
          <p className="success-submission-submessage">{subMessage}</p>
        )}
      </div>

      {/* Score Card */}
      {hasScore && scoreData && (
        <div className="success-score-card">
          <p className="success-score-label">Your Score</p>

          <div className="success-score-ring-wrapper">
            <svg
              className="success-score-ring-svg"
              viewBox="0 0 88 88"
              aria-label={`Score: ${scorePercentage}%`}
            >
              <circle
                cx="44"
                cy="44"
                r="36"
                fill="none"
                stroke="currentColor"
                strokeWidth="7"
                className="success-score-ring-bg"
              />
              <circle
                cx="44"
                cy="44"
                r="36"
                fill="none"
                strokeWidth="7"
                strokeLinecap="round"
                className="success-score-ring-progress"
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset: animatedOffset,
                  transform: "rotate(-90deg)",
                  transformOrigin: "center",
                  transition:
                    "stroke-dashoffset 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
                }}
              />
            </svg>
            <div className="success-score-ring-text">
              <span className="success-score-percentage">
                {scorePercentage}%
              </span>
            </div>
          </div>

          <p className="success-score-fraction">
            {scoreData.totalScore} / {scoreData.maxScore}
          </p>

          {scoreData.extraScore != null && scoreData.extraScore > 0 && (
            <p className="success-score-extra">
              +{scoreData.extraScore} bonus pt
              {scoreData.extraScore !== 1 ? "s" : ""}
            </p>
          )}

          <p className="success-score-disclaimer">
            This score might not be final.
          </p>

          {scoreData.message && (
            <div className="success-score-message-box">
              <span className="mr-2 text-base">📝</span>
              <span>{scoreData.message}</span>
            </div>
          )}

          {scoreData.responseId && scoreData.respondentEmail && (
            <Button
              className="responseCopy font-semibold mt-1 text-black dark:text-black"
              variant="flat"
              color="success"
              onPress={onSendCopy}
              isLoading={isSendingCopy}
            >
              Send a copy of the response
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
