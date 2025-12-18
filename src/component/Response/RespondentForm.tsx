import "./RespondentForm.css";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  memo,
  lazy,
} from "react";
import { Alert, Spinner } from "@heroui/react";
import {
  QuestionType,
  AnswerKey,
  ContentType,
  FormTypeEnum as FormTypeEnumImport,
} from "../../types/Form.types";
import { useSessionContext } from "../../context/SessionContext";

const FormHeader = lazy(() =>
  import("./components/FormHeader").then((m) => ({ default: m.FormHeader }))
);
const Navigation = lazy(() =>
  import("./components/Navigation").then((m) => ({ default: m.Navigation }))
);
const FormStateCard = lazy(() =>
  import("./components/FormStateCard").then((m) => ({
    default: m.FormStateCard,
  }))
);

import { useFormResponses, ResponseValue } from "./hooks/useFormResponses";
import { useFormValidation } from "./hooks/useFormValidation";
import { UseRespondentFormPaginationReturn } from "./hooks/usePaginatedFormData";
import { RespondentInfoType } from "./Response.type";
import SuccessToast, { ErrorToast } from "../Modal/AlertModal";
import { RespondentInfo } from "./components/RespondentInfo";
import { useDispatch } from "react-redux";
import { setopenmodal } from "../../redux/openmodal";
import { useProgressStorage } from "./hooks/useProgressStorage";
import {
  useFormSubmission,
  useSendResponseCopy,
} from "./hooks/useFormSubmission";
import { SubmissionSuccessView } from "./components/SubmissionSuccessView";
import { DebugPanel } from "./components/DebugPanel";
import { QuestionRenderer } from "./components/QuestionRenderer";

const uniqueToastId = "respondentFormUniqueToastId";

export interface RespondentFormProps {
  isGuest?: boolean;
  userId?: string;
  data: UseRespondentFormPaginationReturn;
  formSessionInfo: RespondentInfoType;
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
    const { checkSession } = useSessionContext();

    const questions = useMemo(
      () => formState?.contents || [],
      [formState?.contents]
    ) as ContentType<unknown>[];

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

    const [respondentInfo, setRespondentInfo] =
      useState<RespondentInfoType>(formSessionInfo);

    useEffect(() => {
      setRespondentInfo(formSessionInfo);
    }, [formSessionInfo]);

    // Use progress storage hook
    const {
      progressLoaded,
      setProgressLoaded,
      progressStorageKey,
      saveProgressToStorage,
      loadProgressFromStorage,
    } = useProgressStorage({
      formId: formState?._id,
      respondentEmail: formSessionInfo.respondentEmail,
      responses,
      currentPage: currentPage ?? 1,
      formSessionInfo,
      success: false, // Will be updated after submission hook
      accessMode,
      isUserActive,
      submitting: false, // Will be updated after submission hook
    });

    // Use form submission hook
    const {
      submitting,
      error,
      success,
      setSuccess,
      submissionResult,
      handleSubmit,
    } = useFormSubmission({
      formId: formState?._id,
      formType: formState?.type as FormTypeEnumImport | undefined,
      progressStorageKey,
      questions,
      responses,
      checkIfQuestionShouldShow: checkIfQuestionShouldShow as never,
      validateForm: validateForm as never,
      respondentInfo,
      clearProgressState,
    });

    const scoreData = useMemo(() => {
      return (
        submissionResult ?? formState?.submittedResult ?? formState?.isResponsed
      );
    }, [formState?.isResponsed, formState?.submittedResult, submissionResult]);

    const sendResponse = useSendResponseCopy(
      scoreData?.responseId,
      scoreData?.respondentEmail
    );

    // Check if the user already responded
    useEffect(() => {
      if (formState?.setting?.submitonce && formState.isResponsed) {
        setSuccess(true);
      }
    }, [
      formState,
      formState?.isResponsed,
      formState?.responses,
      formState?.setting?.submitonce,
      setSuccess,
    ]);

