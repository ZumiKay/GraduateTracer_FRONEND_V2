import React, { useCallback, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
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
  FiCheck,
  FiTrendingUp,
} from "react-icons/fi";
import { useQuery } from "@tanstack/react-query";
import { createQueryFn } from "../hooks/ApiHook";
import { FormDataType, FormTypeEnum, QuestionType } from "../types/Form.types";
import {
  ResponseCompletionStatus,
  ResponseDataType,
  ResponseSetType,
} from "../component/Response/Response.type";
import { ErrorToast } from "../component/Modal/AlertModal";
import StyledTiptap from "../component/Response/components/StyledTiptap";

// Helper function to format dates consistently
const formatDisplayDate = (dateValue: string | Date | undefined): string => {
  if (!dateValue) return "N/A";

  try {
    const date =
      typeof dateValue === "string" ? new Date(dateValue) : dateValue;

    // Check if date is valid
    if (isNaN(date.getTime())) return "N/A";

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "N/A";
  }
};

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
    ) {
      console.log("No filled form data:", filledFormData);
      return null;
    }
    const data = (filledFormData as { data: FilledFormResponse }).data;
    return data;
  }, [filledFormData]);

  const currentResponse = useMemo(() => {
    if (!responseData?.userResponses?.length) return responseData?.response;
    return (
      responseData.userResponses[currentResponseIndex] || responseData.response
    );
  }, [responseData, currentResponseIndex]);

  // Reset to first response when data changes
  React.useEffect(() => {
    if (
      responseData?.userResponses &&
      currentResponseIndex >= responseData.userResponses.length
    ) {
      setCurrentResponseIndex(0);
    }
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          <div className="relative">
            {/* Animated rings */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 border-r-blue-500 w-24 h-24 mx-auto"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 m-2 rounded-full border-4 border-transparent border-b-purple-500 border-l-purple-500 w-20 h-20 mx-auto"
            />

            {/* Center icon */}
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <FiAward className="w-10 h-10 text-blue-600" />
              </motion.div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8"
          >
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
              Loading Your Response
            </h3>
            <div className="flex items-center justify-center gap-1 text-gray-600 dark:text-gray-400">
              <span>Please wait</span>
              <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
              >
                .
              </motion.span>
              <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
              >
                .
              </motion.span>
              <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
              >
                .
              </motion.span>
            </div>
          </motion.div>
        </motion.div>
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="light"
            startContent={<FiArrowLeft />}
            onPress={handleBackToDashboard}
            className="mb-4 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Back to Dashboard
          </Button>

          <Card className="shadow-lg dark:bg-gray-800 dark:border dark:border-gray-700">
            <CardHeader className="text-black dark:text-white dark:bg-gray-800">
              <div className="w-full">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-0 mb-4">
                  <div className="flex-1">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">
                      {formData?.title || "Untitled Form"}
                    </h1>
                    <div className="flex flex-wrap items-center gap-2">
                      <Chip
                        color={isQuiz ? "warning" : "success"}
                        variant="flat"
                        size="sm"
                      >
                        {isQuiz ? "Quiz" : "Form"}
                      </Chip>
                      {isQuiz && currentResponse?.totalScore !== undefined && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{
                            type: "spring",
                            stiffness: 200,
                            damping: 15,
                          }}
                        >
                          <Chip
                            color="secondary"
                            variant="solid"
                            size="lg"
                            startContent={<FiAward className="w-5 h-5" />}
                            className="px-4 py-2 font-bold text-base shadow-lg"
                          >
                            Score: {currentResponse.totalScore}/
                            {formData?.totalscore || "?"}
                          </Chip>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Response Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
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
                    <span className="text-sm">
                      Submitted: {formatDisplayDate(currentResponse?.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Status: </span>
                    <Chip
                      className="text-white"
                      color={
                        currentResponse?.completionStatus ===
                        ResponseCompletionStatus.completed
                          ? "success"
                          : "warning"
                      }
                      variant="solid"
                      size="lg"
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
          <Card className="mb-6 shadow-md dark:bg-gray-800 dark:border dark:border-gray-700">
            <CardBody className="dark:bg-gray-800">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Response Navigation
                </h3>
                <div className="flex items-center gap-2 sm:gap-4">
                  <Select
                    label="Select Response"
                    selectedKeys={[currentResponseIndex.toString()]}
                    onSelectionChange={(keys) => {
                      const selectedKey = Array.from(keys)[0] as string;
                      if (selectedKey) handleResponseSelect(selectedKey);
                    }}
                    className="w-full sm:w-48"
                    size="sm"
                  >
                    {responseData.userResponses!.map((resp, index) => (
                      <SelectItem
                        textValue={`Response ${index + 1}`}
                        key={index.toString()}
                      >
                        Response {index + 1} -{" "}
                        {formatDisplayDate(resp.createdAt)}
                      </SelectItem>
                    ))}
                  </Select>

                  <div className="flex gap-2">
                    <Button
                      isIconOnly
                      variant="light"
                      onPress={() => handleResponseNavigation("prev")}
                      isDisabled={currentResponseIndex === 0}
                      className="dark:text-gray-300 dark:hover:bg-gray-700"
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
                      className="dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <FiChevronRight />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Viewing response {currentResponseIndex + 1} of{" "}
                {responseData.userResponses?.length || 1}
              </div>
            </CardBody>
          </Card>
        )}

        {/* Response Content */}
        <div className="space-y-6">
          {!currentResponse?.responseset ||
          currentResponse.responseset.length === 0 ? (
            <Card className="shadow-md dark:bg-gray-800 dark:border dark:border-gray-700">
              <CardBody className="text-center py-12 dark:bg-gray-800">
                <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">
                  No responses found
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-sm">
                  This form doesn't have any submitted responses yet.
                </p>
              </CardBody>
            </Card>
          ) : (
            currentResponse.responseset.map(
              (responseSet: ResponseSetType, index: number) => (
                <ResponseDisplayCard
                  key={`${currentResponse._id}-${
                    responseSet._id || responseSet.question?._id
                  }-${index}`}
                  responseSet={responseSet}
                  questionNumber={index + 1}
                  isQuiz={isQuiz}
                />
              )
            )
          )}
        </div>

        {/* Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="mt-6 sm:mt-8 shadow-2xl border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-800">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-b dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 dark:bg-blue-600 rounded-lg">
                  <FiTrendingUp className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">
                  Response Summary
                </h3>
              </div>
            </CardHeader>
            <CardBody className="p-6 dark:bg-gray-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: "spring" }}
                  className="text-center p-5 sm:p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl shadow-md hover:shadow-lg transition-shadow border-2 border-blue-200 dark:border-blue-800"
                >
                  <div className="flex justify-center mb-3">
                    <div className="p-3 bg-blue-500 dark:bg-blue-600 rounded-full">
                      <FiCheck className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <motion.p
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                    className="text-3xl sm:text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2"
                  >
                    {currentResponse?.responseset?.length || 0}
                  </motion.p>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Questions Answered
                  </p>
                </motion.div>

                {isQuiz && (
                  <>
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2, type: "spring" }}
                      className="text-center p-5 sm:p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl shadow-md hover:shadow-lg transition-shadow border-2 border-green-200 dark:border-green-800"
                    >
                      <div className="flex justify-center mb-3">
                        <div className="p-3 bg-green-500 dark:bg-green-600 rounded-full">
                          <FiAward className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <motion.p
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          delay: 0.4,
                          type: "spring",
                          stiffness: 200,
                        }}
                        className="text-4xl sm:text-5xl font-bold text-green-600 dark:text-green-400 mb-2"
                      >
                        {currentResponse?.totalScore || 0}
                      </motion.p>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Your Score
                      </p>
                    </motion.div>

                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.3, type: "spring" }}
                      className="text-center p-5 sm:p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl shadow-md hover:shadow-lg transition-shadow border-2 border-purple-200 dark:border-purple-800"
                    >
                      <div className="flex justify-center mb-3">
                        <div className="p-3 bg-purple-500 dark:bg-purple-600 rounded-full">
                          <FiTrendingUp className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <motion.p
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          delay: 0.5,
                          type: "spring",
                          stiffness: 200,
                        }}
                        className="text-4xl sm:text-5xl font-bold text-purple-600 dark:text-purple-400 mb-2"
                      >
                        {formData?.totalscore || 0}
                      </motion.p>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Maximum Score
                      </p>
                    </motion.div>

                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.4, type: "spring" }}
                      className="text-center p-5 sm:p-6 bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-xl shadow-md hover:shadow-lg transition-shadow border-2 border-yellow-200 dark:border-yellow-800"
                    >
                      <div className="flex justify-center mb-3">
                        <motion.div
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            repeatDelay: 3,
                          }}
                          className="p-3 bg-yellow-500 dark:bg-yellow-600 rounded-full"
                        >
                          <FiAward className="w-6 h-6 text-white" />
                        </motion.div>
                      </div>
                      <motion.p
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          delay: 0.6,
                          type: "spring",
                          stiffness: 200,
                        }}
                        className="text-4xl sm:text-5xl font-bold text-yellow-600 dark:text-yellow-400 mb-2"
                      >
                        {currentResponse?.totalScore && formData?.totalscore
                          ? Math.round(
                              (currentResponse.totalScore /
                                formData.totalscore) *
                                100
                            )
                          : 0}
                        %
                      </motion.p>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Success Rate
                      </p>
                    </motion.div>
                  </>
                )}
              </div>
            </CardBody>
          </Card>
        </motion.div>
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

const ResponseDisplayCard: React.FC<ResponseDisplayCardProps> = React.memo(
  ({ responseSet, questionNumber, isQuiz }) => {
    // Determine if answer is correct for quiz questions
    const isCorrectAnswer = useMemo(() => {
      if (!isQuiz || responseSet.score === undefined) return null;
      const maxScore = responseSet.question?.score || 0;
      if (maxScore === 0) return null;
      return responseSet.score >= maxScore;
    }, [isQuiz, responseSet.score, responseSet.question?.score]);
    // Format date in dd/mm/yyyy format
    const formatDate = useCallback((dateValue: string | Date) => {
      const date =
        typeof dateValue === "string" ? new Date(dateValue) : dateValue;
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }, []);

    const renderResponseValue = useCallback(
      (response: unknown, question?: ResponseSetType["question"]) => {
        const questionType = question?.type;

        // Handle empty response
        if (response === null || response === undefined || response === "") {
          return (
            <span className="text-gray-400 dark:text-gray-500 italic">
              No answer provided
            </span>
          );
        }

        // Handle Range Date
        if (questionType === QuestionType.RangeDate) {
          const rangeDate = response as { start: string; end: string };
          if (rangeDate.start && rangeDate.end) {
            return (
              <div className="flex items-center gap-2">
                <Chip size="md" variant="flat" color="primary">
                  Start: {formatDate(rangeDate.start)}
                </Chip>
                <span className="text-gray-500">→</span>
                <Chip size="md" variant="flat" color="primary">
                  End: {formatDate(rangeDate.end)}
                </Chip>
              </div>
            );
          }
        }

        // Handle Range Number
        if (questionType === QuestionType.RangeNumber) {
          const rangeNum = response as { start: number; end: number };
          if (rangeNum.start !== undefined && rangeNum.end !== undefined) {
            return (
              <div className="flex items-center gap-2">
                <Chip size="md" variant="flat" color="primary">
                  Start: {rangeNum.start}
                </Chip>
                <span className="text-gray-500">→</span>
                <Chip size="md" variant="flat" color="primary">
                  End: {rangeNum.end}
                </Chip>
              </div>
            );
          }
        }

        // Handle Date
        if (questionType === QuestionType.Date) {
          return (
            <Chip size="md" variant="flat" color="primary">
              {formatDate(response as string)}
            </Chip>
          );
        }

        // Handle Choice Questions (Multiple Choice, Checkbox, Selection)
        if (
          questionType === QuestionType.MultipleChoice ||
          questionType === QuestionType.CheckBox ||
          questionType === QuestionType.Selection
        ) {
          // Get the choices array based on the question type
          let choices: Array<{ idx: number; content: string }> | undefined;
          if (questionType === QuestionType.MultipleChoice) {
            choices = question?.multiple as
              | Array<{ idx: number; content: string }>
              | undefined;
          } else if (questionType === QuestionType.CheckBox) {
            choices = question?.checkbox as
              | Array<{ idx: number; content: string }>
              | undefined;
          } else if (questionType === QuestionType.Selection) {
            choices = question?.selection as
              | Array<{ idx: number; content: string }>
              | undefined;
          }

          if (!choices || choices.length === 0) {
            return <span>{String(response)}</span>;
          }

          // Response can be either number, number[], or {key: number | number[], val: string | string[]}
          let selectedKeys: number[] = [];

          if (typeof response === "number") {
            selectedKeys = [response];
          } else if (Array.isArray(response)) {
            selectedKeys = response;
          } else if (
            typeof response === "object" &&
            response &&
            "key" in response
          ) {
            const responseObj = response as {
              key: number | number[];
              val: string | string[];
            };
            selectedKeys = Array.isArray(responseObj.key)
              ? responseObj.key
              : [responseObj.key];
          }

          return (
            <div className="space-y-2">
              {choices.map((choice) => {
                const isSelected = selectedKeys.includes(choice.idx);
                return (
                  <div
                    key={choice.idx}
                    className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border-2 transition-all ${
                      isSelected
                        ? "bg-blue-50 dark:bg-blue-900/30 border-blue-500 dark:border-blue-400 shadow-sm"
                        : "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                    }`}
                  >
                    <div
                      className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected
                          ? "bg-blue-500 dark:bg-blue-600 border-blue-500 dark:border-blue-600"
                          : "bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500"
                      }`}
                    >
                      {isSelected && <FiCheck className="w-3 h-3 text-white" />}
                    </div>
                    <span
                      className={`text-sm sm:text-base ${
                        isSelected
                          ? "font-semibold text-blue-900 dark:text-blue-200"
                          : "text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {choice.content}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        }

        // Handle array responses (legacy format)
        if (Array.isArray(response)) {
          if (response.length === 0)
            return (
              <span className="text-gray-400 italic">No answer provided</span>
            );
          return (
            <div className="space-y-1">
              {response.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span>
                    {typeof item === "object" && "val" in item
                      ? String(item.val)
                      : String(item)}
                  </span>
                </div>
              ))}
            </div>
          );
        }

        // Handle object with val property
        if (typeof response === "object" && response && "val" in response) {
          return <span>{String((response as { val: unknown }).val)}</span>;
        }

        // Default: return as string
        return <span>{String(response)}</span>;
      },
      [formatDate]
    );

    return (
      <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 dark:bg-gray-800">
        <CardHeader className="pb-3 bg-white">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start w-full gap-3 sm:gap-0">
            <div className="flex-1">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 flex-wrap">
                <Chip
                  color="primary"
                  variant="solid"
                  size="md"
                  className="font-semibold"
                >
                  Q{questionNumber}
                </Chip>
                {isQuiz && responseSet.score !== undefined && (
                  <>
                    <Chip
                      color={
                        isCorrectAnswer === true
                          ? "success"
                          : isCorrectAnswer === false
                          ? "danger"
                          : "warning"
                      }
                      variant="flat"
                      size="md"
                      startContent={<FiAward className="w-4 h-4" />}
                      className="font-medium"
                    >
                      {responseSet.score}/{responseSet.question?.score || 0} pts
                    </Chip>
                    {isCorrectAnswer !== null && (
                      <Chip
                        color={isCorrectAnswer ? "success" : "danger"}
                        variant="bordered"
                        size="sm"
                        className="font-medium"
                      >
                        {isCorrectAnswer ? "✓ Correct" : "✗ Incorrect"}
                      </Chip>
                    )}
                  </>
                )}
              </div>

              <div className="mb-2">
                <StyledTiptap
                  value={responseSet.question?.title || "Question"}
                  readonly={true}
                  variant="question"
                  className="text-base sm:text-lg font-medium text-white"
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <Divider />

        <CardBody className="pt-4 dark:bg-gray-800">
          <div className="space-y-4">
            <div>
              <p className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 sm:mb-3 uppercase tracking-wide">
                Your Answer:
              </p>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-3 sm:p-4 rounded-xl border-l-4 border-blue-500 dark:border-blue-400 shadow-sm">
                {renderResponseValue(
                  responseSet.response,
                  responseSet.question
                )}
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
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-2 sm:mb-3">
                    <p className="text-xs sm:text-sm font-semibold text-green-800 dark:text-green-300 uppercase tracking-wide">
                      Correct Answer:
                    </p>
                    {responseSet.question?.score !== undefined && (
                      <Chip size="sm" color="default" variant="flat">
                        Worth: {responseSet.question.score} pts
                      </Chip>
                    )}
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-3 sm:p-4 rounded-xl border-l-4 border-green-500 dark:border-green-400 shadow-sm">
                    {renderResponseValue(
                      (answerKey as { answer: unknown }).answer,
                      responseSet.question
                    )}
                  </div>
                </div>
              ) : null;
            })()}

            {/* Show scoring information for manually scored questions */}
            {isQuiz && responseSet.isManuallyScored && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 dark:border-yellow-400 p-3 sm:p-4 rounded-xl">
                <p className="text-xs sm:text-sm font-semibold text-yellow-800 dark:text-yellow-300 flex items-center gap-2">
                  <FiAward className="w-4 h-4" />
                  This question was manually scored by the instructor
                </p>
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    );
  }
);

ResponseDisplayCard.displayName = "ResponseDisplayCard";

export default FilledFormPage;
