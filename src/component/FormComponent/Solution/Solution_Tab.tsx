import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import Respondant_Question_Card from "../../Card/Respondant.card";
import { RootState } from "../../../redux/store";
import { QuestionLoading } from "../../Loading/ContainerLoading";
import { CircularProgress, Button, Chip, Alert } from "@heroui/react";
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
import SolutionInput from "./SolutionInput";
import { ErrorToast, InfoToast } from "../../Modal/AlertModal";
import { useQuery } from "@tanstack/react-query";

// API functions for React Query
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

const Solution_Tab = () => {
  const { allquestion, fetchloading, formstate } = useSelector(
    (root: RootState) => root.allform
  );

  const [validationSummary, setValidationSummary] =
    useState<FormValidationSummary | null>(null);
  const dispatch = useDispatch();

  const { validateForm, isValidating, showValidationErrors } =
    useFormValidation();

  // React Query for form total summary - this gets the correct total from ALL questions
  const {
    data: totalsummerize,
    isLoading: loading,
    refetch: refetchTotal,
  } = useQuery({
    queryKey: ["formTotalSummary", formstate._id],
    queryFn: () => fetchFormTotalSummary(formstate._id!),
    enabled: !!formstate._id,
    staleTime: 30000, // 30 seconds cache time to prevent unnecessary refetches
    gcTime: 60000, // Keep data in cache for 1 minute
    retry: 2,
    refetchOnWindowFocus: false, // Prevent refetch when user returns to tab
    refetchOnReconnect: false, // Prevent refetch on network reconnect
  });

  // Smart refetch function - only refetch when necessary
  // Currently used for manual validation, can be extended for other operations
  const refetchTotalIfNeeded = useCallback(
    (reason: string) => {
      console.log(`🔄 Considering refetch for: ${reason}`);

      // Only refetch if we suspect the data might be out of sync
      // Most score updates are handled locally via formstate.totalscore
      if (reason === "manual_validate" || reason === "form_submission_check") {
        console.log(`✅ Refetching total score: ${reason}`);
        refetchTotal();
      } else {
        console.log(`⏭️ Skipping refetch: ${reason} (using local state)`);
      }
    },
    [refetchTotal]
  );

  // (Optional future) Function to sync with server before submission can be re-added if needed

  // Initial validation when component mounts or form ID changes - optimized to avoid dependency issues
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

            // Remove unnecessary refetch since we already have the total score from validation
            console.log(
              "📊 Validation complete, totalscore updated:",
              validation.totalScore
            );
          }
        } catch (error) {
          console.error("Validation error:", error);
        }
      }
    };

    runValidation();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formstate._id, validateForm]);

  // Update a single question and push to Redux synchronously for immediate UI update
  const updateQuestion = useCallback(
    (newVal: Partial<ContentType>, qIdx: number) => {
      console.log("💫 UPDATE QUESTION:", {
        qIdx,
        questionId: allquestion[qIdx]?._id,
        updates: newVal,
        isConditional: !!allquestion[qIdx]?.parentcontent,
        oldScore: allquestion[qIdx]?.score,
        newScore: newVal.score,
        scoreDiff:
          newVal.score !== undefined
            ? newVal.score - (allquestion[qIdx]?.score || 0)
            : "no score change",
      });

      // Build new array synchronously to avoid dispatching inside reducer function payloads
      let updatedForAutosave: ContentType | null = null;
      const updatedQuestions = allquestion.map((question, index) => {
        if (index === qIdx) {
          const updatedQuestion = { ...question, ...newVal } as ContentType;
          updatedForAutosave = updatedQuestion;
          return updatedQuestion;
        }
        return question;
      });

      // Dispatch the new questions array immediately (no functional payload)
      dispatch(setallquestion(updatedQuestions as Array<ContentType>));

      // Enqueue autosave of just the changed question
      if (formstate.setting?.autosave && updatedForAutosave) {
        dispatch(setdisbounceQuestion(updatedForAutosave));
      }
    },
    [allquestion, dispatch, formstate.setting?.autosave]
  );

  const handleValidateAll = async () => {
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
  };

  const getValidationStatus = () => {
    if (!validationSummary) return null;

    const { totalInvalidQuestions } = validationSummary;

    if (totalInvalidQuestions === 0) {
      return (
        <Chip color="success" variant="flat" size="sm">
          ✓ All questions validated
        </Chip>
      );
    }

    return (
      <Chip color="warning" variant="flat" size="sm">
        ⚠ {totalInvalidQuestions} issue(s) found
      </Chip>
    );
  };

  return (
    <div className="solution_tab w-full h-fit flex flex-col items-center">
      {/* Fixed/Sticky Form Summary Section */}
      <div className="sticky top-0 z-10 w-full bg-white shadow-md border-b border-gray-200 py-4">
        <div className="w-full max-w-4xl mx-auto px-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Form Summary</h2>
            <div className="flex items-center gap-3">
              {getValidationStatus()}
              <Button
                color="primary"
                variant="bordered"
                size="sm"
                onPress={handleValidateAll}
                isLoading={isValidating}
              >
                Validate All
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {loading ? (
              <div className="col-span-3 flex justify-center">
                <CircularProgress size="sm" />
              </div>
            ) : (
              <>
                <div className="text-center p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                  <p className="text-xl font-bold text-blue-700">
                    {(formstate as FormDataType).totalscore ??
                      totalsummerize?.totalscore ??
                      0}
                  </p>
                  <p className="text-xs text-blue-600">
                    Total Score (All Questions)
                  </p>
                </div>
                <div className="text-center p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                  <p className="text-xl font-bold text-green-700">
                    {totalsummerize?.totalquestion ?? 0}
                  </p>
                  <p className="text-xs text-green-600">Total Questions</p>
                </div>
                <div className="text-center p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
                  <p className="text-xl font-bold text-purple-700">
                    {totalsummerize?.totalpage ?? 0}
                  </p>
                  <p className="text-xs text-purple-600">Total Pages</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area with proper top spacing */}
      <div className="question_card w-full h-fit flex flex-col items-center gap-20 pt-8 pb-20">
        {/* Expandable Validation Details Section */}
        <div className="w-full max-w-4xl">
          {/* Validation Alerts */}
          {validationSummary &&
            validationSummary.errors &&
            validationSummary.errors.length > 0 && (
              <Alert
                color="warning"
                title="Validation Issues Found"
                description={`Please fix the following issues: ${validationSummary.errors.join(
                  ", "
                )}`}
                className="mb-4"
              />
            )}

          {validationSummary &&
            validationSummary.canReturnScoreAutomatically && (
              <Alert
                color="success"
                title="Auto-scoring Enabled"
                description="This quiz can automatically return scores to users after submission."
                className="mb-4"
              />
            )}

          {formstate.type === "QUIZ" && validationSummary && (
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <h3 className="font-semibold mb-2 text-gray-800">
                Quiz Configuration Details
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Valid Questions:</span>
                  <span className="ml-2 font-medium text-green-600">
                    {validationSummary.totalValidQuestions}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Issues Found:</span>
                  <span className="ml-2 font-medium text-red-600">
                    {validationSummary.totalInvalidQuestions}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Auto-scoring:</span>
                  <span className="ml-2 font-medium">
                    {validationSummary.canReturnScoreAutomatically
                      ? "Enabled"
                      : "Disabled"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Return Type:</span>
                  <span className="ml-2 font-medium">
                    {formstate.setting?.returnscore || "Manual"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Questions Section */}
        {fetchloading ? (
          <QuestionLoading count={3} />
        ) : (
          <div className="w-full max-w-4xl space-y-8">
            {/* Conditional Questions Info */}
            {allquestion.some((q) => q.parentcontent) && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-sm font-medium text-blue-800">
                  📋 Conditional Questions Detected
                </h3>
                <p className="text-xs text-blue-600 mt-1">
                  This form contains{" "}
                  {allquestion.filter((q) => q.parentcontent).length}{" "}
                  conditional question(s) that appear based on parent question
                  answers. You can assign scores and answer keys to these
                  questions - they will be used when the conditions are met
                  during form submission.
                </p>
              </div>
            )}

            {allquestion.map((question, idx) => {
              const isConditional = !!question.parentcontent;

              return (
                <div
                  key={`question-${question._id || idx}-${idx}`}
                  className={`space-y-4 ${
                    isConditional
                      ? "bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400"
                      : ""
                  }`}
                >
                  {isConditional && (
                    <div className="text-xs text-blue-600 mb-2">
                      🔗 Conditional Question - Shows when parent condition is
                      met
                    </div>
                  )}
                  <Respondant_Question_Card
                    idx={question.qIdx ?? idx}
                    content={question}
                    onSelectAnswer={({ answer }) => {
                      updateQuestion({ answer: { answer } }, idx);
                    }}
                    color={formstate.setting?.qcolor}
                    isDisable={true}
                  />
                  <SolutionInput
                    key={`solution-${question._id || idx}-${idx}`}
                    content={question}
                    onUpdateContent={(updates) => updateQuestion(updates, idx)}
                    isValidated={question.isValidated}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Solution_Tab;
