import { useEffect, useCallback, useMemo, memo } from "react";
import { useDispatch, useSelector, useStore } from "react-redux";
import { RootState } from "../../../redux/store";
import { QuestionLoading } from "../../Loading/ContainerLoading";
import {
  setallquestion,
  setformstate,
  setRevalidateContent,
  setShowOverview,
} from "../../../redux/formstore";
import { ContentType, FormValidationSummary } from "../../../types/Form.types";
import { useFormValidation } from "../../../hooks/ValidationHook";
import FormSummaryHeader from "./FormSummaryHeader";
import ValidationStatusDisplay from "./ValidationStatusDisplay";
import QuestionItem from "./QuestionItem";
import { useSolutionScoreMaps } from "./useSolutionScoreMaps";
import { emitAutoSaveEvent } from "../../../services/autoSaveEventBus";
import { applySolutionEdit, getSolutionIssues } from "../../../utils/solutionValidation";
import { extractQuestionValidationIssues } from "../../../utils/questionValidationIssues";

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
  const store = useStore<RootState>();

  const allQuestions = useSelector(
    (root: RootState) => root.allform.allquestion,
  );
  const fetchLoading = useSelector(
    (root: RootState) => root.allform.fetchloading,
  );
  const revalidateContent = useSelector(
    (root: RootState) => root.allform.revalidateContent,
  );
  const page = useSelector((root: RootState) => root.allform.page);

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
  const autosaveEnabled = setting?.autosave;

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

  // Server errors for other pages + this page's errors as they are now, so
  // fixing an answer updates the count straight away
  const errorCount = useMemo(() => {
    const otherPageErrors =
      validation?.validationResults?.errors?.filter((e) => e.page !== page).length ?? 0;
    const currentPageErrors = allQuestions.reduce(
      (sum, q) => sum + getSolutionIssues(q).filter((i) => i.type === "error").length,
      0,
    );
    return otherPageErrors + currentPageErrors;
  }, [validation?.validationResults?.errors, allQuestions, page]);

  const updateQuestion = useCallback(
    (newVal: Partial<ContentType>, qIdx: number) => {
      dispatch(setallquestion((prev) => applySolutionEdit(prev, qIdx, newVal)));

      // Emit autosave event so the hook debounces and persists the change
      if (autosaveEnabled) {
        emitAutoSaveEvent({ tab: "solution" });
      }
    },
    [dispatch, autosaveEnabled],
  );

  const navigateToOverview = useCallback(() => {
    dispatch(setShowOverview(true));
    document
      .querySelector(OVERVIEW_SELECTOR)
      ?.scrollIntoView({ behavior: "smooth" });
  }, [dispatch]);

  // Store a fresh server validation and re-attach its issues to the questions
  const applyValidation = useCallback(
    (result: FormValidationSummary) => {
      const { formstate } = store.getState().allform;
      dispatch(setformstate({ ...formstate, validation: result }));

      const issuesById = extractQuestionValidationIssues(result.validationResults);
      dispatch(
        setallquestion((prev) =>
          prev.map((q) => ({
            ...q,
            validationIssues: issuesById.get(q._id || String(q.qIdx)) ?? [],
          })),
        ),
      );
    },
    [dispatch, store],
  );

  // Revalidate after a save. The flag is cleared right away so the next save
  // can set it again (leaving it on would block every later revalidation).
  useEffect(() => {
    if (!revalidateContent) return;
    dispatch(setRevalidateContent(false));
    if (!formId) return;

    validateFormReq.mutate(
      { formId: formId as string, tab: "solution", page },
      {
        onSuccess: (res) => {
          const data = res?.data as { validation?: FormValidationSummary } | undefined;
          if (res?.success && data?.validation) applyValidation(data.validation);
        },
      },
    );
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
