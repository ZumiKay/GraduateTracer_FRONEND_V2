import { useDispatch, useSelector } from "react-redux";
import Respondant_Question_Card from "../../Card/Respondant.card";
import { RootState } from "../../../redux/store";
import { QuestionLoading } from "../../Loading/ContainerLoading";
import { CircularProgress, Button, Chip, Alert } from "@heroui/react";
import { setallquestion, setdisbounceQuestion } from "../../../redux/formstore";
import { ContentType, FormValidationSummary } from "../../../types/Form.types";
import { useEffect, useState } from "react";
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

  // React Query for form total summary
  const { data: totalsummerize, isLoading: loading } = useQuery({
    queryKey: ["formTotalSummary", formstate._id],
    queryFn: () => fetchFormTotalSummary(formstate._id!),
    enabled: !!formstate._id,
    staleTime: 30000, // Cache for 30 seconds
    retry: 2,
  });

  // Initial validation when component mounts or form ID changes - optimized to avoid dependency issues
  useEffect(() => {
    let isMounted = true;

    const runValidation = async () => {
      if (formstate._id && isMounted) {
        try {
          const validation = await validateForm(formstate._id, "solution");
          if (validation && isMounted) {
            setValidationSummary(validation);
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
  }, [formstate._id, validateForm]);

  //Helper Function
  const updateQuestion = (newVal: Partial<ContentType>, qIdx: number) => {
    const updatedQuestions = allquestion.map((question, index) => {
      if (index === qIdx) {
        const updatedQuestion = { ...question, ...newVal };

        if (formstate.setting?.autosave) {
          dispatch(setdisbounceQuestion(updatedQuestion));
        }

        return updatedQuestion;
      }

      return question;
    });

    dispatch(setallquestion(updatedQuestions as Array<ContentType>));
  };

  const handleValidateAll = async () => {
    if (!formstate._id) return;

    try {
      const validation = await validateForm(formstate._id, "send_form");
      if (validation) {
        setValidationSummary(validation);
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
    <div className="solution_tab w-full h-fit flex flex-col items-center pt-20 pb-20">
      <div className="question_card w-full h-fit flex flex-col items-center gap-20">
        {/* Enhanced Summary Section */}
        <div className="w-full max-w-4xl bg-white p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-6">
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {loading ? (
              <div className="col-span-3 flex justify-center">
                <CircularProgress size="sm" />
              </div>
            ) : (
              <>
                <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                  <p className="text-2xl font-bold text-blue-700">
                    {totalsummerize?.totalscore ?? 0}
                  </p>
                  <p className="text-sm text-blue-600">Total Score</p>
                </div>
                <div className="text-center p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                  <p className="text-2xl font-bold text-green-700">
                    {totalsummerize?.totalquestion ?? 0}
                  </p>
                  <p className="text-sm text-green-600">Total Questions</p>
                </div>
                <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
                  <p className="text-2xl font-bold text-purple-700">
                    {totalsummerize?.totalpage ?? 0}
                  </p>
                  <p className="text-sm text-purple-600">Total Pages</p>
                </div>
              </>
            )}
          </div>

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
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Quiz Configuration</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Valid Questions:</span>
                  <span className="ml-2 font-medium">
                    {validationSummary.totalValidQuestions}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Issues Found:</span>
                  <span className="ml-2 font-medium">
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
            {allquestion.map((question, idx) => (
              <div key={`question-${idx}`} className="space-y-4">
                <Respondant_Question_Card
                  idx={idx}
                  content={question}
                  onSelectAnswer={({ answer }) => {
                    updateQuestion({ answer: { answer } }, idx);
                  }}
                  color={formstate.setting?.qcolor}
                  isDisable={true}
                />
                <SolutionInput
                  content={question}
                  onUpdateContent={(updates) => updateQuestion(updates, idx)}
                  isValidated={question.isValidated}
                  hasAnswer={question.hasAnswer}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Solution_Tab;
