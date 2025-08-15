import "./RespondentForm.css";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Alert, form, Spinner } from "@heroui/react";
import ApiRequest, { ApiRequestReturnType } from "../../hooks/ApiHook";
import { FormTypeEnum, QuestionType, AnswerKey } from "../../types/Form.types";
import { getGuestData } from "../../utils/publicFormUtils";
import Respondant_Question_Card from "../Card/Respondant.card";

import { FormHeader } from "./components/FormHeader";
import { RespondentInfo } from "./components/RespondentInfo";
import { ConditionalIndicator } from "./components/ConditionalIndicator";
import { CheckboxQuestion } from "./components/CheckboxQuestion";
import { MultipleChoiceQuestion } from "./components/MultipleChoiceQuestion";
import { Navigation } from "./components/Navigation";
import { FormStateCard } from "./components/FormStateCard";

import { useFormResponses, ResponseValue } from "./hooks/useFormResponses";
import { useFormValidation } from "./hooks/useFormValidation";

import {
  createValidationSummary,
  logValidationSummary,
} from "./utils/validationUtils";
import { validateSubmissionData } from "./utils/testUtils";
import { UseRespondentFormPaginationReturn } from "./hooks/usePaginatedFormData";

interface RespondentFormProps {
  isGuest?: boolean;
  guestData?: {
    name: string;
    email: string;
  };
  data: UseRespondentFormPaginationReturn;
}

