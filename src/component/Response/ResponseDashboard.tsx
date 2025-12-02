import React, { useState, useMemo, memo, useCallback, useEffect } from "react";
import { useDisclosure } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { FormDataType, FormTypeEnum } from "../../types/Form.types";
import { ErrorToast } from "../Modal/AlertModal";
import { useResponseMutations } from "./hooks/useResponseMutations";
import { ScoreEditModal } from "./components/SimpleModal";
import { ResponseDataType, statusColor } from "./Response.type";
import {
  fetchResponseDetails,
  ResponseListItem,
} from "../../services/responseService";
import { useFetchResponseDashbardData } from "./hooks/useResponseDashboardData";
import { useResponseFilter } from "./hooks/useResponseFilter";
import { DashboardHeader } from "./components/DashboardHeader";
import { FilterBar } from "./components/FilterBar";
import { FilterModal } from "./components/FilterModal";
import { EmailModal, LinkModal } from "./components/FormLinkModals";
import { ResponseListSection } from "./components/ResponseListSection";

interface ResponseDashboardProps {
  formId: string;
  form: FormDataType;
}

const errorToastId = "uniqueResponseErrorId";

const ResponseDashboard: React.FC<ResponseDashboardProps> = ({
  formId,
  form,
}) => {
  // Table view mode state (normal or grouped)
  const [tableViewMode, setTableViewMode] = useState<"normal" | "grouped">(
    "normal"
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
    isOpen: isScoreOpen,
    onOpen: onScoreOpen,
    onClose: onScoreClose,
  } = useDisclosure();
  const {
    isOpen: isFilterOpen,
    onOpen: onFilterOpen,
    onClose: onFilterClose,
  } = useDisclosure();

  // Custom hooks

  const {
    updateScoreMutation,
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

  // Reset table view mode to normal if email collection is disabled
  useEffect(() => {
    if (form?.setting?.email !== true && tableViewMode === "grouped") {
      setTableViewMode("normal");
    }
  }, [form?.setting?.email, tableViewMode]);

  const {
    responseList,
    currentPage,
    limit,
    isLoading,
    handleLimitChange,
    handlePageChange,
    pagination,
    error,
  } = useFetchResponseDashbardData({
    formId,
    filterValue,
    groupBy: tableViewMode === "grouped" ? "respondentEmail" : undefined,
  });

  const { data: responseDetails } = useQuery({
    queryKey: ["responseDetails", selectedResponse?._id],
    queryFn: async () => {
      if (!selectedResponse?._id || !formId) {
        throw new Error("Response ID and Form ID are required");
      }
      return await fetchResponseDetails(selectedResponse._id);
    },
    enabled: !!selectedResponse?._id && !!formId,
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
    <div className="space-y-6 dark:bg-gray-900 dark:text-gray-100">
      <DashboardHeader
        onEmailModalOpen={() => setEmailModalOpen(true)}
        onGenerateLink={generateFormLink}
        formId={formId}
        isGeneratingLink={generateLinkMutation.isPending}
      />

      <FilterBar
        filterValue={filterValue}
        handleChange={handleChange}
        applyFilters={applyFilters}
        clearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
        onFilterOpen={onFilterOpen}
        removeSearchFilter={removeSearchFilter}
        removeStatusFilter={removeStatusFilter}
        removeDateRangeFilter={removeDateRangeFilter}
        removeScoreRangeFilter={removeScoreRangeFilter}
      />

      <ResponseListSection
        responseList={responseList}
        isLoading={isLoading}
        isQuizForm={isQuizForm}
        formId={formId}
        form={form}
        tableViewMode={tableViewMode}
        onTableViewModeChange={setTableViewMode}
        onEditScore={(response) => {
          setSelectedResponse(response);
          onScoreOpen();
        }}
        onDeleteResponse={(id: string) => deleteResponseMutation.mutate(id)}
        onBulkDelete={(ids: string[]) =>
          bulkDeleteResponsesMutation.mutate(ids)
        }
        getStatusColor={getStatusColor}
        pagination={pagination}
        currentPage={currentPage}
        limit={limit}
        handlePageChange={handlePageChange}
      />

      <EmailModal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        emailList={emailList}
        setEmailList={setEmailList}
        onSend={sendFormLinks}
        formTitle={form.title}
        isPending={sendLinksMutation.isPending}
      />

      <LinkModal
        isOpen={linkModalOpen}
        onClose={() => setLinkModalOpen(false)}
        generatedLink={generatedLink}
        onCopy={copyLink}
      />

      <FilterModal
        isOpen={isFilterOpen}
        onClose={onFilterClose}
        filterValue={filterValue}
        handleChange={handleChange}
        applyFilters={applyFilters}
        clearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
        isQuizForm={isQuizForm}
        limit={limit}
        handleLimitChange={handleLimitChange}
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
