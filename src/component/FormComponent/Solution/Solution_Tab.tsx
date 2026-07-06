import { useEffect, useState, useCallback, useMemo, useRef, memo } from "react";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { RootState } from "../../../redux/store";
import { QuestionLoading } from "../../Loading/ContainerLoading";
import {
  setallquestion,
  setdisbounceQuestion,
  setRevalidateContent,
} from "../../../redux/formstore";
import { ContentType, FormValidationSummary } from "../../../types/Form.types";
import ApiRequest from "../../../hooks/APIHook/ApiHook";
import useFormValidation from "../../../hooks/ValidationHook";
import { ErrorToast, InfoToast } from "../../Modal/AlertModal";
import { useQuery } from "@tanstack/react-query";
import FormSummaryHeader from "./FormSummaryHeader";
import ValidationStatusDisplay from "./ValidationStatusDisplay";
import QuestionItem from "./QuestionItem";

interface FormTotalSummary {
  totalpage: number;
  totalquestion: number;
  totalscore: number;
}

const fetchFormTotalSummary = async (
  formId: string,
): Promise<FormTotalSummary> => {
  const response = await ApiRequest({
    url: `/filteredform?ty=total&q=${formId}`,
    method: "GET",
    cookie: true,
    reactQuery: true,
  });

  return response.data as FormTotalSummary;
};

