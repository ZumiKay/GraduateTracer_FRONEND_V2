import { memo, useMemo, useState } from "react";
import { ContentType, FormDataType } from "../../../types/Form.types";
import { validateScoreTemp } from "../../../utils/formValidation";

const CheckCircleIcon = memo(() => (
  <svg
    className="w-5 h-5 shrink-0"
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
));
CheckCircleIcon.displayName = "CheckCircleIcon";

const WarningIcon = memo(() => (
  <svg
    className="w-5 h-5 shrink-0"
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
));
WarningIcon.displayName = "WarningIcon";

const SparklesIcon = memo(() => (
  <svg
    className="w-5 h-5 shrink-0"
    fill="currentColor"
    viewBox="0 0 20 20"
    aria-hidden="true"
  >
    <path d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744l.311 1.111 1.111.311a1 1 0 010 1.934l-1.11.311-.311 1.111a1 1 0 01-1.934 0L10.723 6.41l-1.111-.31a1 1 0 010-1.934l1.11-.311.312-1.111A1 1 0 0112 2z" />
  </svg>
));
SparklesIcon.displayName = "SparklesIcon";

interface StatCardProps {
  value: number;
  label: string;
  colorClass: string;
  bgClass: string;
}

const StatCard = memo(
  ({ value, label, colorClass, bgClass }: StatCardProps) => (
    <div
      className={`text-center p-3 rounded-xl border shadow-xs transition-all duration-200 hover:scale-[1.02] ${bgClass}`}
    >
      <div
        className={`text-xl sm:text-2xl font-extrabold tabular-nums ${colorClass}`}
      >
        {value}
      </div>
      <div className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-300 mt-1 font-medium tracking-tight">
        {label}
      </div>
    </div>
  ),
);
StatCard.displayName = "StatCard";

type Props = Pick<FormDataType, "validation" | "type" | "setting">;

const ValidationStatusDisplay = memo(
  ({
    formstate,
    content,
  }: {
    formstate: Props;
    content: Array<ContentType>;
  }) => {
    const validation = formstate.validation;
    const [isExpanded, setIsExpanded] = useState(false);

    const scoringAnalysisData = useMemo(() => {
      if (
        !validation?.scoringAnalysis ||
        !validation.initialCurrentPageScoreAnalysis
      )
        return undefined;
      const newlyValidate = validateScoreTemp(
        validation.initialCurrentPageScoreAnalysis,
        validation.scoringAnalysis,
        content,
      );

      return newlyValidate;
    }, [
      content,
      validation?.initialCurrentPageScoreAnalysis,
      validation?.scoringAnalysis,
    ]);

    if (!validation) return null;

    return (
      <div
        className={`w-full max-w-4xl mt-2 transition-all duration-300 ${
          isExpanded
            ? "sticky top-16 z-30 shadow-xl border border-indigo-200/80 dark:border-indigo-700/60 backdrop-blur-md bg-white/95 dark:bg-gray-800/95 rounded-2xl"
            : "relative rounded-2xl shadow-xs border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md"
        }`}
      >
        {scoringAnalysisData && (
          <div className="overflow-hidden rounded-2xl">
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              aria-expanded={isExpanded}
              aria-controls="scoring-analysis-content"
              className="group w-full px-4 py-3 sm:px-5 sm:py-3.5
              flex items-center justify-between gap-3
              bg-gradient-to-r from-indigo-50/90 via-purple-50/60 to-indigo-50/90
              dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-indigo-950/40
              hover:from-indigo-100 hover:to-purple-100
              dark:hover:from-indigo-900/40 dark:hover:to-purple-900/40
              border-b border-gray-100 dark:border-gray-700/80
              transition-all duration-200 focus-visible:outline-none
              focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-inset"
            >
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <span className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 shrink-0">
                  <SparklesIcon />
                </span>
                <div className="text-left min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">
                      Scoring Analysis
                    </h3>
                    {isExpanded && (
                      <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700">
                        Sticky View
                      </span>
                    )}
                  </div>
                  <p className="hidden sm:block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Breakdown of auto-scoring capabilities for this form
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 sm:hidden">
                  {isExpanded ? "Collapse" : "Expand"}
                </span>
                <svg
                  className={`w-5 h-5 shrink-0 text-gray-400 dark:text-gray-500
                  transition-transform duration-300 ease-in-out
                  ${isExpanded ? "rotate-180" : "rotate-0"}
                  group-hover:text-indigo-600 dark:group-hover:text-indigo-400`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </button>

            <div
              className={`grid transition-[grid-template-rows] duration-300 ease-in-out
              ${isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
            >
              <div
                id="scoring-analysis-content"
                role="region"
                aria-labelledby="scoring-analysis-header"
                className="min-h-0 overflow-hidden"
              >
                <div className="p-4 sm:p-5 space-y-4">
                  {/* Stat grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                    <StatCard
                      value={scoringAnalysisData.totalQuestions}
                      label="Total Questions"
                      colorClass="text-purple-600 dark:text-purple-400"
                      bgClass="bg-purple-50/80 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800/60"
                    />
                    <StatCard
                      value={scoringAnalysisData.scoredQuestions}
                      label="With Scores"
                      colorClass="text-blue-600 dark:text-blue-400"
                      bgClass="bg-blue-50/80 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800/60"
                    />
                    <StatCard
                      value={scoringAnalysisData.autoScorableQuestions}
                      label="Auto-Scorable"
                      colorClass="text-emerald-600 dark:text-emerald-400"
                      bgClass="bg-emerald-50/80 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/60"
                    />
                    <StatCard
                      value={scoringAnalysisData.manualGradingQuestions}
                      label="Manual Grading"
                      colorClass="text-amber-600 dark:text-amber-400"
                      bgClass="bg-amber-50/80 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/60"
                    />
                  </div>

                  {/* Summary banner */}
                  <div
                    role="status"
                    className={`flex items-center gap-3 p-3 sm:p-3.5 rounded-xl border text-xs sm:text-sm font-medium transition-all duration-200 ${
                      scoringAnalysisData.isAutoScoreable
                        ? "bg-emerald-50/90 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300"
                        : "bg-amber-50/90 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/80 text-amber-800 dark:text-amber-300"
                    }`}
                  >
                    {scoringAnalysisData.isAutoScoreable ? (
                      <>
                        <span className="text-emerald-600 dark:text-emerald-400 shrink-0">
                          <CheckCircleIcon />
                        </span>
                        <span>
                          This form is fully auto-scorable! All scored questions
                          have answer keys.
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-amber-600 dark:text-amber-400 shrink-0">
                          <WarningIcon />
                        </span>
                        <span>
                          Some questions require manual grading or are missing
                          answer keys.
                        </span>
                      </>
                    )}
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
