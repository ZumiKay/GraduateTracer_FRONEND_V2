import React, { useState, useEffect } from "react";
import { Alert, Spinner } from "@heroui/react";
import ApiRequest, { ApiRequestReturnType } from "../../hooks/ApiHook";
import {
  FormTypeEnum,
  QuestionType,
  AnswerKey,
  RangeType,
} from "../../types/Form.types";
import { getGuestData } from "../../utils/publicFormUtils";
import Respondant_Question_Card from "../Card/Respondant.card";
import "./RespondentForm.css";

// Components
import { FormHeader } from "./components/FormHeader";
import { RespondentInfo } from "./components/RespondentInfo";
import { ConditionalIndicator } from "./components/ConditionalIndicator";
import { CheckboxQuestion } from "./components/CheckboxQuestion";
import { MultipleChoiceQuestion } from "./components/MultipleChoiceQuestion";
import { Navigation } from "./components/Navigation";
import { FormStateCard } from "./components/FormStateCard";

// Hooks
import { useFormData } from "./hooks/useFormData";
import { useFormResponses, ResponseValue } from "./hooks/useFormResponses";
import { useFormValidation } from "./hooks/useFormValidation";

// Utils
import {
  createValidationSummary,
  logValidationSummary,
} from "./utils/validationUtils";
import { validateSubmissionData } from "./utils/testUtils";

interface RespondentFormProps {
  token?: string;
  isGuest?: boolean;
  guestData?: {
    name: string;
    email: string;
  };
}