    // Load progress from storage on mount
    useEffect(() => {
      if (questions.length > 0 && formState?._id) {
        const questionsWithoutIds = questions.filter((q) => !q._id);
        if (questionsWithoutIds.length > 0) {
          return;
        }

        const timer = setTimeout(() => {
          const loaded = loadProgressFromStorage(
            updateResponse,
            goToPage,
            data.goToPage
          );
          if (loaded && import.meta.env.DEV) {
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
      formState?._id,
      loadProgressFromStorage,
      questions,
      updateResponse,
      goToPage,
      data,
      setProgressLoaded,
    ]);

    // Apply the style setting to the form
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

    // Session check wrapper for page navigation
    const withSessionCheck = useCallback(
      async (action: () => void) => {
        // Only check session for authenticated/guest modes
        if (accessMode === "authenticated" || accessMode === "guest") {
          const isValid = await checkSession();
          if (!isValid) {
            console.log("❌ Session expired, blocking navigation");
            return;
          }
        }
        action();
      },
      [accessMode, checkSession]
    );

    const handlePageChange = useCallback(
      (newPage: number) => {
        const proceed = async () => {
          await withSessionCheck(() => {
            saveProgressToStorage({ currentPage: newPage });
            goToPage(newPage);
          });
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
      [
        currentPageComplete,
        saveProgressToStorage,
        goToPage,
        dispatch,
        withSessionCheck,
      ]
    );

    // Navigation handlers with session check
    const handleNext = useCallback(async () => {
      if (canGoNext && currentPage) {
        await withSessionCheck(() => {
          saveProgressToStorage({
            currentPage: currentPage < totalPages ? currentPage + 1 : 1,
          });
          handlePage("next");
        });
      }
    }, [
      canGoNext,
      currentPage,
      saveProgressToStorage,
      totalPages,
      handlePage,
      withSessionCheck,
    ]);

    const handlePrevious = useCallback(async () => {
      if (canGoPrev && currentPage) {
        await withSessionCheck(() => {
          saveProgressToStorage({
            currentPage: currentPage === 1 ? 1 : currentPage - 1,
          });
          handlePage("prev");
        });
      }
    }, [
      canGoPrev,
      currentPage,
      handlePage,
      saveProgressToStorage,
      withSessionCheck,
    ]);

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

    const handleSendACopy = async () => {
      if (!scoreData?.responseId || !scoreData.respondentEmail) {
        ErrorToast({
          toastid: uniqueToastId,
          title: "Invalid",
          content: "Unexpected Error",
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
      return (
        <SubmissionSuccessView
          formType={formState?.type as FormTypeEnumImport | undefined}
          submissionResult={submissionResult}
          formSubmittedResult={formState?.submittedResult}
          formIsResponsed={formState?.isResponsed}
          onSendCopy={handleSendACopy}
          isSendingCopy={sendResponse.isPending}
        />
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
            <DebugPanel
              questions={questions}
              currentPage={currentPage ?? 1}
              totalPages={totalPages}
              isLoading={isLoading}
              responses={responses}
              checkIfQuestionShouldShow={checkIfQuestionShouldShow as never}
            />

            {/* Page loading indicator */}
            {isLoading && (
              <div className="flex justify-center items-center py-8">
                <Spinner size="lg" aria-label="Loading form data" />
                <span className="ml-3 text-gray-600">Loading form data...</span>
              </div>
            )}

            {!isLoading &&
              currentQuestions.map((question, index) => (
                <QuestionRenderer
                  key={question._id}
                  question={question}
                  index={index}
                  questions={questions}
                  currentResponse={responses.find(
                    (r) => r.question === question._id
                  )}
                  formQColor={formState?.setting?.qcolor}
                  onAnswer={handleQuestionAnswer}
                  updateResponse={updateResponse as never}
                />
              ))}
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
