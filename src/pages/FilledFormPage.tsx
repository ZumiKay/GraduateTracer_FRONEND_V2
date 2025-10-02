import React, { useCallback, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  Spinner,
  Alert,
  Select,
  SelectItem,
} from "@heroui/react";
import {
  FiArrowLeft,
  FiChevronLeft,
  FiChevronRight,
  FiAward,
  FiClock,
  FiUser,
} from "react-icons/fi";
import { useQuery } from "@tanstack/react-query";
import { createQueryFn } from "../hooks/ApiHook";
import { FormDataType, FormTypeEnum } from "../types/Form.types";
import {
  ResponseCompletionStatus,
  ResponseDataType,
  ResponseSetType,
} from "../component/Response/Response.type";
import { ErrorToast } from "../component/Modal/AlertModal";
import StyledTiptap from "../component/Response/components/StyledTiptap";
import { FormatDate } from "../helperFunc";

interface FilledFormParams extends Record<string, string | undefined> {
  formId: string;
  responseId?: string;
}

interface FilledFormResponse {
  form: FormDataType;
  response: ResponseDataType;
  userResponses: ResponseDataType[];
}

const FilledFormPage: React.FC = () => {
  const { formId, responseId } = useParams<FilledFormParams>();
  const navigate = useNavigate();
  const [currentResponseIndex, setCurrentResponseIndex] = useState(0);

  // Fetch form and response data
  const {
    data: filledFormData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["filledForm", formId, responseId],
    queryFn: createQueryFn({
      url: `response/filled-form/${formId}${
        responseId ? `/${responseId}` : ""
      }`,
      method: "GET",
      cookie: true,
      refreshtoken: true,
    }),
    enabled: !!formId,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const responseData = useMemo(() => {
    if (
      !filledFormData ||
      typeof filledFormData !== "object" ||
      !("data" in filledFormData)
    )
      return null;
    return (filledFormData as { data: FilledFormResponse }).data;
  }, [filledFormData]);

  const currentResponse = useMemo(() => {
    if (!responseData?.userResponses?.length) return responseData?.response;
    return (
      responseData.userResponses[currentResponseIndex] || responseData.response
    );
  }, [responseData, currentResponseIndex]);

  const formData = responseData?.form;

  // Handle response navigation
  const handleResponseNavigation = useCallback(
    (direction: "prev" | "next") => {
      if (!responseData?.userResponses?.length) return;

      const maxIndex = responseData.userResponses.length - 1;
      setCurrentResponseIndex((prev) => {
        if (direction === "prev") {
          return prev > 0 ? prev - 1 : prev;
        } else {
          return prev < maxIndex ? prev + 1 : prev;
        }
      });
    },
    [responseData?.userResponses?.length]
  );

  const handleResponseSelect = useCallback((responseIndex: string) => {
    setCurrentResponseIndex(parseInt(responseIndex));
  }, []);

  const handleBackToDashboard = useCallback(() => {
    navigate("/dashboard");
  }, [navigate]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" color="primary" />
          <p className="mt-4 text-gray-600">Loading your response...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !responseData) {
    ErrorToast({
      title: "Failed to Load",
      content: "Could not load your form response",
      toastid: "filled-form-error",
    });

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Alert
          color="danger"
          title="Failed to Load Response"
          description="We couldn't load your form response. Please try again."
          endContent={
            <Button color="primary" onPress={handleBackToDashboard}>
              Back to Dashboard
            </Button>
          }
        />
      </div>
    );
  }

  const isQuiz = formData?.type === FormTypeEnum.Quiz;
  const hasMultipleResponses =
    responseData?.userResponses && responseData.userResponses.length > 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="light"
            startContent={<FiArrowLeft />}
            onPress={handleBackToDashboard}
            className="mb-4"
          >
            Back to Dashboard
          </Button>

          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <div className="w-full">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold mb-2">
                      {formData?.title || "Untitled Form"}
                    </h1>
                    <div className="flex items-center gap-2">
                      <Chip
                        color={isQuiz ? "warning" : "success"}
                        variant="flat"
                        size="sm"
                      >
                        {isQuiz ? "Quiz" : "Form"}
                      </Chip>
                      {isQuiz && currentResponse?.totalScore !== undefined && (
                        <Chip
                          color="secondary"
                          variant="flat"
                          size="sm"
                          startContent={<FiAward className="w-3 h-3" />}
                        >
                          Score: {currentResponse.totalScore}/
                          {formData?.totalscore || "?"}
                        </Chip>
                      )}
                    </div>
                  </div>
                </div>

                {/* Response Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <FiUser className="w-4 h-4" />
                    <span>
                      Respondent:{" "}
                      {currentResponse?.respondentName ||
                        currentResponse?.respondentEmail ||
                        "Anonymous"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiClock className="w-4 h-4" />
                    <span>
                      Submitted:{" "}
                      {currentResponse?.submittedAt
                        ? FormatDate(currentResponse?.submittedAt)
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Status: </span>
                    <Chip
                      color={
                        currentResponse?.completionStatus ===
                        ResponseCompletionStatus.completed
                          ? "success"
                          : "warning"
                      }
                      variant="flat"
                      size="sm"
                    >
                      {currentResponse?.completionStatus ?? "None"}
                    </Chip>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Response Navigation */}
        {hasMultipleResponses && (
          <Card className="mb-6 shadow-md">
            <CardBody>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Response Navigation</h3>
                <div className="flex items-center gap-4">
                  <Select
                    label="Select Response"
                    selectedKeys={[currentResponseIndex.toString()]}
                    onSelectionChange={(keys) => {
                      const selectedKey = Array.from(keys)[0] as string;
                      if (selectedKey) handleResponseSelect(selectedKey);
                    }}
                    className="w-48"
                    size="sm"
                  >
                    {responseData.userResponses!.map((resp, index) =>
                      resp.submittedAt ? (
                        <SelectItem key={index.toString()}>
                          Response {index + 1} - {FormatDate(resp.submittedAt)}
                        </SelectItem>
                      ) : null
                    )}
                  </Select>

                  <div className="flex gap-2">
                    <Button
                      isIconOnly
                      variant="light"
                      onPress={() => handleResponseNavigation("prev")}
                      isDisabled={currentResponseIndex === 0}
                    >
                      <FiChevronLeft />
                    </Button>
                    <Button
                      isIconOnly
                      variant="light"
                      onPress={() => handleResponseNavigation("next")}
                      isDisabled={
                        currentResponseIndex ===
                        (responseData.userResponses?.length || 1) - 1
                      }
                    >
                      <FiChevronRight />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-2 text-sm text-gray-600">
                Viewing response {currentResponseIndex + 1} of{" "}
                {responseData.userResponses?.length || 1}
              </div>
            </CardBody>
          </Card>
        )}

        {/* Response Content */}
        <div className="space-y-6">
          {currentResponse?.responseset?.map(
            (responseSet: ResponseSetType, index: number) => (
              <ResponseDisplayCard
                key={`${responseSet._id}-${index}`}
                responseSet={responseSet}
                questionNumber={index + 1}
                isQuiz={isQuiz}
              />
            )
          )}
        </div>

        {/* Summary Card */}
        <Card className="mt-8 shadow-lg">
          <CardHeader>
            <h3 className="text-xl font-semibold">Response Summary</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {currentResponse?.responseset?.length || 0}
                </p>
                <p className="text-sm text-gray-600">Questions Answered</p>
              </div>

              {isQuiz && (
                <>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      {currentResponse?.totalScore || 0}
                    </p>
                    <p className="text-sm text-gray-600">Total Score</p>
                  </div>

                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">
                      {formData?.totalscore || 0}
                    </p>
                    <p className="text-sm text-gray-600">Max Score</p>
                  </div>

                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-600">
                      {currentResponse?.totalScore && formData?.totalscore
                        ? Math.round(
                            (currentResponse.totalScore / formData.totalscore) *
                              100
                          )
                        : 0}
                      %
                    </p>
                    <p className="text-sm text-gray-600">Percentage</p>
                  </div>
                </>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

// Individual Response Display Component
interface ResponseDisplayCardProps {
  responseSet: ResponseSetType;
  questionNumber: number;
  isQuiz: boolean;
}

const ResponseDisplayCard: React.FC<ResponseDisplayCardProps> = ({
  responseSet,
  questionNumber,
  isQuiz,
}) => {
  const renderResponseValue = useCallback((response: unknown) => {
    if (Array.isArray(response)) {
      if (response.length === 0)
        return <span className="text-gray-400 italic">No answer provided</span>;
      return (
        <div className="space-y-1">
          {response.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span>{typeof item === "object" ? item.val : item}</span>
            </div>
          ))}
        </div>
      );
    }

    if (typeof response === "object" && response && "val" in response) {
      return <span>{(response as { val: unknown }).val as string}</span>;
    }

    if (response === null || response === undefined || response === "") {
      return <span className="text-gray-400 italic">No answer provided</span>;
    }

    return <span>{String(response)}</span>;
  }, []);

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start w-full">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Chip color="primary" variant="flat" size="sm">
                Q{questionNumber}
              </Chip>
              {isQuiz && responseSet.score !== undefined && (
                <Chip
                  color={responseSet.score > 0 ? "success" : "danger"}
                  variant="flat"
                  size="sm"
                  startContent={<FiAward className="w-3 h-3" />}
                >
                  {responseSet.score} pts
                </Chip>
              )}
            </div>

            <div className="mb-2">
              <StyledTiptap
                value={responseSet.question?.title || "Question"}
                readonly={true}
                variant="question"
                className="text-lg font-medium text-gray-800"
              />
            </div>
          </div>
        </div>
      </CardHeader>

      <Divider />

      <CardBody className="pt-4">
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Your Answer:
            </p>
            <div className="bg-gray-50 p-3 rounded-lg border-l-4 border-blue-500">
              {renderResponseValue(responseSet.response)}
            </div>
          </div>

          {/* Show correct answer for quiz questions if available */}
          {(() => {
            const answerKey = responseSet.question?.answer;
            const hasCorrectAnswer =
              isQuiz &&
              answerKey &&
              typeof answerKey === "object" &&
              "answer" in answerKey;

            return hasCorrectAnswer ? (
              <div>
                <p className="text-sm font-medium text-green-700 mb-2">
                  Correct Answer:
                </p>
                <div className="bg-green-50 p-3 rounded-lg border-l-4 border-green-500">
                  {renderResponseValue(
                    (answerKey as { answer: unknown }).answer
                  )}
                </div>
              </div>
            ) : null;
          })()}
        </div>
      </CardBody>
    </Card>
  );
};

export default FilledFormPage;
