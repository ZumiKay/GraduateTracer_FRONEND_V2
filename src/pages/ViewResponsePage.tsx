import React, { useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  Chip,
  CircularProgress,
  useDisclosure,
} from "@heroui/react";
import {
  FiSave,
  FiArrowLeft,
  FiChevronLeft,
  FiChevronRight,
  FiSend,
} from "react-icons/fi";
import { useQuery } from "@tanstack/react-query";
import { FormTypeEnum, QuestionType } from "../types/Form.types";
import {
  ResponseDataType,
  ScoringMethod,
  statusColor,
} from "../component/Response/Response.type";
import { getResponseDisplayName } from "../utils/respondentUtils";
import { fetchResponseDetails } from "../services/responseService";
import { useDispatch } from "react-redux";
import { setformstate } from "../redux/formstore";
import { useFormAPI } from "../hooks/useFormAPI";
import { ErrorToast } from "../component/Modal/AlertModal";
import ResponseItem from "../components/ViewResponse/ResponseItem";
import RespondentInfoCard from "../components/ViewResponse/RespondentInfoCard";
import ReturnResponseModal from "../components/ViewResponse/ReturnResponseModal";
import { useResponseScoring } from "../hooks/useResponseScoring";
import { useResponseNavigation } from "../hooks/useResponseNavigation";
import { useReturnResponse } from "../hooks/useReturnResponse";

