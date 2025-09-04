import "./RespondentForm.css";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  memo,
  lazy,
} from "react";
import { Alert, Spinner } from "@heroui/react";
import ApiRequest, { ApiRequestReturnType } from "../../hooks/ApiHook";
import { FormTypeEnum, QuestionType, AnswerKey } from "../../types/Form.types";
import { getGuestData } from "../../utils/publicFormUtils";

const Respondant_Question_Card = lazy(() => import("../Card/Respondant.card"));
const FormHeader = lazy(() =>
  import("./components/FormHeader").then((m) => ({ default: m.FormHeader }))
);
const RespondentInfo = lazy(() =>
  import("./components/RespondentInfo").then((m) => ({
    default: m.RespondentInfo,
  }))
);
const ConditionalIndicator = lazy(() =>
  import("./components/ConditionalIndicator").then((m) => ({
    default: m.ConditionalIndicator,
  }))
);
const CheckboxQuestion = lazy(() =>
  import("./components/CheckboxQuestion").then((m) => ({
    default: m.CheckboxQuestion,
  }))
);
const MultipleChoiceQuestion = lazy(() =>
  import("./components/MultipleChoiceQuestion").then((m) => ({
    default: m.MultipleChoiceQuestion,
  }))
);
const Navigation = lazy(() =>
  import("./components/Navigation").then((m) => ({ default: m.Navigation }))
);
const FormStateCard = lazy(() =>
  import("./components/FormStateCard").then((m) => ({
    default: m.FormStateCard,
  }))
);

import {
  useFormResponses,
  ResponseValue,
  FormResponse,
} from "./hooks/useFormResponses";
import { useFormValidation } from "./hooks/useFormValidation";

interface SubmissionResultData {
  totalScore?: number;
  maxScore?: number;
  emailSent?: boolean;
  hasSubjectiveQuestions?: boolean;
  responseId?: string;
}

import {
  createValidationSummary,
  logValidationSummary,
} from "./utils/validationUtils";
import { UseRespondentFormPaginationReturn } from "./hooks/usePaginatedFormData";
import { RespondentInfoType, SaveProgressType } from "./Response.type";

interface RespondentFormProps {
  isGuest?: boolean;
  RespondentData?: RespondentInfoType;
  userId?: string;
  data: UseRespondentFormPaginationReturn;
  respondentInfo?: RespondentInfoType;
  setrespondentInfo?: React.Dispatch<
    React.SetStateAction<RespondentInfoType | undefined>
  >;
  // New props to better integrate with PublicFormAccess
  accessMode?: "login" | "guest" | "authenticated";
  isUserActive?: boolean;
}

const LoadingFallback = memo(() => (
  <div className="flex justify-center items-center py-4">
    <Spinner size="md" />
  </div>
));
LoadingFallback.displayName = "LoadingFallback";

