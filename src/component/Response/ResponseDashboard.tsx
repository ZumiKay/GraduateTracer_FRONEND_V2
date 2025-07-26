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
import { FormDataType, FormTypeEnum } from "../../types/Form.types";
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

  // Fetch responses using React Query
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
      // Don't retry on certain errors
      if (failureCount >= 3) return false;
      return true;
    },
  });

  // Calculate total pages based on response count
  const totalPages = useMemo(() => {
    return responses.length < 10 ? currentPage : currentPage + 1;
  }, [responses.length, currentPage]);

  // Apply filters to responses using useMemo instead of useEffect
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

    // Filter by completion status
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

  // Handle query errors using React Query's error handling
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

  // Generate form link
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

  // Update response score using React Query mutation
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
      // Invalidate and refetch responses
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

  // Send form links using React Query mutation
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

  // Generate form link using React Query mutation
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

  // Copy link to clipboard
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleStatusChange = useCallback((keys: any) => {
    const selected = Array.from(keys)[0] as string;
    setFilters((prev) => ({ ...prev, status: selected || "" }));
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDateRangeChange = useCallback((keys: any) => {
    const selected = Array.from(keys)[0] as string;
    setFilters((prev) => ({ ...prev, dateRange: selected || "" }));
  }, []);

  // Check if form is quiz type
  const isQuizForm = useMemo(() => {
    return form.type === FormTypeEnum.Quiz;
  }, [form.type]);

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
        <h2 className="text-2xl font-bold">Response Management</h2>
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
            Responses ({responses.length})
          </h3>
        </CardHeader>
        <CardBody>
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
                    {response.respondentEmail || response.guest?.email || "N/A"}
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
                        <Tooltip content="Edit Score">
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

          {totalPages > 1 && (
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
      <Modal isOpen={isViewOpen} onClose={onViewClose} size="2xl">
        <ModalContent>
          <ModalHeader>Response Details</ModalHeader>
          <ModalBody>
            {selectedResponse && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <strong>Respondent:</strong>{" "}
                    {selectedResponse.respondentName || "Anonymous"}
                  </div>
                  <div>
                    <strong>Email:</strong>{" "}
                    {selectedResponse.respondentEmail || "N/A"}
                  </div>
                  {isQuizForm && (
                    <div>
                      <strong>Score:</strong> {selectedResponse.totalScore || 0}
                    </div>
                  )}
                  <div>
                    <strong>Status:</strong>{" "}
                    {selectedResponse.completionStatus || "Unknown"}
                  </div>
                </div>
                <div>
                  <strong>Submitted:</strong>{" "}
                  {selectedResponse.submittedAt
                    ? formatDate(selectedResponse.submittedAt)
                    : "N/A"}
                </div>
                <div>
                  <strong>Responses:</strong>
                  <div className="mt-2 space-y-2">
                    {selectedResponse.responseset.map(
                      (resp: ResponseSetType, index: number) => (
                        <div key={index} className="p-2 bg-gray-50 rounded">
                          <div className="font-medium">
                            Question {index + 1}
                          </div>
                          <div>{String(resp.response)}</div>
                          {isQuizForm && resp.score && (
                            <div className="text-sm text-gray-600">
                              Score: {resp.score}
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={onViewClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Score Edit Modal */}
      <Modal isOpen={isScoreOpen} onClose={onScoreClose}>
        <ModalContent>
          <ModalHeader>Edit Score</ModalHeader>
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
                    New Score
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
    </div>
  );
};

ResponseDashboard.displayName = "ResponseDashboard";

export default memo(ResponseDashboard);
