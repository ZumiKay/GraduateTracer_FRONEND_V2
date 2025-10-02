import React, { useState, useMemo, memo, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Input,
  Select,
  SelectItem,
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Chip,
  Pagination,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Tooltip,
  Spinner,
  SharedSelection,
} from "@heroui/react";
import {
  FiMail,
  FiLink,
  FiDownload,
  FiEye,
  FiEdit3,
  FiBarChart,
} from "react-icons/fi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ApiRequest from "../../hooks/ApiHook";
import {
  FormDataType,
  FormTypeEnum,
  ContentType,
  QuestionType,
  AnswerKey,
} from "../../types/Form.types";
import SuccessToast, { ErrorToast } from "../Modal/AlertModal";

interface ResponseSetType {
  questionId: string;
  response: string | number | boolean | string[] | number[];
  score?: number;
  isManuallyScored?: boolean;
}

interface ResponseData {
  _id: string;
  formId: string;
  userId?: string;
  guest?: {
    email: string;
    name?: string;
  };
  respondentEmail?: string;
  respondentName?: string;
  totalScore?: number;
  completionStatus?: "completed" | "partial" | "abandoned";
  submittedAt?: Date;
  isManuallyScored?: boolean;
  responseset: ResponseSetType[];
  isCompleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ResponseDashboardProps {
  formId: string;
  form: FormDataType;
}

interface FormLinkResponse {
  link?: string;
  url?: string;
}

const errorToastId = "uniqueResponseErrorId";

const ResponseDashboard: React.FC<ResponseDashboardProps> = ({
  formId,
  form,
}) => {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"all" | "manual-score">("all");
  const [filters, setFilters] = useState({
    status: "",
    dateRange: "",
    searchTerm: "",
  });
  const [selectedResponse, setSelectedResponse] = useState<ResponseData | null>(
    null
  );
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailList, setEmailList] = useState("");
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");
  const [manualScores, setManualScores] = useState<Record<string, number>>({});

  const {
    isOpen: isViewOpen,
    onOpen: onViewOpen,
    onClose: onViewClose,
  } = useDisclosure();
  const {
    isOpen: isScoreOpen,
    onOpen: onScoreOpen,
    onClose: onScoreClose,
  } = useDisclosure();
  const {
    isOpen: isManualScoreOpen,
    onOpen: onManualScoreOpen,
    onClose: onManualScoreClose,
  } = useDisclosure();

  const {
    data: responses = [],
    error,
    isLoading,
  } = useQuery({
    queryKey: ["responses", formId, currentPage],
    queryFn: async () => {
      if (!formId) {
        throw new Error("No formId provided");
      }

      const params = new URLSearchParams({
        id: formId,
        p: currentPage.toString(),
        lt: "10",
      });

      const result = await ApiRequest({
        url: `/getresponsebyform?${params}`,
        method: "GET",
        cookie: true,
        refreshtoken: true,
        reactQuery: true,
      });

      return result.data as ResponseData[];
    },
    enabled: !!formId,
    staleTime: 30000, // 30 seconds
    retry: (failureCount) => {
      if (failureCount >= 3) return false;
      return true;
    },
  });

  const totalPages = useMemo(() => {
    return responses.length < 10 ? currentPage : currentPage + 1;
  }, [responses.length, currentPage]);

