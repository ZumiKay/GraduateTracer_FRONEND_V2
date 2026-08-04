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

const Solution_Tab = memo(({ isLoading }: { isLoading: boolean }) => {
  const dispatch = useDispatch();

  // Selectors
  const allquestion = useSelector(
    (root: RootState) => root.allform.allquestion,
  );

  const fetchloading = useSelector(
    (root: RootState) => root.allform.fetchloading,
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
  } = useSelector((root: RootState) => root.allform.formstate);

  const formColor = useSelector(
    (root: RootState) => root.allform.formstate.setting?.qcolor,
  );
  const returnScore = useSelector(
    (root: RootState) => root.allform.formstate.setting?.returnscore,
  );
  const revalidateContent = useSelector(
    (root: RootState) => root.allform.revalidateContent,
  );

  const { validateFormReq, processedTotalScore } = useFormValidation();

  const {
    parentScoreMap,
    isChildHasScoreMap,
    childSiblingScoreMap,
    parentUseChildSumMap,
  } = useMemo(() => {
    const scoreMap = new Map<string, number>();
    const siblingScoreMap = new Map<string | number, number>();
    const childSiblingScoreMap = new Map<string | number, number>();
    const parentUseChildSumMap = new Map<string | number, boolean>();
    const contentById = new Map<string, ContentType>();
    const contentByIdx = new Map<number, ContentType>();

    for (const question of allquestion) {
      if (question._id) {
        if (question.score) scoreMap.set(question._id, question.score);
        contentById.set(question._id, question);
      }
      contentByIdx.set(question.qIdx, question);
    }

    const childHasScoreMap = new Map<string | number, boolean>();
    for (const question of allquestion) {
      if (!question.conditional || question.conditional.length === 0) continue;

      const key = question._id ?? question.qIdx;

      const qualifies = (t?: ContentType) =>
        !!t && !t.isBonusScore && t.score !== undefined && t.score > 0;
      const hasScore = question.conditional.some((con) => {
        const byId = con.contentId ? contentById.get(con.contentId) : undefined;
        const byIdx =
          con.contentIdx !== undefined
            ? contentByIdx.get(con.contentIdx)
            : undefined;
        return qualifies(byId) || qualifies(byIdx);
      });
      childHasScoreMap.set(key, hasScore);

      if (question.useChildScoreSum) {
        const sumOfSiblingScore = question.conditional.reduce(
          (total, s) =>
            (total +=
              allquestion.find(
                (q) => q._id === s.contentId || q.qIdx === s.contentIdx,
              )?.score ?? 0),
          0,
        );

        siblingScoreMap.set(key, sumOfSiblingScore);

        // For each child of this useChildScoreSum parent, compute sum of
        // OTHER siblings' scores (excluding the child itself) so the child
        // can show remaining distributable score and validate its input.
        for (const con of question.conditional) {
          const childQuestion = allquestion.find(
            (q) => q._id === con.contentId || q.qIdx === con.contentIdx,
          );
          if (!childQuestion) continue;
          const childKey = childQuestion._id ?? childQuestion.qIdx;
          const otherSiblingsScore = question.conditional.reduce(
            (total, sibling) => {
              const siblingQ = allquestion.find(
                (q) =>
                  q._id === sibling.contentId || q.qIdx === sibling.contentIdx,
              );
              if (!siblingQ || (siblingQ._id ?? siblingQ.qIdx) === childKey)
                return total;
              return total + (siblingQ.score ?? 0);
            },
            0,
          );
          childSiblingScoreMap.set(childKey, otherSiblingsScore);
          parentUseChildSumMap.set(childKey, true);
        }
      }
    }

    return {
      parentScoreMap: scoreMap,
      isChildHasScoreMap: childHasScoreMap,
      childSiblingScoreMap,
      parentUseChildSumMap,
    };
  }, [allquestion]);

  const conditionalCount = useMemo(
    () => allquestion.filter((q) => q.parentcontent).length,
    [allquestion],
  );

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

  //Trigger Revalidate Solution Content
  useEffect(() => {
    if (revalidateContent && formId) {
      validateFormReq.mutate({ formId: formId as string, tab: "solution" });
    }

    //Reset state
    return () => {
      dispatch(setRevalidateContent(false));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revalidateContent]);

  return (
    <div className="solution_tab w-full h-fit flex flex-col items-center">
      <FormSummaryHeader
        isValidating={validateFormReq.isPending || isLoading}
        formTotalScore={processedTotalScore({
          allQuestion: allquestion,
          formState: { currentPageTotalScores, totalScores } as never,
        })}
        formTotalQuestion={totalQuestions}
        formTotalPage={totalpage}
        formExtraScore={extraScore}
      />

      <div className="question_card w-full h-fit flex flex-col items-center gap-8 md:gap-20 pt-4 pb-12 sm:pt-8 sm:pb-20">
        {!allquestion || allquestion.length === 0 ? (
          <div className="emptyQuestion p-2 bg-red-300 w-[200px] h-[100px] grid place-content-center rounded-xl text-white font-bold">
            {"Please Add Question"}
          </div>
        ) : (
          <ValidationStatusDisplay
            formstate={{
              setting: { returnscore: returnScore },
              type: formType as never,
              validation,
            }}
            content={allquestion}
          />
        )}

        {fetchloading ? (
          <QuestionLoading count={3} />
        ) : (
          <div className="w-full max-w-4xl space-y-4 sm:space-y-8 px-2 sm:px-0">
            {validation?.validationResults?.errors?.length !== 0 && (
              <div
                onClick={() => {
                  dispatch(setShowOverview(true));
                  const element = document.querySelector(".OverviewContainer");
                  if (element) {
                    element.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-gray-700 cursor-pointer hover:bg-red-100 dark:hover:bg-gray-600 transition-colors"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    dispatch(setShowOverview(true));
                    const element =
                      document.querySelector(".OverviewContainer");
                    if (element) {
                      element.scrollIntoView({ behavior: "smooth" });
                    }
                  }
                }}
              >
                <h3 className="text-sm font-medium text-red-600 dark:text-red-400">
                  {`${validation?.validationResults?.errors?.length} Error Question Detected`}
                </h3>
                <p className="text-xs text-red-400 dark:text-red-300 mt-1">
                  Form cannot be publish with errors
                </p>
              </div>
            )}

            {conditionalCount > 0 && (
              <div className="p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-gray-700">
                <h3 className="text-sm font-medium text-blue-800 dark:text-white">
                  Conditional Questions Detected
                </h3>
                <p className="text-xs text-blue-600 mt-1 dark:text-white">
                  This form contains {conditionalCount} conditional question(s)
                  that appear based on parent question answers. You can assign
                  scores and answer keys to these questions - they will be used
                  when the conditions are met during form submission.
                </p>
              </div>
            )}
            {allquestion.map((question, idx) => {
              const parentKeyOfSelf = question._id ?? question.qIdx;

              return (
                <QuestionItem
                  key={question._id || `question-${idx}`}
                  question={question}
                  idx={idx}
                  formColor={formColor}
                  onUpdateContent={updateQuestion}
                  isBonusScore={question.isBonusScore}
                  isChildHasScore={isChildHasScoreMap.get(parentKeyOfSelf)}
                  childSiblingScore={childSiblingScoreMap.get(parentKeyOfSelf)}
                  parentUseChildSum={parentUseChildSumMap.get(parentKeyOfSelf)}
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

Solution_Tab.displayName = "Solution_Tab";

export default Solution_Tab;
