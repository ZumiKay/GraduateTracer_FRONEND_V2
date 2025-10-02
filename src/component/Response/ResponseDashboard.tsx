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
  DateRangePicker,
  RangeValue,
} from "@heroui/react";
import { FiMail, FiLink, FiBarChart, FiX } from "react-icons/fi";
import { useQuery } from "@tanstack/react-query";
import { FormDataType, FormTypeEnum } from "../../types/Form.types";
import { ErrorToast } from "../Modal/AlertModal";
import { useResponseMutations } from "./hooks/useResponseMutations";
import ResponseTable from "./components/ResponseTable";
import ManualScoringView from "./components/ManualScoringView";
import ViewResponseModal from "./components/ViewResponseModal";
import { ScoreEditModal } from "./components/SimpleModal";
import {
  ResponseDataType,
  statusColor,
  ResponseCompletionStatus,
} from "./Response.type";
import {
  fetchResponseDetails,
  ResponseListItem,
} from "../../services/responseService";
import { useFetchResponseDashbardData } from "./hooks/useResponseDashboardData";
import { useResponseFilter } from "./hooks/useResponseFilter";
import { useSearchParams } from "react-router-dom";
import { getLocalTimeZone } from "@internationalized/date";

interface ResponseDashboardProps {
  formId: string;
  form: FormDataType;
}

const errorToastId = "uniqueResponseErrorId";