const Solution_Tab = memo(() => {
  const dispatch = useDispatch();

  // Selectors
  const allquestion = useSelector(
    (root: RootState) => root.allform.allquestion,
    shallowEqual,
  );

  const fetchloading = useSelector(
    (root: RootState) => root.allform.fetchloading,
  );
  const formId = useSelector((root: RootState) => root.allform.formstate._id);
  const formTotalScore = useSelector(
    (root: RootState) => root.allform.formstate.totalscore,
  );
  const formType = useSelector(
    (root: RootState) => root.allform.formstate.type,
  );
  const formColor = useSelector(
    (root: RootState) => root.allform.formstate.setting?.qcolor,
  );
  const autosaveEnabled = useSelector(
    (root: RootState) => root.allform.formstate.setting?.autosave,
  );
  const returnScore = useSelector(
    (root: RootState) => root.allform.formstate.setting?.returnscore,
  );
  const revalidateContent = useSelector(
    (root: RootState) => root.allform.revalidateContent,
  );

  const [validationSummary, setValidationSummary] =
    useState<FormValidationSummary | null>(null);

  const { validateForm, isValidating } = useFormValidation();
  const [maxParentScore, setmaxParentScore] = useState(
    new Map<string | number, number>(),
  );

  // Query for form summary
  const {
    data: totalsummerize,
    isLoading: loading,
    refetch: refetchTotal,
  } = useQuery({
    queryKey: ["formTotalSummary", formId],
    queryFn: () => fetchFormTotalSummary(formId!),
    enabled: !!formId,
    staleTime: 30000,
    gcTime: 60000,
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const {
    parentScoreMap,
    parentQIdxMap,
    childrenByParentId,
    isChildHasScoreMap,
  } = useMemo(() => {
    const scoreMap = new Map<string, number>();
    const idxMap = new Map<string, number>();
    const childrenMap = new Map<
      string | number,
      Array<{ id: string | number; score?: number; isBonusScore?: boolean }>
    >();
    const contentById = new Map<string, ContentType>();
    const contentByIdx = new Map<number, ContentType>();

    for (const question of allquestion) {
      if (question._id) {
        if (question.score) scoreMap.set(question._id, question.score);
        if (question.qIdx !== undefined)
          idxMap.set(question._id, question.qIdx);
        contentById.set(question._id, question);
      }
      contentByIdx.set(question.qIdx, question);

      const parentKey =
        question.parentcontent?.qId ?? question.parentcontent?.qIdx;
      if (parentKey !== undefined) {
        const list = childrenMap.get(parentKey) ?? [];
        list.push({
          id: question._id ?? question.qIdx,
          score: question.score,
          isBonusScore: question.isBonusScore,
        });
        childrenMap.set(parentKey, list);
      }
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
    }

    return {
      parentScoreMap: scoreMap,
      parentQIdxMap: idxMap,
      childrenByParentId: childrenMap,
      isChildHasScoreMap: childHasScoreMap,
    };
  }, [allquestion]);

  const conditionalCount = useMemo(
    () => allquestion.filter((q) => q.parentcontent).length,
    [allquestion],
  );

  useEffect(() => {
    if (!formId) return;

    let isMounted = true;
    const timeoutId = setTimeout(async () => {
      try {
        const validation = await validateForm(formId, "solution");
        if (validation && isMounted) {
          setValidationSummary(validation);
        }
      } catch (error) {
        console.error("Validation error:", error);
      }
    }, 300);

    //Inititalize maxParentScore
    const tobeaddscore = new Map();
    for (const q of allquestion) {
      if (
        !q.isBonusScore &&
        q.conditional &&
        q.conditional.length > 0 &&
        q.score !== undefined
      ) {
        tobeaddscore.set(q._id || q.qIdx, q.score);
      }
    }
    setmaxParentScore(tobeaddscore);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [allquestion, formId, validateForm]);

  const allquestionRef = useRef(allquestion);
  allquestionRef.current = allquestion;

  const updateQuestion = useCallback(
    (newVal: Partial<ContentType>, qIdx: number) => {
      if (autosaveEnabled) {
        const merged = { ...allquestionRef.current[qIdx], ...newVal };
        dispatch(setdisbounceQuestion(merged));
      }
      dispatch(
        setallquestion((prev) =>
          prev.map((ques, idx) =>
            idx === qIdx ? { ...ques, ...newVal } : ques,
          ),
        ),
      );
    },
    [autosaveEnabled, dispatch],
  );

  const updateMaxParentScore = useCallback(
    (parentId: string | number, newBudget: number) => {
      if (newBudget < 0) {
        ErrorToast({
          title: "Validation",
          content: "Score exceed limit",
          toastid: "childExceedScore",
        });
        return;
      }
      setmaxParentScore((prev) => {
        const next = new Map(prev);
        next.set(parentId, newBudget);
        return next;
      });
    },
    [],
  );

  // Validate all handler
  const handleValidateAll = useCallback(async () => {
    if (!formId) return;

    try {
      const validation = await validateForm(formId, "send_form");
      if (validation) {
        setValidationSummary(validation);
        refetchTotal();

        if (validation.validationResults.errors?.length) {
          console.log("Debug validation result", validation.validationResults);
        } else {
          InfoToast({
            title: "Validation Success",
            content: "All questions are properly configured!",
            toastid: "validation-success",
          });
        }
      }
    } catch (error) {
      console.error("Validation error:", error);
      ErrorToast({
        title: "Validation Error",
        content: "Failed to validate form",
        toastid: "validation-error",
      });
    }
  }, [formId, validateForm, refetchTotal]);

  //Trigger Revalidate Solution Content
  useEffect(() => {
    if (revalidateContent) {
      handleValidateAll();
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
        loading={loading}
        isValidating={isValidating}
        totalsummerize={totalsummerize}
        formTotalScore={formTotalScore}
        validationSummary={validationSummary}
        onValidateAll={handleValidateAll}
      />

      <div className="question_card w-full h-fit flex flex-col items-center gap-8 md:gap-20 pt-4 pb-12 sm:pt-8 sm:pb-20">
        {!allquestion || allquestion.length === 0 ? (
          <div className="emptyQuestion p-2 bg-red-300 w-[200px] h-[100px] grid place-content-center rounded-xl text-white font-bold">
            {"Please Add Question"}
          </div>
        ) : (
          <ValidationStatusDisplay
            validationSummary={validationSummary}
            formstate={{
              type: formType,
              setting: { returnscore: returnScore },
            }}
          />
        )}

        {fetchloading ? (
          <QuestionLoading count={3} />
        ) : (
          <div className="w-full max-w-4xl space-y-4 sm:space-y-8 px-2 sm:px-0">
            {conditionalCount > 0 && (
              <div className="p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-gray-700">
                <h3 className="text-sm font-medium text-blue-800 dark:text-white">
                  📋 Conditional Questions Detected
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
              const parentIdOfQuestion =
                question.parentcontent?.qId ?? question.parentcontent?.qIdx;

              return (
                <QuestionItem
                  key={question._id || `question-${idx}`}
                  question={question}
                  idx={idx}
                  formColor={formColor}
                  onUpdateContent={updateQuestion}
                  isBonusScore={question.isBonusScore}
                  isChildHasScore={isChildHasScoreMap.get(parentKeyOfSelf)}
                  currentMaxParentScore={
                    parentIdOfQuestion !== undefined
                      ? maxParentScore.get(parentIdOfQuestion)
                      : undefined
                  }
                  siblingScores={
                    parentIdOfQuestion !== undefined
                      ? childrenByParentId.get(parentIdOfQuestion)
                      : undefined
                  }
                  onUpdateMaxParentScore={updateMaxParentScore}
                  parentScore={
                    question.parentcontent?.qId
                      ? parentScoreMap.get(question.parentcontent.qId)
                      : undefined
                  }
                  parentQIdx={
                    question.parentcontent?.qId
                      ? parentQIdxMap.get(question.parentcontent.qId)
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
