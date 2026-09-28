import React, { useState, useCallback } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Chip,
  Button,
  Tooltip,
  Spinner,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Selection,
  Input,
  Textarea,
  Switch,
} from "@heroui/react";
import {
  FiEye,
  FiEdit3,
  FiDownload,
  FiTrash2,
  FiAlertTriangle,
  FiCornerUpLeft,
  FiUsers,
  FiList,
  FiSend,
} from "react-icons/fi";
import { getResponseDisplayName } from "../../../utils/respondentUtils";
import {
  ResponseListItem,
  GroupResponseListItemType,
} from "../../../services/responseService";
import { useMutation } from "@tanstack/react-query";
import ApiRequest from "../../../hooks/APIHook/ApiHook";
import SuccessToast, { ErrorToast } from "../../Modal/AlertModal";
import { BatchScoreEditModal } from "./SimpleModal";

const uniqueToastId = "ResponseTableUniqueErrorToastId";

type ViewMode = "normal" | "grouped";

interface ResponseTableProps {
  responses: ResponseListItem[] | GroupResponseListItemType[];
  isLoading: boolean;
  isQuizForm: boolean;
  formId: string;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  showGroupToggle?: boolean;
  onEditScore: (response: ResponseListItem) => void;
  onDeleteResponse: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
  onBatchUpdateScores?: (selectedIds: string[], newScore: number) => void;
  isBatchUpdatingScores?: boolean;
  getStatusColor: (
    status: string,
  ) => "success" | "warning" | "danger" | "default";
  currentPage?: number;
  limit?: number;
}

interface ReturnState {
  reason: string;
  feedback: string;
  additionalInfo: string;
  includeQuestionsAndResponses: boolean;
}

const defaultReturnState: ReturnState = {
  reason: "",
  feedback: "",
  additionalInfo: "",
  includeQuestionsAndResponses: false,
};

const isResponseListItem = (
  response: ResponseListItem | GroupResponseListItemType,
): response is ResponseListItem => "_id" in response;

const buildReturnHtml = (additionalInfo: string) => `
  <div style="margin: 20px 0;">
    ${
      additionalInfo
        ? `<p style="white-space: pre-wrap;">${additionalInfo}</p>`
        : "<p>No additional information provided.</p>"
    }
  </div>
`;

const useReturnResponse = () =>
  useMutation({
    mutationFn: async ({
      responseId,
      html,
      reason,
      feedback,
      includeQuestionsAndResponses,
      formid,
    }: {
      responseId: string | string[];
      formid: string;
      html: string;
      reason?: string;
      feedback?: string;
      includeQuestionsAndResponses?: boolean;
    }) => {
      const res = await ApiRequest({
        url: "/response/return",
        method: "POST",
        data: {
          responseId,
          formid,
          html,
          reason,
          feedback,
          includeQuestionsAndResponses,
        },
        cookie: true,
      });
      if (!res.success)
        throw new Error(res.message || "Failed to return response");
      return res;
    },
  });

interface ReturnFormFieldsProps {
  returnState: ReturnState;
  onReasonChange: (v: string) => void;
  onFeedbackChange: (v: string) => void;
  onAdditionalInfoChange: (v: string) => void;
  onIncludeToggle: (v: boolean) => void;
  isBulk?: boolean;
}