const ResponseDashboard: React.FC<ResponseDashboardProps> = ({
  formId,
  form,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const viewMode =
    (searchParams.get("viewMode") as "all" | "manual-score") || "all";

  const setViewMode = useCallback(
    (newViewMode: "all" | "manual-score") => {
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev);
        if (newViewMode === "all") {
          newParams.delete("viewMode");
        } else {
          newParams.set("viewMode", newViewMode);
        }
        return newParams;
      });
    },
    [setSearchParams]
  );

  const [selectedResponse, setSelectedResponse] =
    useState<ResponseListItem | null>(null);
  const [selectedResponseDetails, setSelectedResponseDetails] =
    useState<ResponseDataType | null>(null);
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

  // Custom hooks

  const {
    updateScoreMutation,
    updateQuestionScoreMutation,
    sendLinksMutation,
    generateLinkMutation,
    deleteResponseMutation,
    bulkDeleteResponsesMutation,
  } = useResponseMutations(formId);

  const {
    filterValue,
    handleChange,
    clearFilters,
    hasActiveFilters,
    applyFilters,
  } = useResponseFilter();

  useEffect(() => {
    if (generateLinkMutation.isSuccess && generateLinkMutation.data) {
      const link =
        generateLinkMutation.data.link || generateLinkMutation.data.url || "";
      setGeneratedLink(link);
      setLinkModalOpen(true);
    }
  }, [generateLinkMutation.isSuccess, generateLinkMutation.data]);

  const {
    responseList,
    currentPage,
    limit,
    isLoading,
    handleLimitChange,
    handlePageChange,
    pagination,
    error,
  } = useFetchResponseDashbardData({ formId, filterValue });

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

  // Update selected response details when data is fetched
  useEffect(() => {
    if (responseDetails) {
      setSelectedResponseDetails(responseDetails);
    }
  }, [responseDetails]);

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
      updateQuestionScoreMutation.mutate({
        responseId,
        questionId,
        score,
      });
    },
    [updateQuestionScoreMutation]
  );

  // Individual filter removal functions
  const removeSearchFilter = useCallback(() => {
    handleChange({ name: "searchTerm", value: undefined });
    applyFilters({ name: "q" });
  }, [handleChange, applyFilters]);

  const removeStatusFilter = useCallback(() => {
    handleChange({ name: "completionStatus", value: undefined });
    applyFilters({ name: "status" });
  }, [handleChange, applyFilters]);

  const removeDateRangeFilter = useCallback(() => {
    handleChange({ name: "dateRange", value: undefined });
    applyFilters({ name: ["startD", "endD"] });
  }, [handleChange, applyFilters]);

  const removeScoreRangeFilter = useCallback(() => {
    handleChange({ name: "scoreRange", value: undefined });
    applyFilters({ name: ["startS", "endS"] });
  }, [handleChange, applyFilters]);

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
            size="md"
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              placeholder="Search by name or email..."
              label="Search"
              value={filterValue?.searchTerm || ""}
              onChange={(e) =>
                handleChange({
                  name: "searchTerm",
                  value: e.target.value || undefined,
                })
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  applyFilters({ name: "q", val: filterValue?.searchTerm });
                }
              }}
              aria-label="search"
              isClearable
              onClear={() => {
                handleChange({ name: "searchTerm", value: undefined });
                applyFilters({ name: "q" });
              }}
              size="lg"
              className="h-20"
            />

            <Select
              label="Status"
              placeholder="Completion Status"
              size="lg"
              className="h-14"
              selectedKeys={
                filterValue?.completionStatus
                  ? [filterValue.completionStatus]
                  : []
              }
              onSelectionChange={(keys) => {
                const keysArray = Array.from(keys);
                if (keysArray.length === 0) {
                  handleChange({
                    name: "completionStatus",
                    value: undefined,
                  });
                  applyFilters({ name: "status" });
                } else {
                  const selected = keysArray[0] as ResponseCompletionStatus;
                  handleChange({
                    name: "completionStatus",
                    value: selected,
                  });
                  applyFilters({ name: "status", val: selected });
                }
              }}
              selectionMode="single"
              disallowEmptySelection={false}
            >
              <SelectItem key="completed">Completed</SelectItem>
              <SelectItem key="partial">Partial</SelectItem>
              <SelectItem key="abandoned">Abandoned</SelectItem>
            </Select>

            {/* Items per page */}
            <Select
              label="Items per page"
              placeholder="Select limit"
              selectedKeys={[limit.toString()]}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0];
                if (selected) {
                  handleLimitChange(Number(selected));
                }
              }}
              size="lg"
              className="h-14"
            >
              <SelectItem key="5">5 per page</SelectItem>
              <SelectItem key="10">10 per page</SelectItem>
              <SelectItem key="20">20 per page</SelectItem>
              <SelectItem key="50">50 per page</SelectItem>
              <SelectItem key="100">100 per page</SelectItem>
            </Select>

            {/* Date Range Filter */}
            <DateRangePicker
              label="Date Range"
              value={
                filterValue?.dateRange &&
                filterValue.dateRange.start &&
                filterValue.dateRange.end
                  ? {
                      start: filterValue.dateRange.start,
                      end: filterValue.dateRange.end,
                    }
                  : null
              }
              onChange={(range) => {
                handleChange({
                  name: "dateRange",
                  value: range || undefined,
                });
                if (range?.start && range?.end) {
                  applyFilters({
                    name: ["startD", "endD"],
                    val: {
                      start: range.start.toString(),
                      end: range.end.toString(),
                    },
                  });
                } else if (!range) {
                  // Handle clearing the date range
                  applyFilters({ name: ["startD", "endD"] });
                }
              }}
              className="w-full h-full"
              granularity="day"
              size="lg"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 items-end">
            {isQuizForm && (
              <div className="flex gap-2 items-center h-10">
                <Input
                  type="number"
                  placeholder="Min Score"
                  value={filterValue?.scoreRange?.start?.toString() || ""}
                  onChange={(e) => {
                    const value = e.target.value
                      ? Number(e.target.value)
                      : undefined;
                    const currentRange = filterValue?.scoreRange || {
                      start: undefined,
                      end: undefined,
                    };
                    handleChange({
                      name: "scoreRange",
                      value: {
                        start: value,
                        end: currentRange.end,
                      } as RangeValue<number>,
                    });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      applyFilters({
                        name: "startS",
                        val: filterValue?.scoreRange?.start?.toString(),
                      });
                    }
                  }}
                  onClear={() => {
                    const currentRange = filterValue?.scoreRange || {
                      start: undefined,
                      end: undefined,
                    };
                    if (!currentRange.end) {
                      // If no end value either, clear the entire range
                      handleChange({
                        name: "scoreRange",
                        value: undefined,
                      });
                    } else {
                      // Clear entire range when individual fields are cleared to avoid type issues
                      handleChange({
                        name: "scoreRange",
                        value: undefined,
                      });
                    }
                  }}
                  className="w-24"
                  size="md"
                  isClearable
                />
                <span className="text-sm text-gray-500 px-1">to</span>
                <Input
                  type="number"
                  placeholder="Max Score"
                  value={filterValue?.scoreRange?.end?.toString() || ""}
                  onChange={(e) => {
                    const value = e.target.value
                      ? Number(e.target.value)
                      : undefined;
                    const currentRange = filterValue?.scoreRange || {
                      start: undefined,
                      end: undefined,
                    };
                    handleChange({
                      name: "scoreRange",
                      value: {
                        start: currentRange.start,
                        end: value,
                      } as RangeValue<number>,
                    });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      applyFilters({
                        name: "endS",
                        val: filterValue?.scoreRange?.end?.toString(),
                      });
                    }
                  }}
                  onClear={() => {
                    const currentRange = filterValue?.scoreRange || {
                      start: undefined,
                      end: undefined,
                    };
                    if (!currentRange.start) {
                      // If no start value either, clear the entire range
                      handleChange({
                        name: "scoreRange",
                        value: undefined,
                      });
                    } else {
                      // Clear entire range when individual fields are cleared to avoid type issues
                      handleChange({
                        name: "scoreRange",
                        value: undefined,
                      });
                    }
                  }}
                  className="w-24"
                  size="md"
                  isClearable
                />
              </div>
            )}

            <div className="flex gap-2 items-center h-10">
              {hasActiveFilters && (
                <Button
                  color="default"
                  variant="light"
                  onPress={clearFilters}
                  size="md"
                >
                  Clear All
                </Button>
              )}
            </div>

            {/* Filter Indicator */}
            {hasActiveFilters && (
              <div className="text-sm text-gray-600">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">Active filters:</span>
                  <span className="text-xs text-gray-500">
                    Click any filter to remove it
                  </span>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {filterValue?.searchTerm && (
                    <button
                      onClick={removeSearchFilter}
                      className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs flex items-center gap-1 hover:bg-blue-200 transition-colors"
                    >
                      Search: {filterValue.searchTerm}
                      <FiX size={12} />
                    </button>
                  )}
                  {filterValue?.completionStatus && (
                    <button
                      onClick={removeStatusFilter}
                      className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs flex items-center gap-1 hover:bg-green-200 transition-colors"
                    >
                      Status: {filterValue.completionStatus}
                      <FiX size={12} />
                    </button>
                  )}
                  {filterValue?.dateRange && (
                    <button
                      onClick={removeDateRangeFilter}
                      className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs flex items-center gap-1 hover:bg-purple-200 transition-colors"
                    >
                      Date Range
                      <FiX size={12} />
                    </button>
                  )}
                  {filterValue?.scoreRange &&
                    (filterValue.scoreRange.start ||
                      filterValue.scoreRange.end) && (
                      <button
                        onClick={removeScoreRangeFilter}
                        className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs flex items-center gap-1 hover:bg-orange-200 transition-colors"
                      >
                        Score: {filterValue.scoreRange.start || 0}-
                        {filterValue.scoreRange.end || "∞"}
                        <FiX size={12} />
                      </button>
                    )}
                </div>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">
            {viewMode === "all"
              ? `Responses (${responseList?.length ?? 0})`
              : "Manual Scoring"}
          </h3>
        </CardHeader>
        <CardBody>
          {viewMode === "all" ? (
            <ResponseTable
              responses={responseList ?? []}
              isLoading={isLoading}
              isQuizForm={isQuizForm}
              formId={formId}
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
          ) : (
            <ManualScoringView
              formId={formId}
              form={form}
              onScoreUpdate={handleManualScoreUpdate}
            />
          )}

          {viewMode === "all" && pagination && (
            <div className="mt-6 space-y-4">
              {/* Pagination Info */}
              <div className="flex justify-between items-center text-sm text-gray-600">
                <div>
                  Showing {(currentPage - 1) * limit + 1} to{" "}
                  {Math.min(currentPage * limit, pagination.totalCount)} of{" "}
                  {pagination.totalCount} responses
                </div>
                <div>
                  Page {currentPage} of {pagination.totalPages}
                </div>
              </div>

              {/* Pagination Controls */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center">
                  <Pagination
                    total={pagination.totalPages}
                    page={currentPage}
                    onChange={handlePageChange}
                    showControls
                    size="lg"
                    className="gap-2"
                  />
                </div>
              )}
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
            <Button variant="light" onPress={() => setEmailModalOpen(false)}>
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
                  <Button onPress={copyLink}>Copy</Button>
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
