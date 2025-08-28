import React, { useState, useMemo, memo, useCallback, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Input,
  Select,
  SelectItem,
  Pagination,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Spinner,
  SharedSelection,
} from "@heroui/react";
import { FiMail, FiLink, FiBarChart } from "react-icons/fi";
import { useQuery } from "@tanstack/react-query";
import { FormDataType, FormTypeEnum } from "../../types/Form.types";
import { ErrorToast } from "../Modal/AlertModal";
import { useResponseMutations } from "./hooks/useResponseMutations";
import ResponseTable from "./components/ResponseTable";
import ManualScoringView from "./components/ManualScoringView";
import ViewResponseModal from "./components/ViewResponseModal";
import { ScoreEditModal } from "./components/SimpleModal";
import { ResponseDataType, statusColor } from "./Response.type";
import {
  fetchResponseList,
  fetchResponseDetails,
  ResponseListItem,
} from "../../services/responseService";

interface ResponseDashboardProps {
  formId: string;
  form: FormDataType;
}

const errorToastId = "uniqueResponseErrorId";

const ResponseDashboard: React.FC<ResponseDashboardProps> = ({
  formId,
  form,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"all" | "manual-score">("all");
  const [filters, setFilters] = useState({
    status: "",
    dateRange: "",
    searchTerm: "",
  });
  const [selectedResponse, setSelectedResponse] =
    useState<ResponseListItem | null>(null);
  const [selectedResponseDetails, setSelectedResponseDetails] =
    useState<ResponseDataType | null>(null);
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

  // Custom hooks
  const {
    updateScoreMutation,
    updateQuestionScoreMutation,
    sendLinksMutation,
    generateLinkMutation,
    deleteResponseMutation,
    bulkDeleteResponsesMutation,
  } = useResponseMutations(formId);

  useEffect(() => {
    if (generateLinkMutation.isSuccess && generateLinkMutation.data) {
      const link =
        generateLinkMutation.data.link || generateLinkMutation.data.url || "";
      setGeneratedLink(link);
      setLinkModalOpen(true);
    }
  }, [generateLinkMutation.isSuccess, generateLinkMutation.data]);

  // Fetch response list (without responseset for performance)
  const {
    data: responseListData,
    error,
    isLoading,
  } = useQuery({
    queryKey: ["responses", formId, currentPage],
    queryFn: async () => {
      if (!formId) {
        throw new Error("No formId provided");
      }

      return await fetchResponseList(formId, currentPage, 10);
    },
    enabled: !!formId,
    staleTime: 30000,
    retry: (failureCount) => failureCount < 3,
  });

  const responses = useMemo(
    () => responseListData?.responses || [],
    [responseListData?.responses]
  );
  const totalPages = responseListData?.pagination?.totalPages || 1;

  const { data: responseDetails, isLoading: isLoadingUserResponse } = useQuery({
    queryKey: ["responseDetails", selectedResponse?._id, formId],
    queryFn: async () => {
      if (!selectedResponse?._id || !formId) {
        throw new Error("Response ID and Form ID are required");
      }
      return await fetchResponseDetails(selectedResponse._id, formId);
    },
    enabled: !!selectedResponse?._id && !!formId && isViewOpen,
    staleTime: 30000,
    gcTime: 300000,
  });

  // Separate query for manual scoring mode which needs detailed response data
  const { data: manualScoringResponses, isLoading: isLoadingManualData } =
    useQuery({
      queryKey: ["manualScoringResponses", formId],
      queryFn: async () => {
        if (!formId) {
          throw new Error("Form ID is required");
        }

        // For manual scoring, we need to fetch detailed response data
        // This is a temporary solution - ideally we'd have a dedicated endpoint
        const responseList = await fetchResponseList(formId, 1, 1000); // Get all responses

        // Fetch detailed data for each response (limit to first few for performance)
        const detailedResponses = await Promise.all(
          responseList.responses
            .slice(0, 50)
            .map((response) => fetchResponseDetails(response._id, formId))
        );

        return detailedResponses.filter(Boolean); // Remove any null responses
      },
      enabled: !!formId && viewMode === "manual-score",
      staleTime: 30000,
      gcTime: 300000,
    });

  // Update selected response details when data is fetched
  useEffect(() => {
    if (responseDetails) {
      setSelectedResponseDetails(responseDetails);
    }
  }, [responseDetails]);

  // Apply filters to responses
  const filteredResponses = useMemo(() => {
    let filtered = responses;

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

    if (filters.status) {
      filtered = filtered.filter(
        (response) => response.completionStatus === filters.status
      );
    }

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
      case "partial":
        return "warning";
      case "abandoned":
        return "danger";
      default:
        return "default";
    }
  }, []);

  const isQuizForm = useMemo(() => {
    return form.type === FormTypeEnum.Quiz;
  }, [form.type]);

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
    setEmailModalOpen(false);
    setEmailList("");
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

  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(generatedLink);
  }, [generatedLink]);

  return (
    <div className="space-y-6">
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
            onPress={() => setEmailModalOpen(true)}
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
            onPress={() => window.open(`/analytics/${formId}`, "_blank")}
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
            <ResponseTable
              responses={filteredResponses}
              isLoading={isLoading}
              isQuizForm={isQuizForm}
              onViewResponse={(response) => {
                setSelectedResponse(response);
                onViewOpen();
              }}
              onEditScore={(response) => {
                setSelectedResponse(response);
                onScoreOpen();
              }}
              onDeleteResponse={(id: string) =>
                deleteResponseMutation.mutate(id)
              }
              onBulkDelete={(ids: string[]) =>
                bulkDeleteResponsesMutation.mutate(ids)
              }
              formatDate={formatDate}
              getStatusColor={getStatusColor}
            />
          ) : isLoadingManualData ? (
            <div className="flex justify-center items-center py-8">
              <Spinner size="lg" />
            </div>
          ) : (
            <ManualScoringView
              responses={manualScoringResponses || []}
              form={form}
              manualScores={manualScores}
              onScoreUpdate={handleManualScoreUpdate}
            />
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
      <Modal isOpen={emailModalOpen} onClose={() => setEmailModalOpen(false)}>
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
            <Button variant="light" onClick={() => setEmailModalOpen(false)}>
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={sendFormLinks}
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
      <Modal isOpen={linkModalOpen} onClose={() => setLinkModalOpen(false)}>
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
            <Button onPress={() => setLinkModalOpen(false)}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <ViewResponseModal
        isOpen={isViewOpen}
        onClose={onViewClose}
        selectedResponse={selectedResponseDetails}
        form={form}
        onEditScore={() => {
          onViewClose();
          onScoreOpen();
        }}
        formatDate={formatDate}
        getStatusColor={getStatusColor}
        isLoading={isLoadingUserResponse}
      />

      <ScoreEditModal
        isOpen={isScoreOpen}
        onClose={onScoreClose}
        selectedResponse={selectedResponseDetails}
        onUpdateScore={(responseId, newScore) => {
          updateScoreMutation.mutate({ responseId, newScore });
        }}
        isLoading={updateScoreMutation.isPending}
      />
    </div>
  );
};

ResponseDashboard.displayName = "ResponseDashboard";

export default memo(ResponseDashboard);