const RespondentForm: React.FC<RespondentFormProps> = memo(
  ({
    isGuest = false,
    RespondentData,
    data,
    userId,
    respondentInfo,
    setrespondentInfo,
    accessMode = "authenticated",
    isUserActive = true,
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
    const [clearStorage, setclearStorage] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [submissionResult, setSubmissionResult] =
      useState<SubmissionResultData | null>(null);
    const [progressLoaded, setProgressLoaded] = useState(false);

    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const isGuestMode = useMemo(
      () => Boolean(isGuest && RespondentData),
      [RespondentData, isGuest]
    );

    // Generate unique storage key
    const getStorageKey = useCallback(
      (suffix: string) => {
        const formId = formState?._id || "unknown";
        const userKey = isGuestMode
          ? `guest_${RespondentData?.email || "anonymous"}`
          : "user";
        return `form_progress_${formId}_${userKey}_${suffix}`;
      },
      [formState?._id, isGuestMode, RespondentData?.email]
    );

    const saveProgressToStorage = useCallback(
      (value?: Record<string, unknown>) => {
        if (!formState?._id || !progressLoaded) {
          return;
        }

        if (accessMode === "authenticated" && !isUserActive) {
          return;
        }

        try {
          const storageKey = getStorageKey("progress");

          let previousStoredData: SaveProgressType | null = null;
          try {
            const savedProgress = localStorage.getItem(storageKey);
            if (savedProgress) {
              previousStoredData = JSON.parse(
                savedProgress
              ) as SaveProgressType;
            }
          } catch (parseError) {
            console.warn(
              "Failed to parse previously stored progress data:",
              parseError
            );
          }

          const meaningfulResponses = responses.filter((r) => {
            if (
              r.response === null ||
              r.response === undefined ||
              r.response === ""
            ) {
              return false;
            }
            if (Array.isArray(r.response)) {
              return r.response.length > 0;
            }
            return true;
          });

          let responsesSetUp;

          if (
            previousStoredData?.responses &&
            previousStoredData.responses.length > 0 &&
            meaningfulResponses.length > 0
          ) {
            const mergedResponses = [...previousStoredData.responses];

            meaningfulResponses.forEach((meaningfulRes) => {
              const existingIndex = mergedResponses.findIndex(
                (prevRes) => prevRes.questionId === meaningfulRes.questionId
              );

              if (existingIndex !== -1) {
                mergedResponses[existingIndex] = {
                  ...mergedResponses[existingIndex],
                  response: meaningfulRes.response,
                };
              } else {
                mergedResponses.push(meaningfulRes);
              }
            });

            responsesSetUp = mergedResponses;
          } else {
            if (
              previousStoredData?.responses &&
              previousStoredData.responses.length > 0
            )
              responsesSetUp = previousStoredData?.responses;
            else responsesSetUp = meaningfulResponses;
          }

          const progressData: SaveProgressType = {
            currentPage: currentPage ?? 1,
            responses: responsesSetUp,
            respondentInfo: {
              ...((previousStoredData?.respondentInfo ??
                respondentInfo) as RespondentInfoType),
            },
            timestamp: new Date().toISOString(),
            formId: formState._id,
            version: "1.0", // Add version for future compatibility
            ...(value ?? {}),
          };

          localStorage.setItem(storageKey, JSON.stringify(progressData));
        } catch (error) {
          console.error("Failed to save progress to localStorage:", error);
        }
      },
      [
        formState?._id,
        progressLoaded,
        accessMode,
        isUserActive,
        getStorageKey,
        responses,
        currentPage,
        respondentInfo,
      ]
    );

    const debouncedSaveProgress = useCallback(() => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        saveProgressToStorage();
      }, 1000);
    }, [saveProgressToStorage]);

    const loadProgressFromStorage = useCallback(() => {
      if (!formState?._id) {
        return false;
      }

      try {
        const storageKey = getStorageKey("progress");
        const savedProgress = localStorage.getItem(storageKey);

        if (savedProgress) {
          const progressData = JSON.parse(savedProgress) as SaveProgressType;

          if (progressData.formId === formState._id && progressData.version) {
            if (progressData.respondentInfo?.email && setrespondentInfo) {
              setrespondentInfo(progressData.respondentInfo);
            }

            if (progressData.responses) {
              batchUpdateResponses(progressData.responses);
            }

            if (progressData.currentPage && progressData.currentPage > 0) {
              //Restore saved page with time 1ms
              setTimeout(() => {
                goToPage(progressData.currentPage);
                data.goToPage(progressData.currentPage);
                setProgressLoaded(true);
                if (import.meta.env.DEV) {
                  console.log(
                    "Restored current page:",
                    progressData.currentPage
                  );
                }
              }, 100);
            } else {
              setProgressLoaded(true);
            }

            return true;
          }
        } else {
          if (import.meta.env.DEV) {
            console.log("No saved progress found for key:", storageKey);
          }
        }
      } catch (error) {
        console.error("Failed to load progress from localStorage:", error);

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
      setrespondentInfo,
      batchUpdateResponses,
      goToPage,
      data,
    ]);

    const clearProgressFromStorage = useCallback(() => {
      try {
        const storageKey = getStorageKey("progress");
        localStorage.removeItem(storageKey);
        if (import.meta.env.DEV) {
          console.log("Progress cleared from localStorage:", storageKey);
        }
      } catch (error) {
        console.error("Failed to clear progress from localStorage:", error);
      }
    }, [getStorageKey]);
    useEffect(() => {
      if (clearStorage) {
        clearProgressFromStorage();
      }
    }, [clearProgressFromStorage, clearStorage]);

    useEffect(() => {
      if (questions.length > 0 && formState?._id && !clearStorage) {
        const questionsWithoutIds = questions.filter((q) => !q._id);
        if (questionsWithoutIds.length > 0) {
          return;
        }

        initializeResponses();

        const timer = setTimeout(() => {
          const progressLoaded = loadProgressFromStorage();
          if (progressLoaded && import.meta.env.DEV) {
            console.log("Progress successfully restored from localStorage");
          } else {
            setProgressLoaded(true);
          }
        }, 50);

        return () => clearTimeout(timer);
      } else if (import.meta.env.DEV) {
        console.log("Cannot initialize - missing questions or form ID:", {
          questionsLength: questions.length,
          formId: formState?._id,
        });
      }
    }, [
      clearStorage,
      formState?._id,
      initializeResponses,
      loadProgressFromStorage,
      questions,
    ]);

    useEffect(() => {
      if (
        formState?._id &&
        questions.length > 0 &&
        progressLoaded &&
        !clearStorage &&
        (accessMode === "guest" || isUserActive) // Only auto-save for guests or active users
      ) {
        debouncedSaveProgress();
      }
    }, [
      questions.length,
      responses,
      currentPage,
      progressLoaded,
      formState?._id,
      submitting,
      clearStorage,
      debouncedSaveProgress,
      accessMode,
      isUserActive,
    ]);

    // Cleanup timeout on unmount
    useEffect(() => {
      return () => {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
      };
    }, []);

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

      if (!clearStorage) {
        window.addEventListener("beforeunload", handleBeforeUnload);
        document.addEventListener("visibilitychange", handleVisibilityChange);
      }

      return () => {
        window.removeEventListener("beforeunload", handleBeforeUnload);
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange
        );
      };
    }, [clearStorage, saveProgressToStorage]);

    useEffect(() => {
      if (setrespondentInfo) {
        if (isGuest && !RespondentData) {
          const storedGuestData = getGuestData();
          if (storedGuestData) {
            setrespondentInfo({
              name: storedGuestData.name || "",
              email: storedGuestData.email || "",
            });
          }
        } else {
          setrespondentInfo({
            name: "",
            email: RespondentData?.email as string,
          });
        }
      }
    }, [isGuest, RespondentData, setrespondentInfo]);

    //Apply the style setting to the form

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

    const handlePageChange = useCallback(
      (newPage: number) => {
        saveProgressToStorage({ currentPage: newPage });
        goToPage(newPage);
      },
      [saveProgressToStorage, goToPage]
    );

    // Navigation handlers
    const handleNext = useCallback(() => {
      if (canGoNext && currentPage) {
        saveProgressToStorage({
          currentPage: currentPage < totalPages ? currentPage + 1 : 1,
        });
        handlePage("next");
      }
    }, [canGoNext, currentPage, saveProgressToStorage, totalPages, handlePage]);

    const handlePrevious = useCallback(() => {
      if (canGoPrev && currentPage) {
        saveProgressToStorage({
          currentPage: currentPage === 1 ? 1 : currentPage - 1,
        });
        handlePage("prev");
      }
    }, [canGoPrev, currentPage, handlePage, saveProgressToStorage]);

    const getCurrentPageQuestions = useCallback(() => {
      const validQuestions = questions.filter((question) => {
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
          return false;
        }
      });

      return visibleQuestions;
    }, [questions, checkIfQuestionShouldShow, responses]);

    const handleQuestionAnswer = useCallback(
      (questionId: string, answer: Pick<AnswerKey, "answer">) => {
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

    const handleSubmit = async () => {
      if (!formState) return;
      //Ensure all page is question is loaded
      const savedData = localStorage.getItem(getStorageKey("progress"));
      const prevQuestion =
        savedData && (JSON.parse(savedData) as SaveProgressType);

      let ToSubmitQuestion: FormResponse[] = [];

      //Get All Answered Question
      if (
        prevQuestion &&
        prevQuestion.responses &&
        prevQuestion.responses.length > 0
      ) {
        ToSubmitQuestion = prevQuestion.responses;
      } else {
        ToSubmitQuestion = responses;
      }

      //Ensure all question is valid
      const allVisibleQuestions = questions.filter((question) => {
        if (!question._id) {
          console.error(
            "Question found without ID during submission:",
            question
          );
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

      //Final Validation Question // Wrong format // Missing Required etc.
      const validationSummary = createValidationSummary(
        questions,
        allVisibleQuestions,
        responses
      );
      logValidationSummary(validationSummary);

      const validationError = validateForm(questions, ToSubmitQuestion);

      if (validationError) {
        setError(validationError);
        return;
      }

      if (formState?.type === FormTypeEnum.Quiz && !respondentInfo?.email) {
        setError("Email is required for quiz forms");
        return;
      }

      const visibleQuestionIds = new Set(allVisibleQuestions.map((q) => q._id));

      const filteredResponses = responses.filter((r) => {
        const isVisible = visibleQuestionIds.has(r.questionId);
        const hasValue =
          r.response !== null && r.response !== undefined && r.response !== "";

        if (Array.isArray(r.response)) {
          return isVisible; // Include all array responses, even empty ones
        }

        return isVisible && hasValue;
      });

      if (
        filteredResponses.length === 0 &&
        allVisibleQuestions.some((q) => q.require)
      ) {
        setError(
          "Please fill out at least the required fields before submitting"
        );
        return;
      }

      setclearStorage(true);

      try {
        setSubmitting(true);
        setError(null);

        const result = (await ApiRequest({
          url: `response/submit-response`,
          method: "POST",
          data: {
            formId: formState?._id,
            responseset: ToSubmitQuestion.map((r) => ({
              questionId: r.questionId,
              response: r.response,
            })),
            userId,
            respondentEmail: RespondentData?.email,
            respondentName: RespondentData?.name,
          },
        })) as ApiRequestReturnType;

        if (result.success) {
          // Store submission result data for display
          if (result.data && typeof result.data === "object") {
            const data = result.data as SubmissionResultData;
            setSubmissionResult({
              totalScore: data.totalScore,
              maxScore: data.maxScore,
              emailSent: data.emailSent,
              hasSubjectiveQuestions: data.hasSubjectiveQuestions,
              responseId: data.responseId,
            });
          }

          setclearStorage(true);
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

    if (isLoading) {
      return (
        <div className="flex justify-center items-center min-h-screen">
          <Spinner size="lg" aria-label="Loading form" />
        </div>
      );
    }

    if (formError && !formState) {
      return (
        <div className="max-w-2xl mx-auto p-6">
          <Alert color="danger" title="Error" aria-label="Form loading error">
            {formError?.message || "An error occurred while loading the form"}
          </Alert>
        </div>
      );
    }

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

    if (success) {
      const hasScore =
        submissionResult && typeof submissionResult.totalScore === "number";
      const scorePercentage =
        hasScore && submissionResult.maxScore
          ? Math.round(
              (submissionResult.totalScore! / submissionResult.maxScore) * 100
            )
          : null;

      let subMessage = "";
      if (formState?.type === "QUIZ") {
        if (hasScore) {
          subMessage = `Your score: ${submissionResult.totalScore}/${submissionResult.maxScore}`;
          if (scorePercentage !== null) {
            subMessage += ` (${scorePercentage}%)`;
          }
          if (submissionResult.emailSent) {
            subMessage += "\n✉️ Results have been sent to your email address.";
          } else if (submissionResult.hasSubjectiveQuestions) {
            subMessage +=
              "\n📝 Your response includes questions that require manual scoring.";
          }
        } else {
          subMessage =
            "Results will be sent to your email address if scoring is enabled.";
        }
      }

      return (
        <div className="max-w-2xl mx-auto p-6 respondent-form">
          <FormStateCard
            type="success"
            icon="✓"
            title="Form Submitted Successfully!"
            message="Thank you for your response. Your submission has been recorded."
            subMessage={subMessage || undefined}
          />
          {hasScore && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-green-800">Your Score</h4>
                  <p className="text-2xl font-bold text-green-600">
                    {submissionResult.totalScore} / {submissionResult.maxScore}
                  </p>
                  {scorePercentage !== null && (
                    <p className="text-sm text-green-600">
                      ({scorePercentage}%)
                    </p>
                  )}
                </div>
                <div className="text-right">
                  {submissionResult.emailSent && (
                    <div className="flex items-center text-green-600 text-sm">
                      <span className="mr-1">✉️</span>
                      <span>Sent to email</span>
                    </div>
                  )}
                  {submissionResult.hasSubjectiveQuestions && (
                    <div className="flex items-center text-amber-600 text-sm mt-1">
                      <span className="mr-1">📝</span>
                      <span>This Score is partial only not a final score</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (!formState) return null;

    const currentQuestions = getCurrentPageQuestions();
    const currentPageComplete = isPageComplete(currentQuestions, responses);

    return (
      <div className="max-w-4xl mx-auto p-6 min-h-screen respondent-form">
        {/* User Activity Status Indicator */}
        {accessMode === "authenticated" && !isUserActive && (
          <div className="mb-4 p-3 bg-amber-100 border border-amber-400 rounded-lg text-amber-800">
            <div className="flex items-center gap-2">
              <span className="font-medium">⚠️ Session Inactive</span>
              <span className="text-sm">
                Your progress is not being saved. Please reactivate your session
                to continue.
              </span>
            </div>
          </div>
        )}

        <div className="mb-4 text-center">
          <small className="text-gray-500 italic">
            {progressLoaded ? (
              accessMode === "guest" || isUserActive ? (
                "✓ Your progress is automatically saved as you fill out the form"
              ) : (
                "⚠️ Progress saving is paused due to inactive session"
              )
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Spinner size="sm" />
                Loading saved progress...
              </span>
            )}
          </small>
        </div>

        {formState && (
          <FormHeader
            title={formState?.title}
            currentPage={currentPage ?? 1}
            totalPages={totalPages}
          />
        )}

        {formState &&
          currentPage === 1 &&
          respondentInfo &&
          setrespondentInfo && (
            <RespondentInfo
              respondentInfo={respondentInfo}
              setRespondentInfo={setrespondentInfo as never}
              isGuestMode={isGuestMode}
            />
          )}

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
                  {currentPage}/{totalPages} | Loading:{" "}
                  {isLoading ? "Yes" : "No"} | Current page questions:{" "}
                  {getCurrentPageQuestions().length} | Unique IDs:{" "}
                  {new Set(questions.map((q) => q._id)).size} | Responses with
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
                {/* Duplicate detection warning */}
                {questions.length !==
                  new Set(questions.map((q) => q._id)).size && (
                  <p className="text-red-600 font-bold">
                    ⚠️ DUPLICATES DETECTED:{" "}
                    {questions.length -
                      new Set(questions.map((q) => q._id)).size}{" "}
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
                        currentResponse={currentResponse?.response as never}
                        updateResponse={updateResponse}
                      />
                    ) : question.type === QuestionType.MultipleChoice ? (
                      <MultipleChoiceQuestion
                        idx={index}
                        question={question}
                        currentResponse={currentResponse?.response as never}
                        updateResponse={updateResponse}
                      />
                    ) : (
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

        {error && (
          <Alert
            color="danger"
            className="mt-4"
            aria-label="Form submission error"
          >
            {error}
          </Alert>
        )}

        {currentQuestions && (
          <Navigation
            currentPage={currentPage ?? 1}
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
  }
);

export default RespondentForm;