const ViewResponsePage: React.FC = () => {
  const { formId, responseId } = useParams<{
    formId: string;
    responseId: string;
  }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { fetchFormTab } = useFormAPI();

  const {
    isOpen: isReturnModalOpen,
    onOpen: onReturnModalOpen,
    onClose: onReturnModalClose,
  } = useDisclosure();

  // Use custom hooks
  const {
    responseIds,
    currentResponseIndex,
    canGoPrev,
    canGoNext,
    handleNavigateResponse,
  } = useResponseNavigation({ responseId, formId });

  // Fetch form data
  const { data: form, isLoading: isLoadingForm } = useQuery({
    queryKey: ["FormInfo", formId, "response"],
    queryFn: () => fetchFormTab({ tab: "response", page: 1, formId: formId! }),
    enabled: !!formId,
  });

  // Fetch response details
  const { data: selectedResponse, isLoading: isLoadingResponse } =
    useQuery<ResponseDataType>({
      queryKey: ["responseDetails", responseId, formId],
      queryFn: async () => {
        if (!responseId || !formId) throw new Error("Response ID is required");
        return await fetchResponseDetails(responseId, formId);
      },
      enabled: !!responseId || !!formId,
      staleTime: 30000,
      gcTime: 300000,
    });

  // Use scoring hook
  const {
    hasUnsavedChanges,
    pendingScores,
    isSavingScores,
    handleQuestionScoreUpdate,
    handleSaveAllScores,
  } = useResponseScoring({
    responseId,
    formId,
    selectedResponse,
  });

  // Use return response hook
  const {
    returnReason,
    setReturnReason,
    returnFeedback,
    setReturnFeedback,
    returnAdditionalInfo,
    setReturnAdditionalInfo,
    includeQuestionsAndResponses,
    setIncludeQuestionsAndResponses,
    handleReturnResponse,
    isLoading: isReturningResponse,
  } = useReturnResponse({
    responseId,
    onClose: onReturnModalClose,
  });

  const isQuizForm = form?.type === FormTypeEnum.Quiz;

  // Dispatch form data to Redux when form is loaded
  const dispatchFormData = useCallback(() => {
    if (!responseId) {
      ErrorToast({
        toastid: "View Response Page Error",
        title: "Missing",
        content: "Response not found",
      });
      return;
    }
    if (form && form.type) {
      dispatch(
        setformstate({
          ...form,
          contents: undefined,
        })
      );
    }
  }, [responseId, form, dispatch]);

  React.useEffect(() => {
    dispatchFormData();
  }, [dispatchFormData]);

  const formatDate = useCallback((date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  const getStatusColor = useCallback((status: string): statusColor => {
    switch (status) {
      case "completed":
        return "success";
      case "autoscore":
        return "success";
      case "partial":
        return "warning";
      case "submitted":
        return "default";
      case "noscore":
        return "default";
      case "notreturn":
        return "danger";
      case "abandoned":
        return "danger";
      default:
        return "default";
    }
  }, []);

  const computedData = useMemo(() => {
    if (!selectedResponse) return null;

    const displayName = getResponseDisplayName(selectedResponse);
    const email = selectedResponse.respondentEmail || "No email provided";
    const submittedDate = selectedResponse.submittedAt
      ? formatDate(selectedResponse.submittedAt)
      : "Not yet submitted";

    // Calculate current total score from responseset (including pending changes)
    const totalScore =
      selectedResponse.responseset?.reduce((sum, resp) => {
        const questionId = resp.question._id as string;
        const score =
          pendingScores[questionId] !== undefined
            ? pendingScores[questionId]
            : resp.score || 0;
        return sum + Number(score);
      }, 0) || 0;

    // Calculate max total score by summing all scoreable question scores
    const maxTotalScore =
      selectedResponse.responseset?.reduce((total, resp) => {
        const question = resp.question;
        // Only count questions that are scoreable (not text type, not conditional parent)
        if (
          question &&
          question.type !== QuestionType.Text &&
          !question.parentcontent &&
          question.score
        ) {
          return total + (question.score || 0);
        }
        return total;
      }, 0) || 0;

    return { displayName, email, totalScore, maxTotalScore, submittedDate };
  }, [selectedResponse, formatDate, pendingScores]);

  const responseItems = useMemo(() => {
    if (!selectedResponse) return [];

    return selectedResponse.responseset?.map((resp, index) => {
      const question = resp.question;
      const isAutoScore = resp.scoringMethod === ScoringMethod.AUTO;
      return {
        id: `${resp._id}-${index}`,
        response: resp,
        question,
        isAutoScore,
        index,
      };
    });
  }, [selectedResponse]);

  // Check if response is scoreable (all required questions have score value)
  const isScoreable = useMemo(() => {
    if (!isQuizForm || !selectedResponse?.responseset) return true;

    // Check if any required question has no score defined
    const hasUnscoredQuestion = selectedResponse.responseset.some((resp) => {
      const question = resp.question;
      // A question needs score if it's a quiz question and not a text type
      if (
        question &&
        question.require &&
        question.type !== QuestionType.Text &&
        !question.parentcontent
      ) {
        return (
          question.score === undefined ||
          question.score === null ||
          question.score === 0
        );
      }
      return false;
    });

    return !hasUnscoredQuestion;
  }, [isQuizForm, selectedResponse]);

  const isLoading = isLoadingForm || isLoadingResponse;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-w-7xl min-h-screen bg-white dark:bg-gray-900">
        <CircularProgress size="lg" />
      </div>
    );
  }

  if (!form || !selectedResponse) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Response not found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The response you're looking for doesn't exist or has been deleted.
          </p>
          <Button color="primary" onPress={() => navigate(-1)}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 bg-white dark:bg-gray-900 min-h-screen">
      {/* Sticky Save Button Bar - Visible when scrolling */}
      {hasUnsavedChanges && isQuizForm && (
        <div className="sticky top-0 z-50 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-b-4 border-orange-400 dark:border-orange-600 shadow-lg mb-6 -mx-4 px-4 py-4 animate-in slide-in-from-top duration-300">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse shadow-lg"></div>
              <div>
                <span className="text-base font-bold text-orange-900 dark:text-orange-200 block">
                  You have unsaved changes
                </span>
                <span className="text-xs text-orange-700 dark:text-orange-300">
                  {Object.keys(pendingScores).length} question(s) modified
                </span>
              </div>
            </div>
            <Button
              color="success"
              variant="solid"
              size="lg"
              onPress={handleSaveAllScores}
              startContent={
                isSavingScores ? undefined : <FiSave className="text-lg" />
              }
              isLoading={isSavingScores}
              isDisabled={isSavingScores}
              className="font-bold text-base px-8 shadow-lg"
            >
              {isSavingScores ? "Saving..." : "Save All Scores"}
            </Button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button
              isIconOnly
              variant="light"
              onPress={() => navigate(-1)}
              startContent={<FiArrowLeft />}
              className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <FiArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Response Summary
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Detailed view of response data and scores
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Navigation Controls - Show when multiple responses */}
            {responseIds.length > 1 && (
              <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-800">
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                  Response:
                </span>
                <Chip size="sm" variant="flat" color="primary">
                  {currentResponseIndex + 1} / {responseIds.length}
                </Chip>
                <Button
                  isIconOnly
                  size="sm"
                  variant="flat"
                  color="primary"
                  onPress={() => handleNavigateResponse("prev")}
                  isDisabled={!canGoPrev}
                >
                  <FiChevronLeft size={20} />
                </Button>
                <Button
                  isIconOnly
                  size="sm"
                  variant="flat"
                  color="primary"
                  onPress={() => handleNavigateResponse("next")}
                  isDisabled={!canGoNext}
                >
                  <FiChevronRight size={20} />
                </Button>
              </div>
            )}

            {/* Save Button */}
            {hasUnsavedChanges && isQuizForm && (
              <Button
                color="success"
                variant="flat"
                size="md"
                onPress={handleSaveAllScores}
                startContent={isSavingScores ? undefined : <FiSave />}
                isLoading={isSavingScores}
                isDisabled={isSavingScores}
              >
                {isSavingScores ? "Saving..." : "Save All Scores"}
              </Button>
            )}

            {/* Return to Respondent Button */}
            {selectedResponse && (
              <Button
                color="warning"
                variant="solid"
                size="md"
                onPress={onReturnModalOpen}
                startContent={<FiSend />}
                className="font-medium"
              >
                Return to Respondent
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/* Respondent Information Card */}
        {computedData && (
          <RespondentInfoCard
            displayName={computedData.displayName}
            email={computedData.email}
            totalScore={computedData.totalScore}
            maxTotalScore={computedData.maxTotalScore}
            submittedDate={computedData.submittedDate}
            completionStatus={selectedResponse.completionStatus || ""}
            scoringMethod={selectedResponse.scoringMethod}
            isQuizForm={isQuizForm}
            getStatusColor={getStatusColor}
          />
        )}

        {/* Warning: Response Cannot Be Scored */}
        {isQuizForm && !isScoreable && (
          <Card className="shadow-sm border-l-4 border-l-amber-500 dark:border-l-amber-400 bg-amber-50 dark:bg-amber-900/20">
            <div className="p-4 flex items-start gap-3">
              <div className="text-amber-600 dark:text-amber-400 mt-0.5">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                  Cannot Score This Response
                </h3>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  This response cannot be scored because one or more required
                  questions are not configured with a point value. Please update
                  at solution tab to add point values before attempting to score
                  this form response.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Question Responses */}
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 p-5 rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-sm">
            <h5 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500 dark:bg-blue-600 flex items-center justify-center shadow-md">
                <span className="text-white text-lg">📋</span>
              </div>
              Question Responses
            </h5>
            <Chip
              size="lg"
              variant="flat"
              color="primary"
              className="font-bold text-base px-4"
            >
              {responseItems.length} questions
            </Chip>
          </div>

          <div className="space-y-6">
            {responseItems.map(
              ({ id, response: resp, question, isAutoScore }) => (
                <ResponseItem
                  key={id}
                  response={resp}
                  question={question}
                  isAutoScore={isAutoScore ?? false}
                  isQuizForm={isQuizForm}
                  allQuestions={selectedResponse.responseset.map(
                    (i) => i.question
                  )}
                  onScoreUpdate={handleQuestionScoreUpdate}
                  responseId={selectedResponse._id}
                />
              )
            )}
          </div>
        </div>
      </div>

      {/* Return to Respondent Modal */}
      <ReturnResponseModal
        isOpen={isReturnModalOpen}
        onClose={onReturnModalClose}
        onSubmit={handleReturnResponse}
        isLoading={isReturningResponse}
        respondentEmail={computedData?.email}
        currentScore={computedData?.totalScore}
        maxScore={computedData?.maxTotalScore}
        isQuizForm={isQuizForm}
        returnReason={returnReason}
        setReturnReason={setReturnReason}
        returnFeedback={returnFeedback}
        setReturnFeedback={setReturnFeedback}
        returnAdditionalInfo={returnAdditionalInfo}
        setReturnAdditionalInfo={setReturnAdditionalInfo}
        includeQuestionsAndResponses={includeQuestionsAndResponses}
        setIncludeQuestionsAndResponses={setIncludeQuestionsAndResponses}
      />
    </div>
  );
};

export default ViewResponsePage;