  const filteredResponses = useMemo(() => {
    let filtered = responses;

    // Filter by search term
    if (filters.searchTerm) {
      filtered = filtered.filter(
        (response) =>
          (response.respondentName &&
            response.respondentName
              .toLowerCase()
              .includes(filters.searchTerm.toLowerCase())) ||
          (response.respondentEmail &&
            response.respondentEmail
              .toLowerCase()
              .includes(filters.searchTerm.toLowerCase())) ||
          (response.guest?.name &&
            response.guest.name
              .toLowerCase()
              .includes(filters.searchTerm.toLowerCase())) ||
          (response.guest?.email &&
            response.guest.email
              .toLowerCase()
              .includes(filters.searchTerm.toLowerCase()))
      );
    }

    // Filter by  status
    if (filters.status) {
      filtered = filtered.filter(
        (response) => response.completionStatus === filters.status
      );
    }

    // Filter by date range
    if (filters.dateRange) {
      const now = new Date();

      switch (filters.dateRange) {
        case "today": {
          filtered = filtered.filter((response) => {
            if (!response.submittedAt) return false;
            const respDate = new Date(response.submittedAt);
            return respDate.toDateString() === now.toDateString();
          });
          break;
        }
        case "week": {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter((response) => {
            if (!response.submittedAt) return false;
            return new Date(response.submittedAt) >= weekAgo;
          });
          break;
        }
        case "month": {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter((response) => {
            if (!response.submittedAt) return false;
            return new Date(response.submittedAt) >= monthAgo;
          });
          break;
        }
      }
    }

    return filtered;
  }, [responses, filters]);

  if (error) {
    ErrorToast({
      toastid: errorToastId,
      title: "Error",
      content: (error as Error).message || "Failed to fetch responses",
    });
  }

  // Send form links via email
  const sendFormLinks = () => {
    if (!emailList.trim()) return;

    if (!formId) {
      ErrorToast({
        title: "Error",
        content: "Form ID is required to send links",
      });
      return;
    }

    const emails = emailList
      .split(",")
      .map((email) => email.trim())
      .filter((email) => email);

    if (emails.length === 0) {
      ErrorToast({
        title: "Error",
        content: "Please enter at least one valid email address",
      });
      return;
    }

    const message = `You have been invited to complete the survey: ${form.title}`;
    sendLinksMutation.mutate({ emails, message });
  };

  const generateFormLink = () => {
    if (!formId) {
      ErrorToast({
        title: "Error",
        content: "Form ID is required to generate link",
      });
      return;
    }

    generateLinkMutation.mutate();
  };

