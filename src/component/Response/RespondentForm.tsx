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
import { Alert, Button, Spinner } from "@heroui/react";
import ApiRequest, { ApiRequestReturnType } from "../../hooks/ApiHook";
import {
  FormTypeEnum,
  QuestionType,
  AnswerKey,
  FormResponseType,
} from "../../types/Form.types";

const Respondant_Question_Card = lazy(() => import("../Card/Respondant.card"));
const FormHeader = lazy(() =>
  import("./components/FormHeader").then((m) => ({ default: m.FormHeader }))
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
import { UseRespondentFormPaginationReturn } from "./hooks/usePaginatedFormData";
import {
  RespondentInfoType,
  SaveProgressType,
  SubmittionProcessionReturnType,
} from "./Response.type";
import { useMutation } from "@tanstack/react-query";
import SuccessToast, { ErrorToast } from "../Modal/AlertModal";
import { generateStorageKey } from "../../helperFunc";
import { RespondentInfo } from "./components/RespondentInfo";
import { useDispatch } from "react-redux";
import { setopenmodal } from "../../redux/openmodal";

const uniqueToastId = "respondentFormUniqueToastId";

export interface RespondentFormProps {
  isGuest?: boolean;
  userId?: string;
  data: UseRespondentFormPaginationReturn;
  formSessionInfo: RespondentInfoType;
  // New props to better integrate with PublicFormAccess
  accessMode?: "login" | "guest" | "authenticated";
  isUserActive?: boolean;
  response?: Partial<FormResponseType>;
}

const LoadingFallback = memo(() => (
  <div className="flex justify-center items-center py-4">
    <Spinner size="md" />
  </div>
));

LoadingFallback.displayName = "LoadingFallback";

const useSendResponseCopy = (responseId?: string, recipitentEmail?: string) =>
  useMutation({
    mutationFn: async () => {
      const req = await ApiRequest({
        method: "POST",
        url: "/response/send-card-email",
        data: {
          responseId,
          recipitentEmail,
        },
      });

      return req;
    },
  });

const RespondentForm: React.FC<RespondentFormProps> = memo(
  ({
    data,
    accessMode = "authenticated",
    isUserActive = true,
    formSessionInfo,
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

    const dispatch = useDispatch();

    const questions = useMemo(
      () => formState?.contents || [],
      [formState?.contents]
    );

    const {
      responses,
      updateResponse,
      checkIfQuestionShouldShow,
      clearProgressState,
    } = useFormResponses(
      questions,
      formState?._id as string,
      formSessionInfo.respondentEmail
    );

    const { isPageComplete, validateForm } = useFormValidation(
      checkIfQuestionShouldShow
    );

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [submissionResult, setSubmissionResult] =
      useState<SubmittionProcessionReturnType | null>(null);
    const [progressLoaded, setProgressLoaded] = useState(false);
    const [respondentInfo, setRespondentInfo] =
      useState<RespondentInfoType>(formSessionInfo);

    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const sendResponse = useSendResponseCopy(
      submissionResult?.responseId,
      submissionResult?.respondentEmail
    );

    //Progress Key
    const progressStorageKey = useMemo(() => {
      if (!formState || !formState._id) return null;

      return generateStorageKey({
        suffix: "progress",
        formId: formState._id,
        userKey: formSessionInfo?.respondentEmail,
      });
    }, [formState, formSessionInfo?.respondentEmail]);

    //Check if the user already response
    useEffect(() => {
      if (formState?.setting?.submitonce && formState.isResponsed) {
        setSuccess(true);
      }
    }, [
      formState,
      formState?.isResponsed,
      formState?.responses,
      formState?.setting?.submitonce,
    ]);
    useEffect(() => {
      //Clear storage if form is submitted
      if (success && progressStorageKey) {
        window.localStorage.removeItem(progressStorageKey);
      }
    }, [clearProgressState, progressStorageKey, success]);

    const saveProgressToStorage = useCallback(
      (value?: Record<string, unknown>) => {
        if (
          !formState?._id ||
          !progressLoaded ||
          !progressStorageKey ||
          success
        ) {
          return;
        }

        if (accessMode === "login" && !isUserActive) {
          return;
        }

        try {
          let previousStoredData: SaveProgressType | null = null;

          //Get form progress
          try {
            const savedProgress = localStorage.getItem(progressStorageKey);
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

          const nonNullResponses = responses.filter((r) => {
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
            nonNullResponses.length > 0
          ) {
            const mergedResponses = [...previousStoredData.responses];

            nonNullResponses.forEach((meaningfulRes) => {
              const existingIndex = mergedResponses.findIndex(
                (prevRes) => prevRes.question === meaningfulRes.question
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
            else responsesSetUp = nonNullResponses;
          }

          const progressData: SaveProgressType = {
            currentPage: currentPage ?? 1,
            responses: responsesSetUp,
            respondentInfo: {
              ...((previousStoredData?.respondentInfo ??
                formSessionInfo) as RespondentInfoType),
            },
            timestamp: new Date().toISOString(),
            formId: formState._id,
            version: "1.0", // Add version for future compatibility
            ...(value ?? {}),
          };

          localStorage.setItem(
            progressStorageKey,
            JSON.stringify(progressData)
          );

          // Clean up duplicate progress key without email if we're saving with email
          if (formSessionInfo?.respondentEmail) {
            const keyWithoutEmail = generateStorageKey({
              suffix: "progress",
              formId: formState._id,
              userKey: undefined, // No email
            });

            // Remove the key without email if it exists and is different from current key
            if (
              keyWithoutEmail !== progressStorageKey &&
              localStorage.getItem(keyWithoutEmail)
            ) {
              localStorage.removeItem(keyWithoutEmail);
              if (import.meta.env.DEV) {
                console.log(
                  "Removed duplicate progress key without email:",
                  keyWithoutEmail
                );
              }
            }
          }

          if (import.meta.env.DEV) {
            console.log("Progress saved to localStorage:", {
              key: progressStorageKey,
              responsesCount: responsesSetUp.length,
              currentPage: progressData.currentPage,
              timestamp: progressData.timestamp,
            });
          }
        } catch (error) {
          console.error("Failed to save progress to localStorage:", error);
        }
      },
      [
        formState?._id,
        progressLoaded,
        progressStorageKey,
        success,
        accessMode,
        isUserActive,
        responses,
        currentPage,
        formSessionInfo,
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
      if (!formState?._id || !progressStorageKey) {
        return false;
      }

      try {
        const savedProgress = localStorage.getItem(progressStorageKey);

        if (savedProgress) {
          const progressData = JSON.parse(savedProgress) as SaveProgressType;

          if (progressData.formId === formState._id && progressData.version) {
            if (progressData.responses && progressData.responses.length > 0) {
              updateResponse(progressData.responses as never);
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
            console.log("No saved progress found for key:", progressStorageKey);
          }
        }
      } catch (error) {
        console.error("Failed to load progress from localStorage:", error);

        try {
          localStorage.removeItem(progressStorageKey);
        } catch (clearError) {
          console.error("Failed to clear corrupted progress data:", clearError);
        }
      }
      return false;
    }, [formState?._id, progressStorageKey, updateResponse, goToPage, data]);

    useEffect(() => {
      if (questions.length > 0 && formState?._id) {
        const questionsWithoutIds = questions.filter((q) => !q._id);
        if (questionsWithoutIds.length > 0) {
          return;
        }

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
    }, [formState?._id, loadProgressFromStorage, questions]);

    useEffect(() => {
      if (
        formState?._id &&
        questions.length > 0 &&
        progressLoaded &&
        (accessMode === "guest" || isUserActive)
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

      if (!submitting && !success) {
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
    }, [saveProgressToStorage, submitting, success]);

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

    const currentQuestions = getCurrentPageQuestions();
    const currentPageComplete = isPageComplete(currentQuestions, responses);

    const handlePageChange = useCallback(
      (newPage: number) => {
        const proceed = () => {
          saveProgressToStorage({ currentPage: newPage });
          goToPage(newPage);
        };

        if (!currentPageComplete) {
          dispatch(
            setopenmodal({
              state: "confirm",
              value: {
                open: true,
                data: {
                  question: "Please fill in required question before procceed",
                  onAgree: () => proceed(),
                  btn: {
                    agree: "Proceed",
                    disagree: "Close",
                  },
                },
              },
            })
          );
          return;
        }

        proceed();
      },
      [currentPageComplete, saveProgressToStorage, goToPage, dispatch]
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
            case QuestionType.Selection:
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

    const handleRespondentInfoChange = useCallback(
      (updatedInfo: RespondentInfoType) => {
        setRespondentInfo(updatedInfo);
      },
      []
    );

    const handleSubmit = async () => {
      if (!formState || !progressStorageKey) {
        ErrorToast({
          toastid: "SubmitError",
          title: "Failed",
          content: "Missing Parameter",
        });
        return;
      }

      //Load progress from storage
      const savedData = localStorage.getItem(progressStorageKey);
      const prevQuestion =
        savedData && (JSON.parse(savedData) as SaveProgressType);

      let ToSubmitQuestion: FormResponse[] = [];

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
      const validationError = validateForm(questions, ToSubmitQuestion);

      if (validationError) {
        setError(validationError);
        return;
      }

      if (
        formState?.type === FormTypeEnum.Quiz &&
        !formSessionInfo?.respondentEmail
      ) {
        setError("Email is required for quiz forms");
        return;
      }

      const visibleQuestionIds = new Set(allVisibleQuestions.map((q) => q._id));

      //Check for required conditioned question
      const filteredResponses = responses.filter((r) => {
        const isVisible = visibleQuestionIds.has(r.question);
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

      try {
        setSubmitting(true);
        setError(null);

        const result = (await ApiRequest({
          url: `response/submit-response/${formState._id}`,
          method: "POST",
          cookie: true,
          data: {
            responseSet: ToSubmitQuestion,
            respondentEmail: respondentInfo?.respondentEmail,
            respondentName: respondentInfo?.respondentName,
          },
        })) as ApiRequestReturnType;

        if (result.success) {
          // Store submission result data for display
          if (result.data && typeof result.data === "object") {
            const data = result.data as SubmittionProcessionReturnType;
            setSubmissionResult(data);
          }

          setSuccess(true);
          //Remove progressStorage
          clearProgressState();
          window.localStorage.removeItem(progressStorageKey);
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

    const handleSendACopy = async () => {
      if (!submissionResult?.responseId || !submissionResult.respondentEmail) {
        ErrorToast({
          toastid: uniqueToastId,
          title: "Invalid",
          content: "Please submit response first",
        });
        return;
      }

      try {
        const req = await sendResponse.mutateAsync();

        if (!req.success) {
          ErrorToast({ title: "Error", content: req.error ?? "Error Occured" });
          return;
        }

        SuccessToast({ title: "Success", content: "Email Sent" });
      } catch (error) {
        console.log("Error", error);
        ErrorToast({ title: "Send Copy", content: "Error Occured" });
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
      // Use submissionResult as the primary source for score data
      const scoreData =
        submissionResult ??
        formState?.submittedResult ??
        formState?.isResponsed;

      // hasScore should be true when we have valid score data and the form is scoreable (not isNonScore)
      // Note: totalScore >= 0 is valid (user could score 0 points)
      const hasScore =
        scoreData &&
        !scoreData.isNonScore &&
        typeof scoreData.totalScore === "number" &&
        typeof scoreData.maxScore === "number" &&
        scoreData.maxScore > 0;

      const scorePercentage =
        hasScore && scoreData.maxScore
          ? Math.round((scoreData.totalScore / scoreData.maxScore) * 100)
          : null;

      let subMessage = "";
      if (formState?.type === "QUIZ") {
        if (hasScore) {
          subMessage = `Your score: ${scoreData.totalScore}/${scoreData.maxScore}`;
          if (scorePercentage !== null) {
            subMessage += ` (${scorePercentage}%)`;
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
          {hasScore && scoreData && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-green-800">Your Score</h4>
                  <p className="text-2xl font-bold text-green-600">
                    {scoreData.totalScore} / {scoreData.maxScore}
                  </p>
                  {scorePercentage !== null && (
                    <p className="text-sm text-green-600">
                      ({scorePercentage}%)
                    </p>
                  )}
                </div>
                <div className="w-full h-fit flex flex-col justify-center">
                  {scoreData.message && (
                    <div className="flex items-center text-amber-600 text-sm mt-1">
                      <span className="mr-1">📝</span>
                      <span>{scoreData.message}</span>
                    </div>
                  )}
                  {scoreData.responseId && scoreData.respondentEmail && (
                    <Button
                      className="responseCopy font-bold text-white"
                      variant="bordered"
                      color="default"
                      onPress={() => handleSendACopy()}
                    >
                      {`Send a copy of the response`}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (!formState) return null;

    return (
      <>
        <div className="max-w-4xl mx-auto p-6 min-h-screen respondent-form">
          {/* User Activity Status Indicator */}
          {accessMode !== "login" && !isUserActive && (
            <div className="mb-4 p-3 bg-amber-100 border border-amber-400 rounded-lg text-amber-800">
              <div className="flex items-center gap-2">
                <span className="font-medium">⚠️ Session Inactive</span>
                <span className="text-sm">
                  Your progress is not being saved. Please reactivate your
                  session to continue.
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
            formState._id &&
            currentPage === 1 &&
            formSessionInfo && (
              <RespondentInfo
                respondentInfo={respondentInfo}
                onRespondentInfoChange={handleRespondentInfoChange}
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
                        (r) => r.question === q._id
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
                          <strong>{title.substring(0, 30)}...</strong> |
                          Visible: {isVisible ? "✓" : "✗"} | Required:{" "}
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
                    (r) => r.question === question._id
                  );

                  return (
                    <div key={question._id} className="question-wrapper">
                      <ConditionalIndicator
                        question={question}
                        questions={questions}
                      />

                      {question.type === QuestionType.CheckBox ? (
                        <CheckboxQuestion
                          question={question}
                          currentResponse={currentResponse?.response as never}
                          updateResponse={updateResponse}
                        />
                      ) : question.type === QuestionType.MultipleChoice ? (
                        <MultipleChoiceQuestion
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
                              answer:
                                currentResponse?.response !== undefined &&
                                currentResponse.response !== null
                                  ? ({
                                      answer: currentResponse.response,
                                    } as AnswerKey)
                                  : undefined,
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
        </div>
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
      </>
    );
  }
);

export default RespondentForm;
