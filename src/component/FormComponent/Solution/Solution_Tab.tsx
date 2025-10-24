import { useEffect, useState, useCallback, useMemo, memo } from "react";
import { useDispatch, useSelector } from "react-redux";
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
    refreshtoken: true,
    reactQuery: true,
  });
  return response.data as FormTotalSummary;
};

const Solution_Tab = memo(() => {
  const { allquestion, fetchloading, formstate } = useSelector(
    (root: RootState) => root.allform
  );

  const [validationSummary, setValidationSummary] =
    useState<FormValidationSummary | null>(null);
  const dispatch = useDispatch();

  const { validateForm, isValidating, showValidationErrors } =
    useFormValidation();

  // Memoize the React Query configuration to prevent unnecessary re-renders

  const queryConfig = useMemo(
    () => ({
      queryKey: ["formTotalSummary", formstate._id],
      queryFn: () => fetchFormTotalSummary(formstate._id!),
      enabled: !!formstate._id,
      staleTime: 30000,
      gcTime: 60000,
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    }),
    [formstate._id]
  );

  const {
    data: totalsummerize,
    isLoading: loading,
    refetch: refetchTotal,
  } = useQuery(queryConfig);

  const parentScoreMap = useMemo(() => {
    const map = new Map<string, number>();
    allquestion.forEach((question) => {
      if (question._id && question.score) {
        map.set(question._id, question.score);
      }
    });
    return map;
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
      if (formstate._id && isMounted) {
        try {
          const validation = await validateForm(formstate._id, "solution");
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formstate._id, validateForm]);

  const updateQuestion = useCallback(
    (newVal: Partial<ContentType>, qIdx: number) => {
      let updatedForAutosave: ContentType | null = null;
      const updatedQuestions = allquestion.map((question, index) => {
        if (index === qIdx) {
          const updatedQuestion = { ...question, ...newVal } as ContentType;
          updatedForAutosave = updatedQuestion;
          return updatedQuestion;
        }
        return question;
      });

      dispatch(setallquestion(updatedQuestions as Array<ContentType>));

      if (formstate.setting?.autosave && updatedForAutosave) {
        dispatch(setdisbounceQuestion(updatedForAutosave));
      }
    },
    [allquestion, dispatch, formstate.setting?.autosave]
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
    (idx: number) => (answerData: { answer: unknown }) => {
      updateQuestion(
        {
          answer: {
            answer: answerData.answer as string | number | Date | Array<number>,
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
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-sm font-medium text-blue-800">
                  📋 Conditional Questions Detected
                </h3>
                <p className="text-xs text-blue-600 mt-1">
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
              const parentQIdx = allquestion.find(
                (i, idx) =>
                  i._id === question.parentcontent?.qId ||
                  idx === question.parentcontent?.qIdx
              )?.qIdx;

              return (
                <QuestionItem
                  key={`question-${question._id || idx}-${idx}`}
                  question={question}
                  idx={idx}
                  formColor={formstate.setting?.qcolor}
                  onUpdateContent={updateQuestion}
                  onSelectAnswer={handleSelectAnswer(idx)}
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
