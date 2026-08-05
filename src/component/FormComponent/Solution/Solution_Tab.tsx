import { useEffect, useCallback, useMemo, memo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../redux/store";
import { QuestionLoading } from "../../Loading/ContainerLoading";
import {
  setallquestion,
  setRevalidateContent,
  setShowOverview,
} from "../../../redux/formstore";
import { ContentType } from "../../../types/Form.types";
import useFormValidation from "../../../hooks/ValidationHook";
import FormSummaryHeader from "./FormSummaryHeader";
import ValidationStatusDisplay from "./ValidationStatusDisplay";
import QuestionItem from "./QuestionItem";
import { useSolutionScoreMaps } from "./useSolutionScoreMaps";

/* --------------------------------- Banners -------------------------------- */

interface ErrorBannerProps {
  errorCount: number;
  onNavigateToOverview: () => void;
}

const ErrorBanner = memo(
  ({ errorCount, onNavigateToOverview }: ErrorBannerProps) => (
    <div
      onClick={onNavigateToOverview}
      className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-gray-700 cursor-pointer hover:bg-red-100 dark:hover:bg-gray-600 transition-colors"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onNavigateToOverview();
      }}
    >
      <h3 className="text-sm font-medium text-red-600 dark:text-red-400">
        {errorCount} Error Question{errorCount !== 1 ? "s" : ""} Detected
      </h3>
      <p className="text-xs text-red-400 dark:text-red-300 mt-1">
        Form cannot be published with errors
      </p>
    </div>
  ),
);
ErrorBanner.displayName = "ErrorBanner";

interface ConditionalBannerProps {
  count: number;
}

const ConditionalBanner = memo(({ count }: ConditionalBannerProps) => (
  <div className="p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-gray-700">
    <h3 className="text-sm font-medium text-blue-800 dark:text-white">
      Conditional Questions Detected
    </h3>
    <p className="text-xs text-blue-600 mt-1 dark:text-white">
      This form contains {count} conditional question(s) that appear based on
      parent question answers. You can assign scores and answer keys to these
      questions — they will be used when the conditions are met during form
      submission.
    </p>
  </div>
));
ConditionalBanner.displayName = "ConditionalBanner";

/* ----------------------------- Main Component ----------------------------- */

const OVERVIEW_SELECTOR = ".OverviewContainer";

interface SolutionTabProps {
  isLoading: boolean;
}

const SolutionTab = memo(({ isLoading }: SolutionTabProps) => {
  const dispatch = useDispatch();

  const allQuestions = useSelector(
    (root: RootState) => root.allform.allquestion,
  );
  const fetchLoading = useSelector(
    (root: RootState) => root.allform.fetchloading,
  );
  const revalidateContent = useSelector(
    (root: RootState) => root.allform.revalidateContent,
  );

  const {
    _id: formId,
    validation,
    formType,
    totalpage,
    totalQuestions,
    totalScores,
    extraScore,
    currentPageTotalScores,
    setting,
  } = useSelector((root: RootState) => root.allform.formstate);

  const formColor = setting?.qcolor;
  const returnScore = setting?.returnscore;

  const { validateFormReq, processedTotalScore } = useFormValidation();

  const {
    parentScoreMap,
    isChildHasScoreMap,
    childSiblingScoreMap,
    parentUseChildSumMap,
  } = useSolutionScoreMaps(allQuestions);

  const conditionalCount = useMemo(
    () => allQuestions.filter((q) => q.parentcontent).length,
    [allQuestions],
  );

  const errorCount = validation?.validationResults?.errors?.length ?? 0;

  const updateQuestion = useCallback(
    (newVal: Partial<ContentType>, qIdx: number) => {
      dispatch(
        setallquestion((prev) =>
          prev.map((ques, idx) =>
            idx === qIdx ? { ...ques, ...newVal } : ques,
          ),
        ),
      );
    },
    [dispatch],
  );

  const navigateToOverview = useCallback(() => {
    dispatch(setShowOverview(true));
    document
      .querySelector(OVERVIEW_SELECTOR)
      ?.scrollIntoView({ behavior: "smooth" });
  }, [dispatch]);

  useEffect(() => {
    if (revalidateContent && formId) {
      validateFormReq.mutate({ formId: formId as string, tab: "solution" });
    }
    return () => {
      dispatch(setRevalidateContent(false));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revalidateContent]);

  const isEmpty = !allQuestions || allQuestions.length === 0;

  return (
    <div className="solution_tab w-full h-fit flex flex-col items-center">
      <FormSummaryHeader
        isValidating={validateFormReq.isPending || isLoading}
        formTotalScore={processedTotalScore({
          allQuestion: allQuestions,
          formState: { currentPageTotalScores, totalScores } as never,
        })}
        formTotalQuestion={totalQuestions}
        formTotalPage={totalpage}
        formExtraScore={extraScore}
      />

      <div className="question_card w-full h-fit flex flex-col items-center gap-8 md:gap-20 pt-4 pb-12 sm:pt-8 sm:pb-20">
        {isEmpty ? (
          <div className="emptyQuestion p-2 bg-red-300 w-[200px] h-[100px] grid place-content-center rounded-xl text-white font-bold">
            Please Add Question
          </div>
        ) : (
          <ValidationStatusDisplay
            formstate={{
              setting: { returnscore: returnScore },
              type: formType as never,
              validation,
              totalQuestions: totalQuestions,
            }}
            content={allQuestions}
          />
        )}

        {fetchLoading ? (
          <QuestionLoading count={3} />
        ) : (
          <div className="w-full max-w-4xl space-y-4 sm:space-y-8 px-2 sm:px-0">
            {errorCount > 0 && (
              <ErrorBanner
                errorCount={errorCount}
                onNavigateToOverview={navigateToOverview}
              />
            )}

            {conditionalCount > 0 && (
              <ConditionalBanner count={conditionalCount} />
            )}

            {allQuestions.map((question, idx) => {
              const selfKey = question._id ?? question.qIdx;
              return (
                <QuestionItem
                  key={question._id || `question-${idx}`}
                  question={question}
                  idx={idx}
                  formColor={formColor}
                  onUpdateContent={updateQuestion}
                  isBonusScore={question.isBonusScore}
                  isChildHasScore={isChildHasScoreMap.get(selfKey)}
                  childSiblingScore={childSiblingScoreMap.get(selfKey)}
                  parentUseChildSum={parentUseChildSumMap.get(selfKey)}
                  parentScore={
                    question.parentcontent?.qId
                      ? parentScoreMap.get(question.parentcontent.qId)
                      : undefined
                  }
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});

SolutionTab.displayName = "SolutionTab";

export default SolutionTab;