const RespondentForm: React.FC<RespondentFormProps> = ({
  isGuest = false,
  guestData,
}) => {
  const { form, questions, loading, error: formError } = useFormData();
  const {
    responses,
    updateResponse,
    initializeResponses,
    checkIfQuestionShouldShow,
  } = useFormResponses(questions);
  const { isPageComplete, validateForm } = useFormValidation();

  const [currentPage, setCurrentPage] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [respondentInfo, setRespondentInfo] = useState({
    name: guestData?.name || "",
    email: guestData?.email || "",
  });

  const isGuestMode = Boolean(isGuest && guestData);

  // Initialize responses when questions are loaded
  useEffect(() => {
    if (questions.length > 0) {
      initializeResponses();
    }
  }, [questions, initializeResponses]);

  // Restore guest data from session storage if available
  useEffect(() => {
    if (isGuest && !guestData) {
      const storedGuestData = getGuestData();
      if (storedGuestData) {
        setRespondentInfo({
          name: storedGuestData.name || "",
          email: storedGuestData.email || "",
        });
      }
    }
  }, [isGuest, guestData]);

  // Apply form styling to document root
  useEffect(() => {
    if (form?.setting) {
      const root = document.documentElement;
      root.style.setProperty("--form-bg", form.setting.bg || "#ffffff");
      root.style.setProperty("--form-text", form.setting.text || "#000000");
      root.style.setProperty("--form-navbar", form.setting.navbar || "#f5f5f5");
      root.style.setProperty("--form-qcolor", form.setting.qcolor || "#e5e7eb");
    }

    return () => {
      const root = document.documentElement;
      root.style.removeProperty("--form-bg");
      root.style.removeProperty("--form-text");
      root.style.removeProperty("--form-navbar");
      root.style.removeProperty("--form-qcolor");
    };
  }, [form?.setting]);

  // Get current page questions with conditional logic
  const getCurrentPageQuestions = () => {
    const pageQuestions = questions.filter((q) => q.page === currentPage);
    return pageQuestions.filter((question) =>
      checkIfQuestionShouldShow(question, responses)
    );
  };

  // Handle question answer with type processing
  const handleQuestionAnswer = (
    questionId: string,
    answer: Pick<AnswerKey, "answer">
  ) => {
    const question = questions.find((q) => q._id === questionId);
    if (!question) return;

    let processedValue: ResponseValue = answer.answer as ResponseValue;

    // Special processing for different question types
    switch (question.type) {
      case QuestionType.Date:
        if (answer.answer instanceof Date) {
          processedValue = answer.answer;
        }
        break;
      case QuestionType.RangeNumber:
      case QuestionType.RangeDate:
        if (
          typeof answer.answer === "object" &&
          answer.answer !== null &&
          "start" in answer.answer
        ) {
          processedValue = answer.answer;
        }
        break;
      case QuestionType.Number:
        if (
          typeof answer.answer === "string" &&
          !isNaN(Number(answer.answer))
        ) {
          processedValue = Number(answer.answer);
        }
        break;
      case QuestionType.ShortAnswer:
      case QuestionType.Paragraph:
        processedValue = String(answer.answer);
        break;
      default:
        processedValue = answer.answer as ResponseValue;
        break;
    }

    updateResponse(questionId, processedValue);
  };

  // Submit form
  const handleSubmit = async () => {
    if (!form) return;

    // Get all visible questions across all pages (considering conditional logic)
    const allVisibleQuestions = questions.filter((question) =>
      checkIfQuestionShouldShow(question, responses)
    );

    // Create validation summary for debugging
    const validationSummary = createValidationSummary(
      questions,
      allVisibleQuestions,
      responses
    );
    logValidationSummary(validationSummary);

    const validationError = validateForm(allVisibleQuestions, responses);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Validate email for quiz forms
    if (form.type === FormTypeEnum.Quiz && !respondentInfo.email) {
      setError("Email is required for quiz forms");
      return;
    }

    // Filter responses to only include visible questions for submission
    const visibleQuestionIds = new Set(allVisibleQuestions.map((q) => q._id));
    const filteredResponses = responses.filter(
      (r) =>
        visibleQuestionIds.has(r.questionId) &&
        r.response !== "" &&
        r.response !== null &&
        r.response !== undefined
    );

    // Debug logging for form submission
    if (import.meta.env.DEV) {
      console.log("Form submission details:", {
        totalQuestions: questions.length,
        visibleQuestions: allVisibleQuestions.length,
        totalResponses: responses.length,
        filteredResponses: filteredResponses.length,
        conditionalQuestions: allVisibleQuestions.filter((q) => q.parentcontent)
          .length,
        submittingData: filteredResponses.map((r) => ({
          questionId: r.questionId,
          responseType: typeof r.response,
          hasResponse: !!r.response,
          responsePreview: Array.isArray(r.response)
            ? `Array(${r.response.length})`
            : String(r.response).substring(0, 50),
        })),
      });
    }

    // Validate that we have at least some responses to submit
    if (
      filteredResponses.length === 0 &&
      allVisibleQuestions.some((q) => q.require)
    ) {
      setError(
        "Please fill out at least the required fields before submitting"
      );
      return;
    }

    // Additional validation for submission data
    validateSubmissionData(allVisibleQuestions, responses);

    try {
      setSubmitting(true);
      setError(null);

      const result = (await ApiRequest({
        url: "response/submit-response",
        method: "POST",
        data: {
          formId: form._id,
          responseset: filteredResponses.map((r) => ({
            questionId: r.questionId,
            response: r.response,
          })),
          guestEmail: respondentInfo.email || undefined,
          guestName: respondentInfo.name || undefined,
        },
      })) as ApiRequestReturnType;

      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || "Failed to submit form");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setError("Failed to submit form");
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  // Error state
  if (formError && !form) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Alert color="danger" title="Error">
          {formError}
        </Alert>
      </div>
    );
  }

  // Check if form accepts responses
  if (form && form.setting?.acceptResponses === false) {
    return (
      <div className="max-w-2xl mx-auto p-6 respondent-form">
        <FormStateCard
          type="closed"
          icon="🚫"
          title="Form Closed"
          message="This form is no longer accepting responses."
          subMessage="The form owner has disabled new submissions. Please contact them if you need to submit a response."
        />
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="max-w-2xl mx-auto p-6 respondent-form">
        <FormStateCard
          type="success"
          icon="✓"
          title="Form Submitted Successfully!"
          message="Thank you for your response. Your submission has been recorded."
          subMessage={
            form?.type === "QUIZ"
              ? "Results will be sent to your email address if scoring is enabled."
              : undefined
          }
        />
      </div>
    );
  }

  if (!form) return null;

  const currentQuestions = getCurrentPageQuestions();
  const totalPages = Math.max(...questions.map((q) => q.page || 1));
  const currentPageComplete = isPageComplete(currentQuestions, responses);

  return (
    <div className="max-w-4xl mx-auto p-6 min-h-screen respondent-form">
      {/* Form Header */}
      <FormHeader
        title={form.title}
        currentPage={currentPage}
        totalPages={totalPages}
      />

      {/* Respondent Information (for quiz forms) */}
      {form.type === "QUIZ" && currentPage === 1 && (
        <RespondentInfo
          respondentInfo={respondentInfo}
          setRespondentInfo={setRespondentInfo}
          isGuestMode={isGuestMode}
        />
      )}

      {/* Questions */}
      <div className="space-y-6">
        {currentQuestions.map((question, index) => {
          const currentResponse = responses.find(
            (r) => r.questionId === question._id
          );

          return (
            <div key={question._id} className="question-wrapper">
              <ConditionalIndicator question={question} questions={questions} />

              {question.type === QuestionType.CheckBox ? (
                <CheckboxQuestion
                  question={question}
                  currentResponse={currentResponse?.response}
                  updateResponse={updateResponse}
                />
              ) : question.type === QuestionType.MultipleChoice ? (
                <MultipleChoiceQuestion
                  question={question}
                  currentResponse={currentResponse?.response}
                  updateResponse={updateResponse}
                />
              ) : (
                // Use Respondant_Question_Card for other question types
                <div className="p-6 bg-white rounded-lg border shadow-sm">
                  <Respondant_Question_Card
                    content={{
                      ...question,
                      answer: currentResponse?.response
                        ? {
                            answer:
                              currentResponse.response as AnswerKey["answer"],
                          }
                        : undefined,
                      // For RangeNumber questions, ensure the value is properly set
                      numrange:
                        question.type === QuestionType.RangeNumber &&
                        currentResponse?.response
                          ? (currentResponse.response as RangeType<number>)
                          : question.numrange,
                    }}
                    color={form?.setting?.qcolor}
                    ty="form"
                    idx={(currentPage - 1) * 10 + index}
                    onSelectAnswer={(answer) =>
                      handleQuestionAnswer(question._id || "", answer)
                    }
                    isDisable={false}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Error Display */}
      {error && (
        <Alert color="danger" className="mt-4">
          {error}
        </Alert>
      )}

      {/* Navigation */}
      <Navigation
        currentPage={currentPage}
        totalPages={totalPages}
        isCurrentPageComplete={currentPageComplete}
        submitting={submitting}
        onPrevious={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
        onNext={() => setCurrentPage((prev) => prev + 1)}
        onPageChange={setCurrentPage}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default RespondentForm;