const ReturnFormFields: React.FC<ReturnFormFieldsProps> = ({
  returnState,
  onReasonChange,
  onFeedbackChange,
  onAdditionalInfoChange,
  onIncludeToggle,
  isBulk = false,
}) => (
  <>
    <Input
      label="Reason for Return"
      placeholder="e.g., Incomplete answers, missing information"
      value={returnState.reason}
      onValueChange={onReasonChange}
      variant="bordered"
      labelPlacement="outside"
      description={`Optional: Brief reason why the ${isBulk ? "responses are" : "response is"} being returned`}
    />
    <Textarea
      label="Feedback"
      placeholder={`Provide constructive feedback to help ${isBulk ? "respondents" : "the respondent"} improve their submission...`}
      value={returnState.feedback}
      onValueChange={onFeedbackChange}
      variant="bordered"
      labelPlacement="outside"
      minRows={4}
      description={`Optional: Detailed feedback for the ${isBulk ? "respondents" : "respondent"}`}
    />
    <Textarea
      label="Additional Information"
      placeholder="Any other information you'd like to include in the email..."
      value={returnState.additionalInfo}
      onValueChange={onAdditionalInfoChange}
      variant="bordered"
      labelPlacement="outside"
      minRows={6}
      description={`This will be included in ${isBulk ? "each " : ""}the email body`}
      isRequired
    />
    <Switch
      isSelected={returnState.includeQuestionsAndResponses}
      onValueChange={onIncludeToggle}
      classNames={{
        base: "inline-flex flex-row-reverse w-full max-w-full bg-content1 hover:bg-content2 items-center justify-between cursor-pointer rounded-lg gap-2 p-3 sm:p-4 border-2 border-transparent data-[selected=true]:border-primary",
        wrapper: "p-0 h-4 overflow-visible",
        thumb: "w-6 h-6 border-2 shadow-lg group-data-[selected=true]:ml-6",
      }}
    >
      <div className="flex flex-col gap-0.5 sm:gap-1">
        <p className="text-xs sm:text-medium font-semibold">
          Include Questions and Responses
        </p>
        <p className="text-[11px] sm:text-tiny text-default-400">
          Include all questions and{" "}
          {isBulk ? "each respondent's" : "the respondent's"} answers in the
          return email
        </p>
      </div>
    </Switch>
  </>
);

