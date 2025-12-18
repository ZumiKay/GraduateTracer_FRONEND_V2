import { useEffect, useState, useCallback, useMemo, memo } from "react";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { RootState } from "../../../redux/store";
import { QuestionLoading } from "../../Loading/ContainerLoading";
import {
  setallquestion,
  setdisbounceQuestion,
  setRevalidateContent,
} from "../../../redux/formstore";
import { ContentType, FormValidationSummary } from "../../../types/Form.types";
import ApiRequest from "../../../hooks/ApiHook";
import useFormValidation from "../../../hooks/ValidationHook";
import { ErrorToast, InfoToast } from "../../Modal/AlertModal";
import { useQuery } from "@tanstack/react-query";
import FormSummaryHeader from "./FormSummaryHeader";
import ValidationStatusDisplay from "./ValidationStatusDisplay";
import QuestionItem from "./QuestionItem";
import { ContentAnswerType } from "../../Response/Response.type";

interface FormTotalSummary {
  totalpage: number;
  totalquestion: number;
  totalscore: number;
}

const fetchFormTotalSummary = async (
  formId: string
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
    shallowEqual
  );

  const fetchloading = useSelector(
    (root: RootState) => root.allform.fetchloading
  );
  const formId = useSelector((root: RootState) => root.allform.formstate._id);
  const formTotalScore = useSelector(
    (root: RootState) => root.allform.formstate.totalscore
  );
  const formType = useSelector(
    (root: RootState) => root.allform.formstate.type
  );
  const formColor = useSelector(
    (root: RootState) => root.allform.formstate.setting?.qcolor
  );
  const autosaveEnabled = useSelector(
    (root: RootState) => root.allform.formstate.setting?.autosave
  );
  const returnScore = useSelector(
    (root: RootState) => root.allform.formstate.setting?.returnscore
  );
  const revalidateContent = useSelector(
    (root: RootState) => root.allform.revalidateContent
  );

  const [validationSummary, setValidationSummary] =
    useState<FormValidationSummary | null>(null);

  const { validateForm, isValidating } = useFormValidation();

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

  // Parent score/index maps for conditional questions
  const { parentScoreMap, parentQIdxMap } = useMemo(() => {
    const scoreMap = new Map<string, number>();
    const idxMap = new Map<string, number>();

    for (const question of allquestion) {
      if (question._id) {
        if (question.score) scoreMap.set(question._id, question.score);
        if (question.qIdx !== undefined)
          idxMap.set(question._id, question.qIdx);
      }
    }

    return { parentScoreMap: scoreMap, parentQIdxMap: idxMap };
  }, [allquestion]);

  // Conditional questions count
  const conditionalCount = useMemo(
    () => allquestion.filter((q) => q.parentcontent).length,
    [allquestion]
  );

  // Initial validation on mount
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

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [formId, validateForm]);

  // Update question handler
  const updateQuestion = useCallback(
    (newVal: Partial<ContentType>, qIdx: number) => {
      dispatch(
        setallquestion((prevQuestions) => {
          const updatedQuestions = prevQuestions.map((question, index) =>
            index === qIdx ? { ...question, ...newVal } : question
          );

          if (autosaveEnabled) {
            dispatch(setdisbounceQuestion(updatedQuestions[qIdx]));
          }

          return updatedQuestions;
        })
      );
    },
    [dispatch, autosaveEnabled]
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

  // Select answer handler
  const handleSelectAnswer = useCallback(
    (answerData: { answer: ContentAnswerType }, idx: number) => {
      updateQuestion({ answer: { answer: answerData.answer } }, idx);
    },
    [updateQuestion]
  );

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

      <div className="question_card w-full h-fit flex flex-col items-center gap-20 pt-8 pb-20">
        <ValidationStatusDisplay
          validationSummary={validationSummary}
          formstate={{
            type: formType,
            setting: { returnscore: returnScore },
          }}
        />

        {fetchloading ? (
          <QuestionLoading count={3} />
        ) : (
          <div className="w-full max-w-4xl space-y-8">
            {conditionalCount > 0 && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-gray-700">
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

            {allquestion.map((question, idx) => (
              <QuestionItem
                key={question._id || `question-${idx}`}
                question={question}
                idx={idx}
                formColor={formColor}
                onUpdateContent={updateQuestion}
                onSelectAnswer={handleSelectAnswer}
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

Solution_Tab.displayName = "Solution_Tab";

export default Solution_Tab;
