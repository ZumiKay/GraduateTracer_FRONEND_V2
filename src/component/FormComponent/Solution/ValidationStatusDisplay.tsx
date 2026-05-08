import { memo, useState } from "react";
import { FormValidationSummary } from "../../../types/Form.types";

interface ValidationFormState {
  type?: "NORMAL" | "QUIZ";
  setting?: {
    returnscore?: string;
  };
}

interface ValidationStatusDisplayProps {
  validationSummary: FormValidationSummary | null;
  formstate: ValidationFormState;
}

/* ---------------------------------- Icons --------------------------------- */

const CheckCircleIcon = () => (
  <svg
    className="w-5 h-5"
    fill="currentColor"
    viewBox="0 0 20 20"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
      clipRule="evenodd"
    />
  </svg>
);

const ExclamationCircleIcon = () => (
  <svg
    className="w-5 h-5"
    fill="currentColor"
    viewBox="0 0 20 20"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
      clipRule="evenodd"
    />
  </svg>
);

const WarningIcon = () => (
  <svg
    className="w-5 h-5"
    fill="currentColor"
    viewBox="0 0 20 20"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
      clipRule="evenodd"
    />
  </svg>
);

const ChevronDownIcon = ({ isOpen }: { isOpen: boolean }) => (
  <svg
    className={`w-4 h-4 transition-transform duration-200 ${
      isOpen ? "rotate-180" : ""
    }`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 9l-7 7-7-7"
    />
  </svg>
);

const SparklesIcon = () => (
  <svg
    className="w-5 h-5"
    fill="currentColor"
    viewBox="0 0 20 20"
    aria-hidden="true"
  >
    <path d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744l.311 1.111 1.111.311a1 1 0 010 1.934l-1.11.311-.311 1.111a1 1 0 01-1.934 0L10.723 6.41l-1.111-.31a1 1 0 010-1.934l1.11-.311.312-1.111A1 1 0 0112 2z" />
  </svg>
);

/* ----------------------------- Main Component ----------------------------- */

const ValidationStatusDisplay = memo(
  ({ validationSummary, formstate }: ValidationStatusDisplayProps) => {
    const [isWarningsExpanded, setIsWarningsExpanded] = useState(false);
    const [isScoringAnalysisExpanded, setIsScoringAnalysisExpanded] =
      useState(false);

    if (!validationSummary) return null;

    const { warnings, missingAnswers, missingScores, wrongScores } =
      validationSummary.validationResults || {};

    const hasWarnings = warnings && warnings.length > 0;
    const hasMissingAnswers = missingAnswers && missingAnswers.length > 0;
    const hasMissingScores = missingScores && missingScores.length > 0;
    const hasWrongScores = wrongScores && wrongScores.length > 0;

    return (
      <div className="w-full max-w-4xl space-y-4 animate-in fade-in duration-300">
        {/* Warning Section */}
        {hasWarnings && (
          <div className="rounded-lg border border-amber-200 dark:border-amber-800 overflow-hidden bg-white dark:bg-gray-800 shadow-sm">
            <button
              onClick={() => setIsWarningsExpanded(!isWarningsExpanded)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
              aria-expanded={isWarningsExpanded}
              aria-controls="warnings-list"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-400">
                  <WarningIcon />
                </div>
                <div>
                  <span className="font-medium text-amber-800 dark:text-amber-200">
                    {warnings?.length} Warning
                    {(warnings?.length || 0) > 1 ? "s" : ""}
                  </span>
                  <span className="text-sm text-amber-600 dark:text-amber-400 ml-2">
                    — Review recommended
                  </span>
                </div>
              </div>
              <ChevronDownIcon isOpen={isWarningsExpanded} />
            </button>
            {isWarningsExpanded && (
              <div
                id="warnings-list"
                className="border-t border-amber-100 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10"
              >
                <ul className="divide-y divide-amber-100 dark:divide-amber-800">
                  {warnings?.map((warning, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 p-3 text-sm"
                    >
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-200 dark:bg-amber-800 text-amber-700 dark:text-amber-300 flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </span>
                      <span className="text-amber-700 dark:text-amber-300">
                        {warning}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Validation Issues Summary - Compact chips for missing answers, scores, etc. */}
        {(hasMissingAnswers || hasMissingScores || hasWrongScores) && (
          <div className="rounded-lg border border-orange-200 dark:border-orange-800 overflow-hidden bg-white dark:bg-gray-800 shadow-sm">
            <div className="px-4 py-3 bg-orange-50 dark:bg-orange-900/20 border-b border-orange-100 dark:border-orange-800">
              <h4 className="font-medium text-orange-800 dark:text-orange-200 text-sm flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                Validation Details
              </h4>
            </div>
            <div className="p-4 space-y-3">
              {/* Missing Answers */}
              {hasMissingAnswers && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[120px]">
                    Missing Answers:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {missingAnswers?.map((item, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing Scores */}
              {hasMissingScores && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[120px]">
                    Missing Scores:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {missingScores?.map((item, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Wrong Scores */}
              {hasWrongScores && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[120px]">
                    Invalid Scores:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {wrongScores?.map((item, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Auto-scoring Badge */}
        {validationSummary.canReturnScoreAutomatically && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 border border-purple-200 dark:border-purple-700 w-fit">
            <SparklesIcon />
            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
              Some Question Can Be Score Automically
            </span>
          </div>
        )}

        {/* Scoring Analysis Section */}
        {validationSummary.scoringAnalysis && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
              onClick={() =>
                setIsScoringAnalysisExpanded(!isScoringAnalysisExpanded)
              }
              className="w-full px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 flex items-center justify-between hover:from-indigo-100 hover:to-purple-100 dark:hover:from-indigo-900/30 dark:hover:to-purple-900/30 transition-colors"
              aria-expanded={isScoringAnalysisExpanded}
              aria-controls="scoring-analysis-content"
            >
              <div className="flex items-center gap-3">
                <SparklesIcon />
                <div className="text-left">
                  <h3 className="font-semibold text-gray-800 dark:text-white">
                    Scoring Analysis
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Breakdown of auto-scoring capabilities for this form
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                    validationSummary.scoringAnalysis.isAutoScoreable
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                  }`}
                >
                  {validationSummary.scoringAnalysis.isAutoScoreable ? (
                    <>
                      <CheckCircleIcon />
                      Auto-Scoreable
                    </>
                  ) : (
                    <>
                      <WarningIcon />
                      Manual Review Required
                    </>
                  )}
                </span>
                <ChevronDownIcon isOpen={isScoringAnalysisExpanded} />
              </div>
            </button>
            {isScoringAnalysisExpanded && (
              <div id="scoring-analysis-content" className="p-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600">
                    <div className="text-xl font-bold text-gray-700 dark:text-gray-200">
                      {validationSummary.scoringAnalysis.totalQuestions}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Total Questions
                    </div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                    <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {validationSummary.scoringAnalysis.scoredQuestions}
                    </div>
                    <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      With Scores
                    </div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800">
                    <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                      {validationSummary.scoringAnalysis.autoScorableQuestions}
                    </div>
                    <div className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                      Auto-Scorable
                    </div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800">
                    <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
                      {validationSummary.scoringAnalysis.manualGradingQuestions}
                    </div>
                    <div className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                      Manual Grading
                    </div>
                  </div>
                </div>

                <div
                  className={`flex items-center gap-2 p-3 rounded-lg ${
                    validationSummary.scoringAnalysis.isAutoScoreable
                      ? "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800"
                      : "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
                  }`}
                >
                  {validationSummary.scoringAnalysis.isAutoScoreable ? (
                    <>
                      <CheckCircleIcon />
                      <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                        This form is fully auto-scorable! All scored questions
                        have answer keys.
                      </span>
                    </>
                  ) : (
                    <>
                      <WarningIcon />
                      <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                        Some questions require manual grading or are missing
                        answer keys.
                      </span>
                    </>
                  )}
                </div>

                {/* Missing Answer Keys */}
                {validationSummary.scoringAnalysis.missingAnswerKeys.length >
                  0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <ExclamationCircleIcon />
                      Questions Missing Answer Keys (
                      {
                        validationSummary.scoringAnalysis.missingAnswerKeys
                          .length
                      }
                      )
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {validationSummary.scoringAnalysis.missingAnswerKeys.map(
                        (item, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                          >
                            Q{item.qIdx}: {item.title || item.type}
                          </span>
                        ),
                      )}
                    </div>
                  </div>
                )}

                {validationSummary.scoringAnalysis.unsupportedTypes.length >
                  0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <WarningIcon />
                      Questions Requiring Manual Grading (
                      {
                        validationSummary.scoringAnalysis.unsupportedTypes
                          .length
                      }
                      )
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {validationSummary.scoringAnalysis.unsupportedTypes.map(
                        (item, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                          >
                            Q{item.qIdx}: {item.title || item.type} ({item.type}
                            )
                          </span>
                        ),
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {formstate.type === "QUIZ" && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-gray-500 dark:text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                Quiz Configuration
              </h3>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Valid Questions */}
                <div className="text-center p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800">
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {validationSummary.totalValidQuestions}
                  </div>
                  <div className="text-xs text-emerald-700 dark:text-emerald-300 mt-1 font-medium">
                    Valid Questions
                  </div>
                </div>

                {/* Issues Found */}
                <div className="text-center p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {validationSummary.totalInvalidQuestions}
                  </div>
                  <div className="text-xs text-red-700 dark:text-red-300 mt-1 font-medium">
                    Issues Found
                  </div>
                </div>

                {/* Total Score */}
                <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {validationSummary.totalScore}
                  </div>
                  <div className="text-xs text-blue-700 dark:text-blue-300 mt-1 font-medium">
                    Total Points
                  </div>
                </div>

                {/* Return Type */}
                <div className="text-center p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800">
                  <div className="text-lg font-bold text-purple-600 dark:text-purple-400 capitalize">
                    {formstate.setting?.returnscore || "Manual"}
                  </div>
                  <div className="text-xs text-purple-700 dark:text-purple-300 mt-1 font-medium">
                    Score Return
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  },
);

ValidationStatusDisplay.displayName = "ValidationStatusDisplay";

export default ValidationStatusDisplay;