const ResponseTable: React.FC<ResponseTableProps> = ({
  responses,
  isLoading,
  isQuizForm,
  formId,
  viewMode,
  onViewModeChange,
  showGroupToggle = false,
  onEditScore,
  onDeleteResponse,
  onBulkDelete,
  onBatchUpdateScores,
  isBatchUpdatingScores,
  getStatusColor,
  currentPage = 1,
  limit = 10,
}) => {
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));
  const [deleteItem, setDeleteItem] = useState<ResponseListItem | null>(null);
  const [returnIds, setReturnIds] = useState<string[]>([]);
  const [returnState, setReturnState] =
    useState<ReturnState>(defaultReturnState);

  const returnMutation = useReturnResponse();

  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const {
    isOpen: isBulkDeleteOpen,
    onOpen: onBulkDeleteOpen,
    onClose: onBulkDeleteClose,
  } = useDisclosure();
  const {
    isOpen: isReturnModalOpen,
    onOpen: onReturnModalOpen,
    onClose: onReturnModalClose,
  } = useDisclosure();
  const {
    isOpen: isBatchScoreOpen,
    onOpen: onBatchScoreOpen,
    onClose: onBatchScoreClose,
  } = useDisclosure();

  const resetReturnState = () => setReturnState(defaultReturnState);

  const singleReturnResponse =
    returnIds.length === 1
      ? (responses
          .filter(isResponseListItem)
          .find((r) => r._id === returnIds[0]) ?? null)
      : null;

  const exportPDFMutation = useMutation({
    mutationFn: async (response: ResponseListItem) => {
      const token = localStorage.getItem("accessToken");
      const fetchResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/response/${formId}/${response._id}/export/pdf`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        },
      );

      if (!fetchResponse.ok) {
        throw new Error(`Failed to export PDF: ${fetchResponse.statusText}`);
      }

      const blob = await fetchResponse.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${getResponseDisplayName(response)}_Response.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      return blob;
    },
    onSuccess: () =>
      SuccessToast({ title: "Success", content: "PDF exported successfully!" }),
    onError: (error: Error) => {
      console.error("PDF export error:", error);
      ErrorToast({
        title: "Error",
        content: error?.message || "Failed to export PDF",
      });
    },
  });

  const handleSelectionChange = useCallback(
    (keys: Selection) => {
      if (keys === "all") {
        if (viewMode === "normal") {
          setSelectedKeys(
            new Set(responses.filter(isResponseListItem).map((r) => r._id)),
          );
        } else {
          setSelectedKeys(
            new Set(
              responses
                .filter(
                  (r): r is GroupResponseListItemType => !isResponseListItem(r),
                )
                .map((r, i) => r.respondentEmail || `group-${i}`),
            ),
          );
        }
      } else {
        setSelectedKeys(keys);
      }
    },
    [responses, viewMode],
  );

  const handleViewResponse = useCallback(
    (response: ResponseListItem | GroupResponseListItemType) => {
      if (viewMode === "grouped" && !isResponseListItem(response)) {
        if (response.responseIds && response.responseIds.length > 0) {
          const queryParams = new URLSearchParams();
          queryParams.set("responseIds", response.responseIds.join(","));
          window.open(
            `/response/${formId}/${response.responseIds[0]}?${queryParams.toString()}`,
            "_blank",
          );
        }
      } else if (isResponseListItem(response)) {
        window.open(`/response/${formId}/${response._id}`, "_blank");
      }
    },
    [formId, viewMode],
  );

  const handleSingleDelete = useCallback(
    (response: ResponseListItem) => {
      setDeleteItem(response);
      onDeleteOpen();
    },
    [onDeleteOpen],
  );

  const handleConfirmDelete = useCallback(() => {
    if (deleteItem) {
      onDeleteResponse(deleteItem._id);
      setDeleteItem(null);
      onDeleteClose();
    }
  }, [deleteItem, onDeleteResponse, onDeleteClose]);

  const handleBulkDelete = useCallback(() => {
    const selectedIds = Array.from(selectedKeys) as string[];
    if (selectedIds.length > 0) {
      onBulkDelete(selectedIds);
      setSelectedKeys(new Set([]));
      onBulkDeleteClose();
    }
  }, [selectedKeys, onBulkDelete, onBulkDeleteClose]);

  const handleReturnResponse = useCallback(
    (response: ResponseListItem) => {
      setReturnIds([response._id]);
      onReturnModalOpen();
    },
    [onReturnModalOpen],
  );

  const handleConfirmReturn = useCallback(async () => {
    if (!returnIds.length) return;
    try {
      await returnMutation.mutateAsync({
        responseId: returnIds,
        formid: formId,
        html: buildReturnHtml(returnState.additionalInfo),
        reason: returnState.reason || undefined,
        feedback: returnState.feedback || undefined,
        includeQuestionsAndResponses: returnState.includeQuestionsAndResponses,
      });
      SuccessToast({
        title: "Success",
        content:
          returnIds.length === 1
            ? "Response returned successfully"
            : `Successfully returned ${returnIds.length} responses`,
      });
      onReturnModalClose();
      setReturnIds([]);
      resetReturnState();
    } catch (error) {
      ErrorToast({
        toastid: uniqueToastId,
        title: "Error",
        content: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }, [
    returnIds,
    returnMutation,
    formId,
    returnState.additionalInfo,
    returnState.reason,
    returnState.feedback,
    returnState.includeQuestionsAndResponses,
    onReturnModalClose,
  ]);

  const handleViewSelectedResponses = useCallback(() => {
    const selectedIds = Array.from(selectedKeys) as string[];
    if (selectedIds.length === 0) return;
    const queryParams = new URLSearchParams();
    queryParams.set("responseIds", selectedIds.join(","));
    window.open(
      `/response/${formId}/${selectedIds[0]}?${queryParams.toString()}`,
      "_blank",
    );
  }, [selectedKeys, formId]);

  const selectedCount = Array.from(selectedKeys).length;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        {showGroupToggle && (
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Button
              size="sm"
              variant={viewMode === "normal" ? "solid" : "flat"}
              color={viewMode === "normal" ? "primary" : "default"}
              onPress={() => onViewModeChange("normal")}
              startContent={<FiList />}
              className="flex-1 sm:flex-none text-xs sm:text-sm"
            >
              Normal View
            </Button>
            <Button
              size="sm"
              variant={viewMode === "grouped" ? "solid" : "flat"}
              color={viewMode === "grouped" ? "primary" : "default"}
              onPress={() => onViewModeChange("grouped")}
              startContent={<FiUsers />}
              className="flex-1 sm:flex-none text-xs sm:text-sm"
            >
              Group by Email
            </Button>
          </div>
        )}

        {selectedCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto p-2.5 sm:p-0 bg-primary-50/50 dark:bg-primary-950/30 rounded-xl sm:bg-transparent">
            <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 w-full sm:w-auto">
              {selectedCount} item(s) selected
            </span>
            <div className="flex flex-wrap gap-1.5 sm:gap-2 items-center w-full sm:w-auto">
              <Button
                color="primary"
                variant="flat"
                size="sm"
                onPress={handleViewSelectedResponses}
                startContent={<FiEye />}
                className="text-xs sm:text-sm flex-1 sm:flex-none"
              >
                View<span className="hidden md:inline"> Responses</span>
              </Button>
              {isQuizForm && (
                <Button
                  color="warning"
                  variant="flat"
                  size="sm"
                  onPress={() => {
                    setReturnIds(Array.from(selectedKeys) as string[]);
                    onReturnModalOpen();
                  }}
                  startContent={<FiCornerUpLeft />}
                  className="text-xs sm:text-sm flex-1 sm:flex-none"
                >
                  Return<span className="hidden md:inline"> Selected</span>
                </Button>
              )}
              {isQuizForm && onBatchUpdateScores && (
                <Button
                  color="secondary"
                  variant="flat"
                  size="sm"
                  onPress={onBatchScoreOpen}
                  startContent={<FiEdit3 />}
                  className="text-xs sm:text-sm flex-1 sm:flex-none"
                >
                  Update Scores<span className="hidden md:inline"> ({selectedCount})</span>
                </Button>
              )}
              <Button
                color="danger"
                variant="flat"
                size="sm"
                onPress={onBulkDeleteOpen}
                startContent={<FiTrash2 />}
                className="text-xs sm:text-sm flex-1 sm:flex-none"
              >
                Delete<span className="hidden md:inline"> Selected</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      {viewMode === "normal" ? (
        <div className="w-full max-w-full overflow-x-auto min-w-0 -mx-1 sm:mx-0">
          <Table
            selectionMode="multiple"
            selectedKeys={selectedKeys}
            onSelectionChange={handleSelectionChange}
            aria-label="Response table"
            classNames={{
              table: "min-w-[700px]",
            }}
          >
            <TableHeader>
              <TableColumn className="w-12">No</TableColumn>
              <TableColumn className="min-w-[140px]">RESPONDENT</TableColumn>
              <TableColumn className="min-w-[160px]">EMAIL</TableColumn>
              <TableColumn className="min-w-[100px]">STATUS</TableColumn>
              <TableColumn className="min-w-[140px]">SUBMITTED AT</TableColumn>
              {isQuizForm ? (
                <TableColumn className="min-w-[80px]">SCORE</TableColumn>
              ) : (
                <TableColumn hideHeader>{""}</TableColumn>
              )}
              <TableColumn className="min-w-[140px]">ACTIONS</TableColumn>
            </TableHeader>
            <TableBody emptyContent="No responses found">
              {responses.filter(isResponseListItem).map((response, idx) => (
                <TableRow key={response._id}>
                  <TableCell className="font-mono text-xs sm:text-sm">
                    {(currentPage - 1) * limit + idx + 1}
                  </TableCell>
                  <TableCell>
                    <div
                      className="font-medium text-xs sm:text-sm max-w-[180px] truncate"
                      title={getResponseDisplayName(response)}
                    >
                      {getResponseDisplayName(response)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div
                      className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 max-w-[180px] truncate"
                      title={response.respondentEmail || "N/A"}
                    >
                      {response.respondentEmail || "N/A"}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Chip
                      color={getStatusColor(
                        response.completionStatus || "default",
                      )}
                      variant="flat"
                      size="sm"
                      className="text-xs"
                    >
                      {response.completionStatus || "Unknown"}
                    </Chip>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-gray-600 dark:text-gray-400">
                    {response.submittedAt
                      ? new Date(response.submittedAt).toLocaleString()
                      : "N/A"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs sm:text-sm font-semibold">
                    {isQuizForm
                      ? response.totalScore !== undefined
                        ? response.totalScore
                        : "N/A"
                      : null}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex items-center gap-1 sm:gap-1.5">
                      <Tooltip content="View Response">
                        <Button
                          size="sm"
                          variant="light"
                          isIconOnly
                          onPress={() => handleViewResponse(response)}
                        >
                          <FiEye />
                        </Button>
                      </Tooltip>
                      {isQuizForm && (
                        <>
                          <Tooltip content="Edit Score">
                            <Button
                              size="sm"
                              variant="light"
                              isIconOnly
                              onPress={() => onEditScore(response)}
                            >
                              <FiEdit3 />
                            </Button>
                          </Tooltip>
                          <Tooltip
                            content={
                              response.isCompleted ? "Returned" : "Return"
                            }
                            isDisabled={response.isCompleted}
                          >
                            <Button
                              size="sm"
                              variant="light"
                              isIconOnly
                              isLoading={returnMutation.isPending}
                              onPress={() => handleReturnResponse(response)}
                            >
                              <FiCornerUpLeft />
                            </Button>
                          </Tooltip>
                        </>
                      )}
                      <Tooltip content="Export PDF">
                        <Button
                          size="sm"
                          variant="light"
                          isIconOnly
                          isLoading={exportPDFMutation.isPending}
                          onPress={() => exportPDFMutation.mutate(response)}
                        >
                          <FiDownload />
                        </Button>
                      </Tooltip>
                      <Tooltip content="Delete Response" color="danger">
                        <Button
                          size="sm"
                          variant="light"
                          isIconOnly
                          color="danger"
                          onPress={() => handleSingleDelete(response)}
                        >
                          <FiTrash2 />
                        </Button>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="w-full max-w-full overflow-x-auto min-w-0 -mx-1 sm:mx-0">
          <Table
            selectionMode="multiple"
            selectedKeys={selectedKeys}
            onSelectionChange={handleSelectionChange}
            aria-label="Grouped response table"
            classNames={{
              table: "min-w-[620px]",
            }}
          >
            <TableHeader>
              <TableColumn className="min-w-[140px]">RESPONDENT</TableColumn>
              <TableColumn className="min-w-[160px]">EMAIL</TableColumn>
              <TableColumn className="min-w-[100px]">TYPE</TableColumn>
              <TableColumn className="min-w-[130px]">RESPONSE COUNT</TableColumn>
              <TableColumn className="min-w-[80px]">ACTIONS</TableColumn>
            </TableHeader>
            <TableBody emptyContent="No grouped responses found">
              {responses
                .filter(
                  (r): r is GroupResponseListItemType => !isResponseListItem(r),
                )
                .map((response, index) => {
                  const key = response.respondentEmail || `group-${index}`;
                  return (
                    <TableRow key={key}>
                      <TableCell>
                        <div
                          className="font-medium text-xs sm:text-sm max-w-[180px] truncate"
                          title={response.respondentName || "N/A"}
                        >
                          {response.respondentName || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div
                          className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 max-w-[180px] truncate"
                          title={response.respondentEmail || "N/A"}
                        >
                          {response.respondentEmail || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Chip
                          color="primary"
                          variant="flat"
                          size="sm"
                          className="text-xs"
                        >
                          {response.respondentType || "Unknown"}
                        </Chip>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Chip
                          color="secondary"
                          variant="flat"
                          size="sm"
                          className="text-xs font-semibold"
                        >
                          {response.responseCount || 0}
                        </Chip>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Tooltip content="View Responses">
                            <Button
                              size="sm"
                              variant="light"
                              isIconOnly
                              onPress={() => handleViewResponse(response)}
                            >
                              <FiEye />
                            </Button>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </div>
      )}

      <Modal
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        classNames={{
          base: "m-3 sm:m-auto max-w-md w-full",
        }}
      >
        <ModalContent>
          <ModalHeader className="flex items-center gap-2">
            <FiAlertTriangle className="text-danger flex-shrink-0" size={22} />
            <span>Confirm Delete</span>
          </ModalHeader>
          <ModalBody>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
              Are you sure you want to delete this response? This action cannot
              be undone.
            </p>
            {deleteItem && (
              <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-xs sm:text-sm space-y-1">
                <p>
                  <strong>Respondent:</strong>{" "}
                  {getResponseDisplayName(deleteItem)}
                </p>
                <p className="break-all">
                  <strong>Email:</strong> {deleteItem.respondentEmail || "N/A"}
                </p>
              </div>
            )}
          </ModalBody>
          <ModalFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-3">
            <Button
              variant="light"
              onPress={onDeleteClose}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              color="danger"
              onPress={handleConfirmDelete}
              className="w-full sm:w-auto"
            >
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isBulkDeleteOpen}
        onClose={onBulkDeleteClose}
        classNames={{
          base: "m-3 sm:m-auto max-w-md w-full",
        }}
      >
        <ModalContent>
          <ModalHeader className="flex items-center gap-2">
            <FiAlertTriangle className="text-danger flex-shrink-0" size={22} />
            <span>Confirm Bulk Delete</span>
          </ModalHeader>
          <ModalBody>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
              Are you sure you want to delete {selectedCount} response(s)? This
              action cannot be undone.
            </p>
          </ModalBody>
          <ModalFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-3">
            <Button
              variant="light"
              onPress={onBulkDeleteClose}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              color="danger"
              onPress={handleBulkDelete}
              className="w-full sm:w-auto"
            >
              Delete {selectedCount} Response(s)
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isReturnModalOpen}
        onClose={onReturnModalClose}
        size="2xl"
        scrollBehavior="inside"
        classNames={{
          base: "m-3 sm:m-auto max-w-2xl w-full max-h-[90vh]",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 px-4 sm:px-6 pt-5 sm:pt-6">
                <h3 className="text-lg sm:text-xl font-bold">
                  {returnIds.length === 1
                    ? "Return Response to Respondent"
                    : `Return ${returnIds.length} Response(s) to Respondents`}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 font-normal">
                  {returnIds.length === 1
                    ? `This will send an email to ${singleReturnResponse?.respondentEmail || "the respondent"} with the information below.`
                    : `This will send a return email to each of the ${returnIds.length} selected respondents.`}
                </p>
              </ModalHeader>
              <ModalBody className="gap-4 px-4 sm:px-6 py-4">
                <ReturnFormFields
                  isBulk={returnIds.length > 1}
                  returnState={returnState}
                  onReasonChange={(v) =>
                    setReturnState((s) => ({ ...s, reason: v }))
                  }
                  onFeedbackChange={(v) =>
                    setReturnState((s) => ({ ...s, feedback: v }))
                  }
                  onAdditionalInfoChange={(v) =>
                    setReturnState((s) => ({ ...s, additionalInfo: v }))
                  }
                  onIncludeToggle={(v) =>
                    setReturnState((s) => ({
                      ...s,
                      includeQuestionsAndResponses: v,
                    }))
                  }
                />
                {isQuizForm && singleReturnResponse && (
                  <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4">
                    <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-300">
                      <strong>Current Score:</strong>{" "}
                      {singleReturnResponse.totalScore || 0} points
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      The current score will be included in the email.
                    </p>
                  </div>
                )}
              </ModalBody>
              <ModalFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-3 px-4 sm:px-6 pb-5 sm:pb-6">
                <Button
                  color="default"
                  variant="light"
                  onPress={onClose}
                  isDisabled={returnMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  color="warning"
                  variant="solid"
                  onPress={handleConfirmReturn}
                  isLoading={returnMutation.isPending}
                  isDisabled={
                    !returnState.additionalInfo.trim() ||
                    returnMutation.isPending
                  }
                  startContent={
                    returnMutation.isPending ? undefined : <FiSend />
                  }
                  className="w-full sm:w-auto"
                >
                  {returnMutation.isPending
                    ? "Sending..."
                    : returnIds.length === 1
                      ? "Send Return Email"
                      : `Send to ${returnIds.length} Respondent(s)`}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {isQuizForm && onBatchUpdateScores && (
        <BatchScoreEditModal
          isOpen={isBatchScoreOpen}
          onClose={onBatchScoreClose}
          selectedCount={selectedCount}
          onConfirm={(newScore) => {
            const selectedIds = Array.from(selectedKeys) as string[];
            onBatchUpdateScores(selectedIds, newScore);
            onBatchScoreClose();
          }}
          isLoading={isBatchUpdatingScores || false}
        />
      )}
    </>
  );
};

export default ResponseTable;
