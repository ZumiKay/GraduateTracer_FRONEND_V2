import "./RespondentForm.css";
import React, { useState, useEffect, useCallback } from "react";
import { Alert, Spinner } from "@heroui/react";
import ApiRequest, { ApiRequestReturnType } from "../../hooks/ApiHook";
import { FormTypeEnum, QuestionType, AnswerKey } from "../../types/Form.types";
import { getGuestData } from "../../utils/publicFormUtils";
import Respondant_Question_Card from "../Card/Respondant.card";

// Components
import { FormHeader } from "./components/FormHeader";
import { RespondentInfo } from "./components/RespondentInfo";
import { ConditionalIndicator } from "./components/ConditionalIndicator";
import { CheckboxQuestion } from "./components/CheckboxQuestion";
import { MultipleChoiceQuestion } from "./components/MultipleChoiceQuestion";
import { Navigation } from "./components/Navigation";
import { FormStateCard } from "./components/FormStateCard";

// Hooks
import { usePaginatedFormData } from "./hooks/usePaginatedFormData";
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
  const {
    form,
    allQuestions: questions,
    currentPageQuestions,
    loading,
    error: formError,
    totalPages: totalPagesFromHook,
    currentPage: paginatedCurrentPage,
    setCurrentPage: setPaginatedCurrentPage,
    isPageLoaded,
    retryPage,
    failedPages,
    isPageLoading,
  } = usePaginatedFormData();

  const {
    responses,
    updateResponse,
    batchUpdateResponses,
    initializeResponses,
    checkIfQuestionShouldShow,
  } = useFormResponses(questions);
  const { isPageComplete, validateForm } = useFormValidation(
    checkIfQuestionShouldShow
  );
  const [currentPage, setCurrentPage] = useState(paginatedCurrentPage);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [respondentInfo, setRespondentInfo] = useState({
    name: guestData?.name || "",
    email: guestData?.email || "",
  });

  // Sync local currentPage with paginated currentPage
  useEffect(() => {
    setCurrentPage(paginatedCurrentPage);
  }, [paginatedCurrentPage]);

  const isGuestMode = Boolean(isGuest && guestData);

  // Generate unique storage key for this form
  const getStorageKey = useCallback(
    (suffix: string) => {
      const formId = form?._id || "unknown";
      const userKey = isGuestMode
        ? `guest_${guestData?.email || "anonymous"}`
        : "user";
      return `form_progress_${formId}_${userKey}_${suffix}`;
    },
    [form?._id, isGuestMode, guestData?.email]
  );

  // Save progress to localStorage
  const saveProgressToStorage = useCallback(() => {
    if (!form?._id || !progressLoaded) {
      if (import.meta.env.DEV) {
        console.log("Skipping save - form not ready:", {
          hasFormId: !!form?._id,
          progressLoaded,
        });
      }
      return;
    }

    try {
      // Only save responses that have actual values
      const meaningfulResponses = responses.filter((r) => {
        if (
          r.response === null ||
          r.response === undefined ||
          r.response === ""
        ) {
          return false;
        }
        // For arrays, check if they have content
        if (Array.isArray(r.response)) {
          return r.response.length > 0;
        }
        return true;
      });

      const progressData = {
        currentPage,
        responses: meaningfulResponses,
        respondentInfo,
        timestamp: new Date().toISOString(),
        formId: form._id,
        version: "1.0", // Add version for future compatibility
      };

      const storageKey = getStorageKey("progress");
      localStorage.setItem(storageKey, JSON.stringify(progressData));
    } catch (error) {
      console.error("Failed to save progress to localStorage:", error);
    }
  }, [
    form?._id,
    currentPage,
    responses,
    respondentInfo,
    getStorageKey,
    progressLoaded,
  ]);

  // Load progress from localStorage
  const loadProgressFromStorage = useCallback(() => {
    if (!form?._id) {
      return false;
    }

    try {
      const storageKey = getStorageKey("progress");
      const savedProgress = localStorage.getItem(storageKey);

      if (savedProgress) {
        const progressData = JSON.parse(savedProgress);

        // Verify this is for the same form and has required structure
        if (progressData.formId === form._id && progressData.version) {
          // Restore respondent info first
          if (progressData.respondentInfo) {
            setRespondentInfo(progressData.respondentInfo);
          }

          // Restore responses using batch update to properly trigger conditional logic
          if (progressData.responses && Array.isArray(progressData.responses)) {
            const restoredResponses = progressData.responses;

            // Use batch update for better performance and proper conditional handling
            batchUpdateResponses(restoredResponses);
          }

          // Restore page after responses are loaded
          if (progressData.currentPage && progressData.currentPage > 0) {
            // Small delay to ensure responses are processed
            setTimeout(() => {
              setCurrentPage(progressData.currentPage);
              setProgressLoaded(true);
              if (import.meta.env.DEV) {
                console.log("Restored current page:", progressData.currentPage);
              }
            }, 100);
          } else {
            setProgressLoaded(true);
          }

          return true;
        } else {
          // Clear invalid/outdated progress data
          localStorage.removeItem(storageKey);
        }
      } else {
        if (import.meta.env.DEV) {
          console.log("No saved progress found for key:", storageKey);
        }
      }
    } catch (error) {
      console.error("Failed to load progress from localStorage:", error);
      // Clear corrupted data
      try {
        localStorage.removeItem(getStorageKey("progress"));
      } catch (clearError) {
        console.error("Failed to clear corrupted progress data:", clearError);
      }
    }
    return false;
  }, [form?._id, batchUpdateResponses, getStorageKey]);

  // Clear progress from localStorage
  const clearProgressFromStorage = useCallback(() => {
    if (!form?._id) return;

    try {
      const storageKey = getStorageKey("progress");
      localStorage.removeItem(storageKey);
      if (import.meta.env.DEV) {
        console.log("Progress cleared from localStorage:", storageKey);
      }
    } catch (error) {
      console.error("Failed to clear progress from localStorage:", error);
    }
  }, [form?._id, getStorageKey]);

  // Verification function for localStorage (development only)
  const verifyLocalStorage = useCallback(() => {
    if (!import.meta.env.DEV || !form?._id) return;

    const storageKey = getStorageKey("progress");
    const savedData = localStorage.getItem(storageKey);

    console.log("=== LocalStorage Verification ===");
    console.log("Storage Key:", storageKey);
    console.log("Has Saved Data:", !!savedData);

    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        console.log("Parsed Data:", {
          formId: parsed.formId,
          version: parsed.version,
          currentPage: parsed.currentPage,
          responseCount: parsed.responses?.length || 0,
          hasRespondentInfo: !!parsed.respondentInfo,
          timestamp: parsed.timestamp,
        });
        console.log("Full Data:", parsed);
      } catch (error) {
        console.error("Error parsing saved data:", error);
      }
    }
  }, [form?._id, getStorageKey]);

  // Expose verification function to window for debugging (development only)
  useEffect(() => {
    if (import.meta.env.DEV && form?._id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).verifyFormProgress = verifyLocalStorage;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).clearFormProgress = clearProgressFromStorage;
    }
  }, [form?._id, verifyLocalStorage, clearProgressFromStorage]);

  // Initialize responses when questions are loaded
  useEffect(() => {
    if (questions.length > 0 && form?._id) {
      if (import.meta.env.DEV) {
        console.log(
          "Initializing responses for",
          questions.length,
          "questions for form:",
          form._id
        );
      }

      initializeResponses();

      // Load saved progress after a short delay to ensure responses are initialized
      const timer = setTimeout(() => {
        const progressLoaded = loadProgressFromStorage();
        if (progressLoaded && import.meta.env.DEV) {
          console.log("Progress successfully restored from localStorage");
        } else {
          setProgressLoaded(true); // No progress to load, mark as ready
          if (import.meta.env.DEV) {
            console.log("No progress to restore, form ready for new responses");
          }
        }
      }, 50);

      return () => clearTimeout(timer);
    } else if (import.meta.env.DEV) {
      console.log("Cannot initialize - missing questions or form ID:", {
        questionsLength: questions.length,
        formId: form?._id,
      });
    }
  }, [questions, form?._id, initializeResponses, loadProgressFromStorage]);

  // Save progress when responses or currentPage changes (with debouncing)
  useEffect(() => {
    if (form?._id && questions.length > 0 && progressLoaded) {
      // Add a small delay to prevent excessive saves during rapid changes
      const saveTimer = setTimeout(() => {
        saveProgressToStorage();
      }, 500); // 500ms debounce

      return () => clearTimeout(saveTimer);
    }
  }, [
    form?._id,
    questions.length,
    responses,
    currentPage,
    respondentInfo,
    progressLoaded,
    saveProgressToStorage,
  ]);

  // Clear progress on successful submission
  useEffect(() => {
    if (success) {
      clearProgressFromStorage();
    }
  }, [success, clearProgressFromStorage]);

  // Save progress when user leaves the page
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveProgressToStorage();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        saveProgressToStorage();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [saveProgressToStorage]);

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

  // Custom page navigation that saves progress and uses paginated fetching
  const handlePageChange = useCallback(
    (newPage: number) => {
      // Save progress before changing page
      saveProgressToStorage();
      setCurrentPage(newPage);
      setPaginatedCurrentPage(newPage);
    },
    [saveProgressToStorage, setPaginatedCurrentPage]
  );

  // Get current page questions with conditional logic
  const getCurrentPageQuestions = () => {
    // Use currentPageQuestions from the paginated hook for better performance
    const pageQuestions = currentPageQuestions;

    if (import.meta.env.DEV) {
      console.log("Getting current page questions (paginated):", {
        currentPage,
        totalQuestions: questions.length,
        pageQuestions: pageQuestions.length,
        isPageLoaded: isPageLoaded(currentPage),
        pageQuestionsData: pageQuestions.map((q) => ({
          id: q._id,
          type: q.type,
          hasParent: !!q.parentcontent,
          parentContent: q.parentcontent,
        })),
      });
    }

    const visibleQuestions = pageQuestions.filter((question) => {
      const isVisible = checkIfQuestionShouldShow(question, responses);

      return isVisible;
    });

    return visibleQuestions;
  };

  const handleQuestionAnswer = useCallback(
    (questionId: string, answer: Pick<AnswerKey, "answer">) => {
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
    },
    [questions, updateResponse]
  );

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

    // Validate form - use all questions and let validateForm handle visibility
    const validationError = validateForm(questions, responses);

    if (validationError) {
      // Add debug info to error message in development
      if (import.meta.env.DEV) {
        console.log("=== VALIDATION FAILED ===");
        const problematicQuestions = questions.filter((q) => {
          const isVisible = checkIfQuestionShouldShow(q, responses);
          const response = responses.find((r) => r.questionId === q._id);
          const hasValidResponse =
            response &&
            response.response !== "" &&
            response.response !== null &&
            response.response !== undefined;
          return q.require && isVisible && !hasValidResponse;
        });
        console.log(
          "Questions failing validation:",
          problematicQuestions.map((q) => ({
            id: q._id,
            title: typeof q.title === "string" ? q.title : String(q.title),
            type: q.type,
            hasParent: !!q.parentcontent,
            response: responses.find((r) => r.questionId === q._id)?.response,
          }))
        );
      }
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
        <Spinner size="lg" aria-label="Loading form" />
      </div>
    );
  }

  // Error state
  if (formError && !form) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Alert color="danger" title="Error" aria-label="Form loading error">
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
  const totalPages = totalPagesFromHook;
  const currentPageComplete = isPageComplete(currentQuestions, responses);

  return (
    <div className="max-w-4xl mx-auto p-6 min-h-screen respondent-form">
      {/* Progress Auto-Save Indicator */}
      <div className="mb-4 text-center">
        <small className="text-gray-500 italic">
          {progressLoaded ? (
            "✓ Your progress is automatically saved as you fill out the form"
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Spinner size="sm" />
              Loading saved progress...
            </span>
          )}
        </small>
      </div>

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
        {/* Debug info for conditional questions in development */}
        {import.meta.env.DEV && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">
              Debug: Paginated Form Status
            </h3>
            <div className="text-xs text-blue-600 space-y-1">
              <p>
                Total questions: {questions.length} | Current page:{" "}
                {currentPage}/{totalPages} | Page loaded:{" "}
                {isPageLoaded(currentPage) ? "✓" : "Loading..."} | Page loading:{" "}
                {isPageLoading ? "✓" : "✗"} | Failed pages:{" "}
                {Array.from(failedPages).join(", ") || "None"} | Responses with
                values:{" "}
                {
                  responses.filter(
                    (r) =>
                      r.response !== "" &&
                      r.response !== null &&
                      r.response !== undefined
                  ).length
                }
              </p>
              {questions
                .filter((q) => q.require)
                .map((q) => {
                  const isVisible = checkIfQuestionShouldShow(q, responses);
                  const response = responses.find(
                    (r) => r.questionId === q._id
                  );
                  const hasValidResponse =
                    response &&
                    response.response !== "" &&
                    response.response !== null &&
                    response.response !== undefined;
                  const title =
                    typeof q.title === "string" ? q.title : String(q.title);

                  return (
                    <div
                      key={q._id}
                      className={`p-1 rounded ${
                        isVisible && q.require && !hasValidResponse
                          ? "bg-red-100"
                          : "bg-green-100"
                      }`}
                    >
                      <strong>{title.substring(0, 30)}...</strong> | Visible:{" "}
                      {isVisible ? "✓" : "✗"} | Required:{" "}
                      {q.require ? "✓" : "✗"} | Has Response:{" "}
                      {hasValidResponse ? "✓" : "✗"} | Value:{" "}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Page loading indicator and error handling */}
        {!isPageLoaded(currentPage) && !failedPages.has(currentPage) && (
          <div className="flex justify-center items-center py-8">
            <Spinner size="lg" aria-label="Loading page questions" />
            <span className="ml-3 text-gray-600">
              Loading page {currentPage}...
            </span>
          </div>
        )}

        {/* Failed page retry option */}
        {failedPages.has(currentPage) && (
          <div className="flex flex-col justify-center items-center py-8">
            <Alert color="warning" title="Page Load Failed" className="mb-4">
              Failed to load page {currentPage}. Please try again.
            </Alert>
            <button
              onClick={() => retryPage(currentPage)}
              disabled={isPageLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isPageLoading ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Retrying...
                </>
              ) : (
                "Retry Loading Page"
              )}
            </button>
          </div>
        )}

        {/* Only render questions if page is loaded */}
        {isPageLoaded(currentPage) &&
          currentQuestions.map((question, index) => {
            const currentResponse = responses.find(
              (r) => r.questionId === question._id
            );

            return (
              <div key={question._id} className="question-wrapper">
                <ConditionalIndicator
                  question={question}
                  questions={questions}
                />

                {question.type === QuestionType.CheckBox ? (
                  <CheckboxQuestion
                    idx={index}
                    question={question}
                    currentResponse={currentResponse?.response}
                    updateResponse={updateResponse}
                  />
                ) : question.type === QuestionType.MultipleChoice ? (
                  <MultipleChoiceQuestion
                    idx={index}
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
                        idx: index,
                        answer: currentResponse?.response
                          ? {
                              answer:
                                currentResponse.response as AnswerKey["answer"],
                            }
                          : undefined,
                        // For RangeNumber questions, ensure the value is properly set
                        rangenumber: question.rangenumber,
                      }}
                      color={form?.setting?.qcolor}
                      ty="form"
                      idx={index}
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
        <Alert
          color="danger"
          className="mt-4"
          aria-label="Form submission error"
        >
          {error}
        </Alert>
      )}

      {/* Navigation */}
      <Navigation
        currentPage={currentPage}
        totalPages={totalPages}
        isCurrentPageComplete={currentPageComplete}
        submitting={submitting}
        onPrevious={() => {
          if (currentPage > 1) {
            handlePageChange(currentPage - 1);
          }
        }}
        onNext={() => {
          handlePageChange(currentPage + 1);
        }}
        onPageChange={handlePageChange}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default RespondentForm;