  const updateScoreMutation = useMutation({
    mutationFn: async ({
      responseId,
      newScore,
    }: {
      responseId: string;
      newScore: number;
    }) => {
      const result = await ApiRequest({
        method: "PUT",
        url: `/response/update-score`,
        data: {
          responseId,
          score: newScore,
        },
        cookie: true,
        reactQuery: true,
      });
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["responses", formId] });
      onScoreClose();
      SuccessToast({
        title: "Success",
        content: "Response score updated successfully!",
      });
    },
    onError: (error: Error) => {
      ErrorToast({
        title: "Error",
        content: error.message || "Failed to update response score",
        toastid: errorToastId,
      });
    },
  });

  const updateQuestionScoreMutation = useMutation({
    mutationFn: async ({
      responseId,
      questionId,
      score,
    }: {
      responseId: string;
      questionId: string;
      score: number;
    }) => {
      const result = await ApiRequest({
        method: "PUT",
        url: `/response/update-question-score`,
        data: {
          responseId,
          questionId,
          score,
        },
        cookie: true,
        reactQuery: true,
      });
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["responses", formId] });
      SuccessToast({
        title: "Success",
        content: "Question score updated successfully!",
      });
    },
    onError: (error: Error) => {
      ErrorToast({
        title: "Error",
        content: error.message || "Failed to update question score",
        toastid: errorToastId,
      });
    },
  });

  const sendLinksMutation = useMutation({
    mutationFn: async ({
      emails,
      message,
    }: {
      emails: string[];
      message: string;
    }) => {
      const result = await ApiRequest({
        url: "/response/send-links",
        method: "POST",
        cookie: true,
        data: {
          formId,
          emails,
          message,
        },
        reactQuery: true,
      });
      return result.data;
    },
    onSuccess: () => {
      setEmailModalOpen(false);
      setEmailList("");
      SuccessToast({
        title: "Success",
        content: "Form links sent successfully!",
      });
    },
    onError: (error: Error) => {
      ErrorToast({
        title: "Error",
        content: error.message || "Failed to send form links",
      });
    },
  });

  const generateLinkMutation = useMutation({
    mutationFn: async () => {
      const result = await ApiRequest({
        url: "/response/generate-link",
        method: "POST",
        cookie: true,
        data: { formId, secure: true },
        reactQuery: true,
      });
      return result.data as FormLinkResponse;
    },
    onSuccess: (data) => {
      const link = data.link || data.url || (data as unknown as string);
      setGeneratedLink(link);
      setLinkModalOpen(true);
      SuccessToast({
        title: "Success",
        content: "Form link generated successfully!",
      });
    },
    onError: (error: Error) => {
      ErrorToast({
        title: "Error",
        content: error.message || "Failed to generate form link",
      });
    },
  });

  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(generatedLink);
    SuccessToast({ title: "Success", content: "Link copied to clipboard!" });
  }, [generatedLink]);

  // Format date
  const formatDate = useCallback((date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  // Get status color
  const getStatusColor = useCallback(
    (status: string): "success" | "warning" | "danger" | "default" => {
      switch (status) {
        case "completed":
          return "success";
        case "partial":
          return "warning";
        case "abandoned":
          return "danger";
        default:
          return "default";
      }
    },
    []
  );

  // Filter handlers
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFilters((prev) => ({ ...prev, searchTerm: e.target.value }));
    },
    []
  );

  const handleStatusChange = useCallback((keys: SharedSelection) => {
    const selected = Array.from(keys)[0] as string;
    setFilters((prev) => ({ ...prev, status: selected || "" }));
  }, []);

  const handleDateRangeChange = useCallback((keys: SharedSelection) => {
    const selected = Array.from(keys)[0] as string;
    setFilters((prev) => ({ ...prev, dateRange: selected || "" }));
  }, []);

  const isQuizForm = useMemo(() => {
    return form.type === FormTypeEnum.Quiz;
  }, [form.type]);

  // Get auto-scoreable question types
  const isAutoScoreable = useCallback((questionType: QuestionType) => {
    const notAutoScoreQuestion = [
      QuestionType.ShortAnswer,
      QuestionType.Paragraph,
      QuestionType.Text,
    ];
    return notAutoScoreQuestion.includes(questionType);
  }, []);

  // Get question details by ID
  const getQuestionById = useCallback(
    (questionId: string) => {
      return form.contents?.find((q: ContentType) => q._id === questionId);
    },
    [form.contents]
  );

  // Extract question text from title
  const getQuestionText = useCallback((question: ContentType) => {
    if (!question.title) return "Untitled Question";

    if (typeof question.title === "string") {
      return question.title;
    }

    // Handle JSONContent structure
    const content = question.title as {
      content?: Array<{ content?: Array<{ text?: string }> }>;
    };
    if (content?.content?.[0]?.content?.[0]?.text) {
      return content.content[0].content[0].text;
    }

    return "Question text";
  }, []);

  // Handle manual score update for individual questions
  const handleManualScoreUpdate = useCallback(
    (responseId: string, questionId: string, score: number) => {
      setManualScores((prev) => ({
        ...prev,
        [`${responseId}-${questionId}`]: score,
      }));

      updateQuestionScoreMutation.mutate({
        responseId,
        questionId,
        score,
      });
    },
    [updateQuestionScoreMutation]
  );

  // Modal handlers
  const handleOpenEmailModal = useCallback(() => setEmailModalOpen(true), []);
  const handleCloseEmailModal = useCallback(() => setEmailModalOpen(false), []);
  const handleCloseLinkModal = useCallback(() => setLinkModalOpen(false), []);
  const handleOpenAnalytics = useCallback(
    () => window.open(`/analytics/${formId}`, "_blank"),
    [formId]
  );

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">Response Management</h2>
          <Select
            label="View Mode"
            placeholder="Select view mode"
            selectedKeys={[viewMode]}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0] as "all" | "manual-score";
              setViewMode(selected);
            }}
            className="w-48"
          >
            <SelectItem key="all">All Responses</SelectItem>
            <SelectItem key="manual-score">Manually Score</SelectItem>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button
            color="primary"
            startContent={<FiMail />}
            onPress={handleOpenEmailModal}
          >
            Send Links
          </Button>
          <Button
            color="secondary"
            startContent={
              generateLinkMutation.isPending ? (
                <Spinner size="sm" />
              ) : (
                <FiLink />
              )
            }
            onPress={generateFormLink}
            isLoading={generateLinkMutation.isPending}
            disabled={generateLinkMutation.isPending}
          >
            {generateLinkMutation.isPending ? "Generating..." : "Generate Link"}
          </Button>
          <Button
            color="success"
            startContent={<FiBarChart />}
            onPress={handleOpenAnalytics}
          >
            Analytics
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Filters</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Search by name or email..."
              value={filters.searchTerm}
              onChange={handleSearchChange}
              isClearable
            />
            <Select
              placeholder="Completion Status"
              selectedKeys={filters.status ? [filters.status] : []}
              onSelectionChange={handleStatusChange}
            >
              <SelectItem key="completed">Completed</SelectItem>
              <SelectItem key="partial">Partial</SelectItem>
              <SelectItem key="abandoned">Abandoned</SelectItem>
            </Select>
            <Select
              placeholder="Date Range"
              selectedKeys={filters.dateRange ? [filters.dateRange] : []}
              onSelectionChange={handleDateRangeChange}
            >
              <SelectItem key="today">Today</SelectItem>
              <SelectItem key="week">This Week</SelectItem>
              <SelectItem key="month">This Month</SelectItem>
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Responses Table */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">
            {viewMode === "all"
              ? `Responses (${responses.length})`
              : "Manual Scoring"}
          </h3>
        </CardHeader>
        <CardBody>
          {viewMode === "all" ? (
            <Table aria-label="Responses table">
              <TableHeader>
                <TableColumn>RESPONDENT</TableColumn>
                <TableColumn>EMAIL</TableColumn>
                <TableColumn className={isQuizForm ? "" : "hidden"}>
                  SCORE
                </TableColumn>
                <TableColumn>STATUS</TableColumn>
                <TableColumn>SUBMITTED</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody
                items={filteredResponses}
                loadingContent={<Spinner size="lg" />}
                isLoading={isLoading}
                emptyContent={
                  <div className="text-center py-8">
                    <p className="text-gray-500">No responses found</p>
                  </div>
                }
              >
                {(response: ResponseData) => (
                  <TableRow key={response._id}>
                    <TableCell>
                      {response.respondentName ||
                        response.guest?.name ||
                        "Anonymous"}
                    </TableCell>
                    <TableCell>
                      {response.respondentEmail ||
                        response.guest?.email ||
                        "N/A"}
                    </TableCell>
                    <TableCell className={isQuizForm ? "" : "hidden"}>
                      <div className="flex items-center gap-2">
                        <span>{response.totalScore || 0}</span>
                        {response.isManuallyScored && (
                          <Chip size="sm" color="warning">
                            Manual
                          </Chip>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        color={getStatusColor(
                          response.completionStatus || "default"
                        )}
                        variant="flat"
                      >
                        {response.completionStatus || "Unknown"}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      {response.submittedAt
                        ? formatDate(response.submittedAt)
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Tooltip content="View Response">
                          <Button
                            size="sm"
                            variant="light"
                            isIconOnly
                            onClick={() => {
                              setSelectedResponse(response);
                              onViewOpen();
                            }}
                          >
                            <FiEye />
                          </Button>
                        </Tooltip>
                        {isQuizForm && (
                          <Tooltip content="Edit Overall Score">
                            <Button
                              size="sm"
                              variant="light"
                              isIconOnly
                              onClick={() => {
                                setSelectedResponse(response);
                                onScoreOpen();
                              }}
                            >
                              <FiEdit3 />
                            </Button>
                          </Tooltip>
                        )}
                        <Tooltip content="Export PDF">
                          <Button
                            size="sm"
                            variant="light"
                            isIconOnly
                            onClick={() => {
                              // TODO: Implement PDF export
                              alert("PDF export coming soon!");
                            }}
                          >
                            <FiDownload />
                          </Button>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          ) : (
            // Manual Scoring View
            <div className="space-y-4">
              {filteredResponses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    No responses available for manual scoring
                  </p>
                </div>
              ) : (
                filteredResponses.map((response: ResponseData) => (
                  <Card key={response._id} className="p-4">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h4 className="font-semibold">
                          {response.respondentName ||
                            response.guest?.name ||
                            "Anonymous"}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {response.respondentEmail ||
                            response.guest?.email ||
                            "N/A"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          Total Score: {response.totalScore || 0}
                        </span>
                        <Button
                          size="sm"
                          color="primary"
                          onClick={() => {
                            setSelectedResponse(response);
                            onManualScoreOpen();
                          }}
                        >
                          Score Questions
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {response.responseset.map(
                        (resp: ResponseSetType, index: number) => {
                          const question = getQuestionById(
                            resp.questionId || ""
                          );
                          const isAutoScore = question
                            ? isAutoScoreable(question.type)
                            : false;

                          return (
                            <div
                              key={index}
                              className="p-3 bg-gray-50 rounded-lg"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-medium text-gray-500">
                                  Question {index + 1}
                                </span>
                                {isAutoScore && (
                                  <Chip
                                    size="sm"
                                    color="success"
                                    variant="flat"
                                  >
                                    Auto
                                  </Chip>
                                )}
                              </div>
                              <div className="text-sm mb-2">
                                {String(resp.response)}
                              </div>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  size="sm"
                                  placeholder="Score"
                                  value={
                                    manualScores[
                                      `${response._id}-${resp.questionId}`
                                    ]?.toString() ||
                                    resp.score?.toString() ||
                                    ""
                                  }
                                  onChange={(e) => {
                                    const score = parseInt(e.target.value) || 0;
                                    handleManualScoreUpdate(
                                      response._id,
                                      resp.questionId || "",
                                      score
                                    );
                                  }}
                                  className="w-20"
                                  disabled={isAutoScore}
                                />
                                <span className="text-xs text-gray-500">
                                  /{question?.score || 0}
                                </span>
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}

          {viewMode === "all" && totalPages > 1 && (
            <div className="flex justify-center mt-4">
              <Pagination
                total={totalPages}
                page={currentPage}
                onChange={setCurrentPage}
                showControls
              />
            </div>
          )}
        </CardBody>
      </Card>

      {/* Email Modal */}
      <Modal isOpen={emailModalOpen} onClose={handleCloseEmailModal}>
        <ModalContent>
          <ModalHeader>Send Form Links</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Email Addresses (comma-separated)
                </label>
                <textarea
                  className="w-full p-2 border rounded-md h-24"
                  placeholder="email1@example.com, email2@example.com"
                  value={emailList}
                  onChange={(e) => setEmailList(e.target.value)}
                />
              </div>
              <div className="text-sm text-gray-600">Form: {form.title}</div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onClick={handleCloseEmailModal}>
              Cancel
            </Button>
            <Button
              color="primary"
              onClick={sendFormLinks}
              isLoading={sendLinksMutation.isPending}
              disabled={sendLinksMutation.isPending}
            >
              {sendLinksMutation.isPending ? (
                <Spinner size="sm" />
              ) : (
                "Send Links"
              )}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Link Generation Modal */}
      <Modal isOpen={linkModalOpen} onClose={handleCloseLinkModal}>
        <ModalContent>
          <ModalHeader>Generated Form Link</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Shareable Link
                </label>
                <div className="flex gap-2">
                  <Input value={generatedLink} readOnly className="flex-1" />
                  <Button onClick={copyLink}>Copy</Button>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                This link can be shared with anyone to access the form.
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button onClick={handleCloseLinkModal}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* View Response Modal */}
      <Modal isOpen={isViewOpen} onClose={onViewClose} size="4xl">
        <ModalContent>
          <ModalHeader>Response Summary</ModalHeader>
          <ModalBody>
            {selectedResponse && (
              <div className="space-y-6">
                {/* Respondent Info Card */}
                <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-lg">
                        {selectedResponse.respondentName ||
                          selectedResponse.guest?.name ||
                          "Anonymous"}
                      </h4>
                      <p className="text-gray-600">
                        {selectedResponse.respondentEmail ||
                          selectedResponse.guest?.email ||
                          "No email provided"}
                      </p>
                    </div>
                    <div className="text-right">
                      {isQuizForm && (
                        <div className="text-2xl font-bold text-blue-600">
                          {selectedResponse.totalScore || 0} points
                        </div>
                      )}
                      <div className="flex justify-end gap-2 mt-2">
                        <Chip
                          size="sm"
                          color={getStatusColor(
                            selectedResponse.completionStatus || "default"
                          )}
                          variant="flat"
                        >
                          {selectedResponse.completionStatus || "Unknown"}
                        </Chip>
                        {selectedResponse.isManuallyScored && (
                          <Chip size="sm" color="warning" variant="flat">
                            Manually Scored
                          </Chip>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-gray-600">
                    <strong>Submitted:</strong>{" "}
                    {selectedResponse.submittedAt
                      ? formatDate(selectedResponse.submittedAt)
                      : "Not yet submitted"}
                  </div>
                </Card>

                {/* Responses */}
                <div>
                  <h5 className="font-semibold mb-4 text-lg">
                    Question Responses
                  </h5>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {selectedResponse.responseset.map(
                      (resp: ResponseSetType, index: number) => {
                        const question = getQuestionById(resp.questionId || "");
                        const isAutoScore = question
                          ? isAutoScoreable(question.type)
                          : false;

                        return (
                          <Card key={index} className="p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-medium">
                                    Question {index + 1}
                                  </span>
                                  <Chip
                                    size="sm"
                                    color="primary"
                                    variant="flat"
                                  >
                                    {question?.type || "Unknown"}
                                  </Chip>
                                  {isQuizForm && (
                                    <Chip
                                      size="sm"
                                      color={
                                        isAutoScore ? "success" : "warning"
                                      }
                                      variant="flat"
                                    >
                                      {isAutoScore ? "Auto-Scored" : "Manual"}
                                    </Chip>
                                  )}
                                </div>

                                {question?.title && (
                                  <div className="text-sm mb-2 text-gray-700">
                                    <strong>Q:</strong>{" "}
                                    {getQuestionText(question)}
                                  </div>
                                )}

                                <div className="p-3 bg-gray-50 rounded-lg">
                                  <strong>Answer:</strong>{" "}
                                  {String(resp.response)}
                                </div>

                                {question?.answer && isQuizForm && (
                                  <div className="text-sm text-green-600 mt-2">
                                    <strong>Correct:</strong>{" "}
                                    {String(question.answer as AnswerKey)}
                                  </div>
                                )}
                              </div>

                              {isQuizForm && (
                                <div className="ml-4 text-right">
                                  <div className="text-lg font-semibold">
                                    {resp.score || 0} / {question?.score || 0}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    points
                                  </div>
                                </div>
                              )}
                            </div>
                          </Card>
                        );
                      }
                    )}
                  </div>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onClick={onViewClose}>
              Close
            </Button>
            {isQuizForm && selectedResponse && (
              <Button
                color="primary"
                onClick={() => {
                  onViewClose();
                  setSelectedResponse(selectedResponse);
                  onScoreOpen();
                }}
              >
                Edit Overall Score
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Score Edit Modal */}
      <Modal isOpen={isScoreOpen} onClose={onScoreClose}>
        <ModalContent>
          <ModalHeader>Edit Overall Score</ModalHeader>
          <ModalBody>
            {selectedResponse && (
              <div className="space-y-4">
                <div>
                  <strong>Respondent:</strong>{" "}
                  {selectedResponse.respondentName || "Anonymous"}
                </div>
                <div>
                  <strong>Current Score:</strong>{" "}
                  {selectedResponse.totalScore || 0}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    New Overall Score
                  </label>
                  <Input
                    type="number"
                    placeholder="Enter new score"
                    defaultValue={(selectedResponse.totalScore || 0).toString()}
                    onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
                      if (e.key === "Enter") {
                        const newScore = parseInt(
                          (e.target as HTMLInputElement).value
                        );
                        updateScoreMutation.mutate({
                          responseId: selectedResponse._id,
                          newScore,
                        });
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onClick={onScoreClose}>
              Cancel
            </Button>
            <Button
              color="primary"
              isLoading={updateScoreMutation.isPending}
              disabled={updateScoreMutation.isPending}
              onClick={() => {
                const input = document.querySelector(
                  'input[type="number"]'
                ) as HTMLInputElement;
                if (input && selectedResponse) {
                  const newScore = parseInt(input.value);
                  updateScoreMutation.mutate({
                    responseId: selectedResponse._id,
                    newScore,
                  });
                }
              }}
            >
              {updateScoreMutation.isPending ? (
                <Spinner size="sm" />
              ) : (
                "Update Score"
              )}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Manual Scoring Modal */}
      <Modal isOpen={isManualScoreOpen} onClose={onManualScoreClose} size="4xl">
        <ModalContent>
          <ModalHeader>Manual Scoring - Question by Question</ModalHeader>
          <ModalBody>
            {selectedResponse && (
              <div className="space-y-6">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-semibold">
                      {selectedResponse.respondentName ||
                        selectedResponse.guest?.name ||
                        "Anonymous"}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {selectedResponse.respondentEmail ||
                        selectedResponse.guest?.email ||
                        "N/A"}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      Total: {selectedResponse.totalScore || 0} points
                    </div>
                    <div className="text-sm text-gray-600">
                      {selectedResponse.isManuallyScored
                        ? "Manually Scored"
                        : "Auto Scored"}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {selectedResponse.responseset.map(
                    (resp: ResponseSetType, index: number) => {
                      const question = getQuestionById(resp.questionId || "");
                      const isAutoScore = question
                        ? isAutoScoreable(question.type)
                        : false;
                      const maxScore = question?.score || 0;

                      return (
                        <Card key={index} className="p-4">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-medium">
                                    Question {index + 1}
                                  </span>
                                  <Chip
                                    size="sm"
                                    color={isAutoScore ? "success" : "warning"}
                                    variant="flat"
                                  >
                                    {isAutoScore
                                      ? "Auto-Scored"
                                      : "Manual Required"}
                                  </Chip>
                                  <span className="text-sm text-gray-500">
                                    Type: {question?.type || "Unknown"}
                                  </span>
                                </div>

                                {question?.title && (
                                  <div className="text-sm mb-2 p-2 bg-blue-50 rounded">
                                    <strong>Question:</strong>{" "}
                                    {getQuestionText(question)}
                                  </div>
                                )}

                                <div className="p-2 bg-gray-50 rounded">
                                  <strong>Response:</strong>{" "}
                                  {String(resp.response)}
                                </div>

                                {question?.answer && (
                                  <div className="text-sm text-green-600 mt-1">
                                    <strong>Correct Answer:</strong>{" "}
                                    {String(question.answer as AnswerKey)}
                                  </div>
                                )}
                              </div>

                              <div className="ml-4 min-w-0">
                                <div className="text-right mb-2">
                                  <span className="text-sm text-gray-500">
                                    Score
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    size="sm"
                                    placeholder="0"
                                    value={
                                      manualScores[
                                        `${selectedResponse._id}-${resp.questionId}`
                                      ]?.toString() ||
                                      resp.score?.toString() ||
                                      "0"
                                    }
                                    onChange={(e) => {
                                      const score = Math.min(
                                        parseInt(e.target.value) || 0,
                                        maxScore
                                      );
                                      handleManualScoreUpdate(
                                        selectedResponse._id,
                                        resp.questionId || "",
                                        score
                                      );
                                    }}
                                    className="w-20"
                                    min="0"
                                    max={maxScore}
                                    disabled={isAutoScore}
                                  />
                                  <span className="text-sm text-gray-500">
                                    / {maxScore}
                                  </span>
                                </div>
                                {isAutoScore && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    Auto-calculated
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    }
                  )}
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onClick={onManualScoreClose}>
              Close
            </Button>
            <Button
              color="primary"
              onClick={() => {
                onManualScoreClose();
                SuccessToast({
                  title: "Success",
                  content: "Manual scoring completed!",
                });
              }}
            >
              Save & Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

ResponseDashboard.displayName = "ResponseDashboard";

export default memo(ResponseDashboard);
