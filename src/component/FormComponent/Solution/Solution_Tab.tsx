import { useEffect, useState, useCallback, useMemo, memo } from "react";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { RootState } from "../../../redux/store";
import { QuestionLoading } from "../../Loading/ContainerLoading";
import {
  setallquestion,
  setdisbounceQuestion,
  setformstate,
} from "../../../redux/formstore";
import {
  ContentType,
  FormValidationSummary,
  FormDataType,
} from "../../../types/Form.types";
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

  const [validationSummary, setValidationSummary] =
    useState<FormValidationSummary | null>(null);
  const dispatch = useDispatch();

  // Memoize formstate object to avoid recreating on every render
  const formstate = useMemo(
    () => ({
      _id: formId,
      totalscore: formTotalScore,
      type: formType,
      setting: {
        qcolor: formColor,
        autosave: autosaveEnabled,
        returnscore: returnScore,
      },
    }),
    [formId, formTotalScore, formType, formColor, autosaveEnabled, returnScore]
  ) as FormDataType;

  const { validateForm, isValidating, showValidationErrors } =
    useFormValidation();

  //Fetch summary of the form
  const queryConfig = useMemo(
    () => ({
      queryKey: ["formTotalSummary", formId],
      queryFn: () => fetchFormTotalSummary(formId!),
      enabled: !!formId,
      staleTime: 30000,
      gcTime: 60000,
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    }),
    [formId]
  );

  const {
    data: totalsummerize,
    isLoading: loading,
    refetch: refetchTotal,
  } = useQuery(queryConfig);

  // Memoize parent score and index maps to avoid recalculation on every render
  const { parentScoreMap, parentQIdxMap } = useMemo(() => {
    const scoreMap = new Map<string, number>();
    const idxMap = new Map<string, number>();

    allquestion.forEach((question) => {
      if (question._id) {
        if (question.score) {
          scoreMap.set(question._id, question.score);
        }
        if (question.qIdx !== undefined) {
          idxMap.set(question._id, question.qIdx);
        }
      }
    });

    return { parentScoreMap: scoreMap, parentQIdxMap: idxMap };
  }, [allquestion]);

  const conditionalQuestionsInfo = useMemo(() => {
    const conditionalQuestions = allquestion.filter((q) => q.parentcontent);
    return {
      hasConditional: conditionalQuestions.length > 0,
      count: conditionalQuestions.length,
    };
  }, [allquestion]);

  const refetchTotalIfNeeded = useCallback(
    (reason: string) => {
      if (reason === "manual_validate" || reason === "form_submission_check") {
        refetchTotal();
      }
    },
    [refetchTotal]
  );

  useEffect(() => {
    let isMounted = true;

    const runValidation = async () => {
      if (formId && isMounted) {
        try {
          const validation = await validateForm(formId, "solution");
          if (validation && isMounted) {
            setValidationSummary(validation);
            dispatch(
              setformstate({
                ...formstate,
                totalscore: validation.totalScore,
              } as FormDataType)
            );
          }
        } catch (error) {
          console.error("Validation error:", error);
        }
      }
    };

    const timeoutId = setTimeout(runValidation, 300);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [formId, validateForm, dispatch, formstate]);

  const updateQuestion = useCallback(
    (newVal: Partial<ContentType>, qIdx: number) => {
      const updatedQuestions = allquestion.map((question, index) => {
        if (index === qIdx) {
          return { ...question, ...newVal } as ContentType;
        }
        return question;
      });

      dispatch(setallquestion(updatedQuestions as Array<ContentType>));

      if (autosaveEnabled) {
        dispatch(setdisbounceQuestion(updatedQuestions[qIdx]));
      }
    },
    [allquestion, dispatch, autosaveEnabled]
  );

  const handleValidateAll = useCallback(async () => {
    if (!formstate._id) return;

    try {
      const validation = await validateForm(formstate._id, "send_form");
      if (validation) {
        setValidationSummary(validation);
        dispatch(
          setformstate({
            ...formstate,
            totalscore: validation.totalScore,
          } as FormDataType)
        );
        refetchTotalIfNeeded("manual_validate");

        if (validation.errors && validation.errors.length > 0) {
          showValidationErrors(validation);
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
  }, [
    formstate,
    validateForm,
    dispatch,
    refetchTotalIfNeeded,
    showValidationErrors,
  ]);

  const handleSelectAnswer = useCallback(
    (answerData: { answer: ContentAnswerType }, idx: number) => {
      updateQuestion(
        {
          answer: {
            answer: answerData.answer,
          },
        },
        idx
      );
    },
    [updateQuestion]
  );

  return (
    <div className="solution_tab w-full h-fit flex flex-col items-center">
      {/* Form Summary Header */}
      <FormSummaryHeader
        loading={loading}
        isValidating={isValidating}
        totalsummerize={totalsummerize}
        formTotalScore={(formstate as FormDataType).totalscore}
        validationSummary={validationSummary}
        onValidateAll={handleValidateAll}
      />

      <div className="question_card w-full h-fit flex flex-col items-center gap-20 pt-8 pb-20">
        {/* Validation Status Display */}
        <ValidationStatusDisplay
          validationSummary={validationSummary}
          formstate={formstate}
        />

        {/* Questions Section */}
        {fetchloading ? (
          <QuestionLoading count={3} />
        ) : (
          <div className="w-full max-w-4xl space-y-8">
            {/* Conditional Questions Info */}
            {conditionalQuestionsInfo.hasConditional && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-gray-700">
                <h3 className="text-sm font-medium text-blue-800 dark:text-white">
                  📋 Conditional Questions Detected
                </h3>
                <p className="text-xs text-blue-600 mt-1 dark:text-white">
                  This form contains {conditionalQuestionsInfo.count}{" "}
                  conditional question(s) that appear based on parent question
                  answers. You can assign scores and answer keys to these
                  questions - they will be used when the conditions are met
                  during form submission.
                </p>
              </div>
            )}

            {allquestion.map((question, idx) => {
              const parentScore = question.parentcontent?.qId
                ? parentScoreMap.get(question.parentcontent.qId)
                : undefined;
              const parentQIdx = question.parentcontent?.qId
                ? parentQIdxMap.get(question.parentcontent.qId)
                : undefined;

              return (
                <QuestionItem
                  key={question._id || `question-${idx}`}
                  question={question}
                  idx={idx}
                  formColor={formColor}
                  onUpdateContent={updateQuestion}
                  onSelectAnswer={handleSelectAnswer}
                  parentScore={parentScore}
                  parentQIdx={parentQIdx}
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