const RespondentForm: React.FC<RespondentFormProps> = ({
  isGuest = false,
  guestData,
  data,
}) => {
  const {
    formState,
    isLoading,
    error: formError,
    handlePage,
    currentPage,
    goToPage,
    canGoNext,
    canGoPrev,
    totalPages,
  } = data;

  const questions = useMemo(
    () => formState?.contents || [],
    [formState?.contents]
  );

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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [respondentInfo, setRespondentInfo] = useState({
    name: guestData?.name || "",
    email: guestData?.email || "",
  });

  const isGuestMode = Boolean(isGuest && guestData);

  // Generate unique storage key for this form
  const getStorageKey = useCallback(
    (suffix: string) => {
      const formId = formState?._id || "unknown";
      const userKey = isGuestMode
        ? `guest_${guestData?.email || "anonymous"}`
        : "user";
      return `form_progress_${formId}_${userKey}_${suffix}`;
    },
    [formState?._id, isGuestMode, guestData?.email]
  );

  const saveProgressToStorage = useCallback(() => {
    if (!formState?._id || !progressLoaded) {
      if (import.meta.env.DEV) {
        console.log("Skipping save - form not ready:", {
          hasFormId: !!formState?._id,
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
        formId: formState._id,
        version: "1.0", // Add version for future compatibility
      };

      const storageKey = getStorageKey("progress");
      localStorage.setItem(storageKey, JSON.stringify(progressData));
    } catch (error) {
      console.error("Failed to save progress to localStorage:", error);
    }
  }, [
    formState?._id,
    progressLoaded,
    responses,
    currentPage,
    respondentInfo,
    getStorageKey,
  ]);

  // Load progress from localStorage
  const loadProgressFromStorage = useCallback(() => {
    if (!formState?._id) {
      return false;
    }

    try {
      const storageKey = getStorageKey("progress");
      const savedProgress = localStorage.getItem(storageKey);

      if (savedProgress) {
        const progressData = JSON.parse(savedProgress);

        if (progressData.formId === formState._id && progressData.version) {
          // Restore respondent info first
          if (progressData.respondentInfo) {
            setRespondentInfo(progressData.respondentInfo);
          }

          // Restore responses using batch update to properly trigger conditional logic
          if (progressData.responses && Array.isArray(progressData.responses)) {
            const restoredResponses = progressData.responses;

            const validResponses = restoredResponses.filter(
              (response: { questionId?: string }) => {
                if (!response.questionId) {
                  console.warn(
                    "Ignoring response without questionId:",
                    response
                  );
                  return false;
                }
                const questionExists = questions.some(
                  (q) => q._id === response.questionId
                );
                if (!questionExists) {
                  console.warn(
                    "Ignoring response for missing question:",
                    response.questionId
                  );
                  return false;
                }
                return true;
              }
            );

            if (validResponses.length > 0) {
              batchUpdateResponses(validResponses);
            }
          }

          if (progressData.currentPage && progressData.currentPage > 0) {
            // Small delay to ensure responses are processed
            setTimeout(() => {
              goToPage(progressData.currentPage);
              data.goToPage(progressData.currentPage);
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
  }, [
    formState?._id,
    getStorageKey,
    questions,
    batchUpdateResponses,
    goToPage,
    data,
  ]);

  // Clear progress from localStorage
  const clearProgressFromStorage = useCallback(() => {
    if (!formState?._id) return;

    try {
      const storageKey = getStorageKey("progress");
      localStorage.removeItem(storageKey);
      if (import.meta.env.DEV) {
        console.log("Progress cleared from localStorage:", storageKey);
      }
    } catch (error) {
      console.error("Failed to clear progress from localStorage:", error);
    }
  }, [formState?._id, getStorageKey]);

  // Initialize responses when questions are loaded
  useEffect(() => {
    if (questions.length > 0 && formState?._id) {
      const questionsWithoutIds = questions.filter((q) => !q._id);
      if (questionsWithoutIds.length > 0) {
        return;
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
        formId: formState?._id,
      });
    }
  }, [questions, initializeResponses, loadProgressFromStorage, formState?._id]);

  // Save progress when responses or currentPage changes (with debouncing)
  useEffect(() => {
    if (formState?._id && questions.length > 0 && progressLoaded) {
      // Add a small delay to prevent excessive saves during rapid changes
      const saveTimer = setTimeout(() => {
        saveProgressToStorage();
      }, 500); // 500ms debounce

      return () => clearTimeout(saveTimer);
    }
  }, [
    questions.length,
    responses,
    currentPage,
    respondentInfo,
    progressLoaded,
    saveProgressToStorage,
    formState?._id,
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
    if (formState?.setting) {
      const root = document.documentElement;
      root.style.setProperty("--form-bg", formState.setting.bg || "#ffffff");
      root.style.setProperty(
        "--form-text",
        formState.setting.text || "#000000"
      );
      root.style.setProperty(
        "--form-navbar",
        formState.setting.navbar || "#f5f5f5"
      );
      root.style.setProperty(
        "--form-qcolor",
        formState.setting.qcolor || "#e5e7eb"
      );
    }

    return () => {
      const root = document.documentElement;
      root.style.removeProperty("--form-bg");
      root.style.removeProperty("--form-text");
      root.style.removeProperty("--form-navbar");
      root.style.removeProperty("--form-qcolor");
    };
  }, [formState?.setting]);

  // Custom page navigation that saves progress and uses paginated fetching
  const handlePageChange = useCallback(
    (newPage: number) => {
      // Save progress before changing page
      saveProgressToStorage();
      goToPage(newPage);
    },
    [saveProgressToStorage, goToPage]
  );

  // Navigation handlers
  const handleNext = useCallback(() => {
    if (canGoNext) {
      saveProgressToStorage();
      handlePage("next");
    }
  }, [canGoNext, saveProgressToStorage, handlePage]);

  const handlePrevious = useCallback(() => {
    if (canGoPrev) {
      handlePage("prev");
    }
  }, [canGoPrev, handlePage]);

  const getCurrentPageQuestions = useCallback(() => {
    const pageQuestions = questions.filter((q) => q.page === currentPage);

    // Validate all questions have IDs before filtering
    const validQuestions = pageQuestions.filter((question) => {
      if (!question._id) {
        return false;
      }
      return true;
    });

    const visibleQuestions = validQuestions.filter((question) => {
      try {
        const isVisible = checkIfQuestionShouldShow(question, responses);
        return isVisible;
      } catch (error) {
        console.error(error);
        return false; // Don't show questions that cause errors
      }
    });

    return visibleQuestions;
  }, [currentPage, questions, checkIfQuestionShouldShow, responses]);

  const handleQuestionAnswer = useCallback(
    (questionId: string, answer: Pick<AnswerKey, "answer">) => {
      // Validate questionId is provided
      if (!questionId) {
        console.error("handleQuestionAnswer called with empty questionId");
        return;
      }

      const question = questions.find((q) => q._id === questionId);
      if (!question) {
        console.error("Question not found for ID:", questionId);
        return;
      }

      let processedValue: ResponseValue = answer.answer as ResponseValue;

      // Special processing for different question types
      try {
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
      } catch (error) {
        console.error("Error processing question answer:", error, {
          questionId,
          questionType: question.type,
          answer: answer.answer,
        });
      }
    },
    [questions, updateResponse]
  );

  // Submit form
  const handleSubmit = async () => {
    if (!form) return;

    // Get all visible questions across all pages (considering conditional logic)
    const allVisibleQuestions = questions.filter((question) => {
      if (!question._id) {
        console.error("Question found without ID during submission:", question);
        return false;
      }
      try {
        return checkIfQuestionShouldShow(question, responses);
      } catch (error) {
        console.error(
          "Error checking question visibility during submission:",
          error,
          question
        );
        return false;
      }
    });

    const validationSummary = createValidationSummary(
      questions,
      allVisibleQuestions,
      responses
    );
    logValidationSummary(validationSummary);

    // Validate form - use all questions and let validateForm handle visibility
    const validationError = validateForm(questions, responses);

    if (validationError) {
      //Debug
      if (import.meta.env.DEV) {
        console.log("=== VALIDATION FAILED ===");
        const problematicQuestions = questions.filter((q) => {
          if (!q._id) return false; // Skip questions without IDs
          try {
            const isVisible = checkIfQuestionShouldShow(q, responses);
            const response = responses.find((r) => r.questionId === q._id);
            const hasValidResponse =
              response &&
              response.response !== "" &&
              response.response !== null &&
              response.response !== undefined;
            return q.require && isVisible && !hasValidResponse;
          } catch (error) {
            console.error("Error in validation check:", error, q);
            return false;
          }
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
    if (formState?.type === FormTypeEnum.Quiz && !respondentInfo.email) {
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
          formId: formState?._id,
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
  if (isLoading) {
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
          {formError?.message || "An error occurred while loading the form"}
        </Alert>
      </div>
    );
  }

  // Check if form accepts responses
  if (formState && formState?.setting?.acceptResponses === false) {
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
            formState?.type === "QUIZ"
              ? "Results will be sent to your email address if scoring is enabled."
              : undefined
          }
        />
      </div>
    );
  }

  if (!form) return null;

  const currentQuestions = getCurrentPageQuestions();
  // Remove this line as totalPages is already available from the hook
  // const totalPages = totalPagesFromHook;
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
      {formState && (
        <FormHeader
          title={formState?.title}
          currentPage={currentPage ?? 1}
          totalPages={totalPages}
        />
      )}

      {/* Respondent Information (for quiz forms) */}
      {formState && formState.type === "QUIZ" && currentPage === 1 && (
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
                {currentPage}/{totalPages} | Loading: {isLoading ? "Yes" : "No"}{" "}
                | Current page questions: {getCurrentPageQuestions().length} |
                Unique IDs: {new Set(questions.map((q) => q._id)).size} |
                Responses with values:{" "}
                {
                  responses.filter(
                    (r) =>
                      r.response !== "" &&
                      r.response !== null &&
                      r.response !== undefined
                  ).length
                }
              </p>
              {/* Duplicate detection warning */}
              {questions.length !==
                new Set(questions.map((q) => q._id)).size && (
                <p className="text-red-600 font-bold">
                  ⚠️ DUPLICATES DETECTED:{" "}
                  {questions.length - new Set(questions.map((q) => q._id)).size}{" "}
                  duplicate question(s) found!
                </p>
              )}
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

        {/* Page loading indicator */}
        {isLoading && (
          <div className="flex justify-center items-center py-8">
            <Spinner size="lg" aria-label="Loading form data" />
            <span className="ml-3 text-gray-600">Loading form data...</span>
          </div>
        )}

        {/* Only render questions if form is loaded */}
        {!isLoading &&
          currentQuestions
            .map((question, index) => {
              // Safety check: ensure question has required properties
              if (!question._id) {
                console.error("Question missing ID:", question);
                return null;
              }

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
                        color={formState?.setting?.qcolor}
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
            })
            .filter(Boolean)}
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
      {currentPage && (
        <Navigation
          currentPage={currentPage}
          totalPages={totalPages}
          isCurrentPageComplete={currentPageComplete}
          submitting={submitting}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onPageChange={handlePageChange}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
};

export default RespondentForm;
