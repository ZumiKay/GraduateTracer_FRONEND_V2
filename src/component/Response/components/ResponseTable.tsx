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
import ApiRequest from "../../../hooks/ApiHook";
import SuccessToast, { ErrorToast } from "../../Modal/AlertModal";

const uniqueToastId = "ResponseTableUniqueErrorToastId";

type ViewMode = "normal" | "grouped";

interface ResponseTableProps {
  responses: ResponseListItem[] | GroupResponseListItemType[];
  isLoading: boolean;
  isQuizForm: boolean;
  formId: string;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  showGroupToggle?: boolean; // Only show toggle if email collection is enabled
  onEditScore: (response: ResponseListItem) => void;
  onDeleteResponse: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
  getStatusColor: (
    status: string
  ) => "success" | "warning" | "danger" | "default";
}

const useReturnResponse = () => {
  return useMutation({
    mutationFn: async ({
      responseId,
      html,
      reason,
      feedback,
      includeQuestionsAndResponses,
    }: {
      responseId: string;
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
          html,
          reason,
          feedback,
          includeQuestionsAndResponses,
        },
        cookie: true,
      });

      if (!res.success) {
        throw new Error(res.message || "Failed to return response");
      }
      return res;
    },
  });
};

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
  getStatusColor,
}) => {
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));
  const [deleteItem, setDeleteItem] = useState<ResponseListItem | null>(null);
  const [returnItem, setReturnItem] = useState<ResponseListItem | null>(null);
  const [returnReason, setReturnReason] = useState("");
  const [returnFeedback, setReturnFeedback] = useState("");
  const [returnAdditionalInfo, setReturnAdditionalInfo] = useState("");
  const [includeQuestionsAndResponses, setIncludeQuestionsAndResponses] =
    useState(false);
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

  // Type guard to check if response is ResponseListItem
  const isResponseListItem = (
    response: ResponseListItem | GroupResponseListItemType
  ): response is ResponseListItem => {
    return "_id" in response;
  };

  // Handle selection change - convert "all" to actual IDs
  const handleSelectionChange = useCallback(
    (keys: Selection) => {
      if (keys === "all") {
        // When "all" is selected, convert to actual IDs
        if (viewMode === "normal") {
          const allIds = responses.filter(isResponseListItem).map((r) => r._id);
          setSelectedKeys(new Set(allIds));
        } else {
          // For grouped view, use email or index as key
          const allKeys = responses
            .filter(
              (r): r is GroupResponseListItemType => !isResponseListItem(r)
            )
            .map((r, index) => r.respondentEmail || `group-${index}`);
          setSelectedKeys(new Set(allKeys));
        }
      } else {
        setSelectedKeys(keys);
      }
    },
    [responses, viewMode]
  );

  const handleViewResponse = useCallback(
    (response: ResponseListItem | GroupResponseListItemType) => {
      if (viewMode === "grouped" && !isResponseListItem(response)) {
        // For grouped items, open with all responseIds in the group
        if (response.responseIds && response.responseIds.length > 0) {
          const queryParams = new URLSearchParams();
          queryParams.set("responseIds", response.responseIds.join(","));
          window.open(
            `/response/${formId}/${
              response.responseIds[0]
            }?${queryParams.toString()}`,
            "_blank"
          );
        }
      } else if (isResponseListItem(response)) {
        // For normal items, open single response
        window.open(`/response/${formId}/${response._id}`, "_blank");
      }
    },
    [formId, viewMode]
  );

  const handleEditScore = useCallback(
    (response: ResponseListItem) => {
      onEditScore(response);
    },
    [onEditScore]
  );

  const exportPDFMutation = useMutation({
    mutationFn: async (response: ResponseListItem) => {
      const token = localStorage.getItem("accessToken");
      const fetchResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/response/${formId}/${
          response._id
        }/export/pdf`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (!fetchResponse.ok) {
        throw new Error(`Failed to export PDF: ${fetchResponse.statusText}`);
      }

      const blob = await fetchResponse.blob();

      // Create download link
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
    onSuccess: () => {
      SuccessToast({
        title: "Success",
        content: "PDF exported successfully!",
      });
    },
    onError: (error: Error) => {
      console.error("PDF export error:", error);
      ErrorToast({
        title: "Error",
        content: error?.message || "Failed to export PDF",
      });
    },
  });

  const exportToPDF = useCallback(
    (response: ResponseListItem) => {
      exportPDFMutation.mutate(response);
    },
    [exportPDFMutation]
  );

  const handleSingleDelete = useCallback(
    (response: ResponseListItem) => {
      setDeleteItem(response);
      onDeleteOpen();
    },
    [onDeleteOpen]
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

  const handleBulkDeleteOpen = useCallback(() => {
    onBulkDeleteOpen();
  }, [onBulkDeleteOpen]);

  const handleReturnResponse = useCallback(
    (response: ResponseListItem) => {
      setReturnItem(response);
      onReturnModalOpen();
    },
    [onReturnModalOpen]
  );

  const handleConfirmReturn = useCallback(async () => {
    if (!returnItem) return;

    try {
      const htmlContent = `
          <div style="margin: 20px 0;">
            ${
              returnAdditionalInfo
                ? `<p style="white-space: pre-wrap;">${returnAdditionalInfo}</p>`
                : "<p>No additional information provided.</p>"
            }
          </div>
        `;

      await returnMutation.mutateAsync({
        responseId: returnItem._id,
        html: htmlContent,
        reason: returnReason || undefined,
        feedback: returnFeedback || undefined,
        includeQuestionsAndResponses,
      });

      SuccessToast({
        title: "Success",
        content: "Response returned successfully",
      });

      onReturnModalClose();
      setReturnItem(null);
      setReturnReason("");
      setReturnFeedback("");
      setReturnAdditionalInfo("");
      setIncludeQuestionsAndResponses(false);
    } catch (error) {
      ErrorToast({
        toastid: uniqueToastId,
        title: "Error",
        content: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }, [
    returnItem,
    returnReason,
    returnFeedback,
    returnAdditionalInfo,
    includeQuestionsAndResponses,
    returnMutation,
    onReturnModalClose,
  ]);

  // Handle viewing multiple selected responses
  const handleViewSelectedResponses = useCallback(() => {
    const selectedIds = Array.from(selectedKeys) as string[];
    if (selectedIds.length === 0) return;

    const firstResponseId = selectedIds[0];

    const queryParams = new URLSearchParams();
    queryParams.set("responseIds", selectedIds.join(","));

    // Open in new tab with query parameters
    window.open(
      `/response/${formId}/${firstResponseId}?${queryParams.toString()}`,
      "_blank"
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
      <div className="mb-4 flex justify-between items-center">
        {/* View Mode Toggle - only show if email collection is enabled */}
        {showGroupToggle && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={viewMode === "normal" ? "solid" : "flat"}
              color={viewMode === "normal" ? "primary" : "default"}
              onPress={() => onViewModeChange("normal")}
              startContent={<FiList />}
            >
              Normal View
            </Button>
            <Button
              size="sm"
              variant={viewMode === "grouped" ? "solid" : "flat"}
              color={viewMode === "grouped" ? "primary" : "default"}
              onPress={() => onViewModeChange("grouped")}
              startContent={<FiUsers />}
            >
              Group by Email
            </Button>
          </div>
        )}

        {/* Bulk Actions - only show if items are selected */}
        {selectedCount > 0 && (
          <div className="flex gap-2 items-center">
            <span className="text-sm text-gray-600">
              {selectedCount} item(s) selected
            </span>
            <Button
              color="primary"
              variant="flat"
              size="sm"
              onPress={handleViewSelectedResponses}
              startContent={<FiEye />}
            >
              View Responses
            </Button>
            <Button
              color="danger"
              variant="flat"
              size="sm"
              onPress={handleBulkDeleteOpen}
              startContent={<FiTrash2 />}
            >
              Delete Selected
            </Button>
          </div>
        )}
      </div>

      {viewMode === "normal" ? (
        // Normal View Table
        <Table
          selectionMode="multiple"
          selectedKeys={selectedKeys}
          onSelectionChange={handleSelectionChange}
          aria-label="Response table"
        >
          <TableHeader>
            <TableColumn>RESPONDENT</TableColumn>
            <TableColumn>EMAIL</TableColumn>
            <TableColumn>STATUS</TableColumn>
            <TableColumn>SUBMITTED AT</TableColumn>
            <TableColumn>ACTIONS</TableColumn>
          </TableHeader>
          <TableBody emptyContent="No responses found">
            {responses.filter(isResponseListItem).map((response) => (
              <TableRow key={response._id}>
                <TableCell>{getResponseDisplayName(response)}</TableCell>
                <TableCell>
                  {response.respondentEmail || "N/A"}
                  {` (${response.respondentType})`}
                </TableCell>
                <TableCell>
                  <Chip
                    color={getStatusColor(
                      response.completionStatus || "default"
                    )}
                    variant="flat"
                    size="sm"
                  >
                    {response.completionStatus || "Unknown"}
                  </Chip>
                </TableCell>
                <TableCell>
                  {response.submittedAt
                    ? new Date(response.submittedAt).toLocaleString()
                    : "N/A"}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
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
                            onPress={() => handleEditScore(response)}
                          >
                            <FiEdit3 />
                          </Button>
                        </Tooltip>
                        <Tooltip
                          content={response.isCompleted ? "Returned" : "Return"}
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
                        onPress={() => exportToPDF(response)}
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
      ) : (
        // Grouped View Table
        <Table
          selectionMode="multiple"
          selectedKeys={selectedKeys}
          onSelectionChange={handleSelectionChange}
          aria-label="Grouped response table"
        >
          <TableHeader>
            <TableColumn>RESPONDENT</TableColumn>
            <TableColumn>EMAIL</TableColumn>
            <TableColumn>TYPE</TableColumn>
            <TableColumn>RESPONSE COUNT</TableColumn>
            <TableColumn>ACTIONS</TableColumn>
          </TableHeader>
          <TableBody emptyContent="No grouped responses found">
            {responses
              .filter(
                (r): r is GroupResponseListItemType => !isResponseListItem(r)
              )
              .map((response, index) => {
                // Use email as key since grouped items don't have _id
                const key = response.respondentEmail || `group-${index}`;
                return (
                  <TableRow key={key}>
                    <TableCell>{response.respondentName || "N/A"}</TableCell>
                    <TableCell>{response.respondentEmail || "N/A"}</TableCell>
                    <TableCell>
                      <Chip color="primary" variant="flat" size="sm">
                        {response.respondentType || "Unknown"}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <Chip color="secondary" variant="flat" size="sm">
                        {response.responseCount || 0}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
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
      )}

      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <FiAlertTriangle className="text-danger" size={24} />
            Confirm Delete
          </ModalHeader>
          <ModalBody>
            <p>
              Are you sure you want to delete this response? This action cannot
              be undone.
            </p>
            {deleteItem && (
              <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-600 rounded">
                <p className="text-sm">
                  <strong>Respondent:</strong>{" "}
                  {getResponseDisplayName(deleteItem)}
                </p>
                <p className="text-sm">
                  <strong>Email:</strong> {deleteItem.respondentEmail || "N/A"}
                </p>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onDeleteClose}>
              Cancel
            </Button>
            <Button color="danger" onPress={handleConfirmDelete}>
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isBulkDeleteOpen} onClose={onBulkDeleteClose}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <FiAlertTriangle className="text-danger" size={24} />
            Confirm Bulk Delete
          </ModalHeader>
          <ModalBody>
            <p>
              Are you sure you want to delete {selectedCount} response(s)? This
              action cannot be undone.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onBulkDeleteClose}>
              Cancel
            </Button>
            <Button color="danger" onPress={handleBulkDelete}>
              Delete {selectedCount} Response(s)
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Return to Respondent Modal */}
      <Modal
        isOpen={isReturnModalOpen}
        onClose={onReturnModalClose}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h3 className="text-xl font-bold">
                  Return Response to Respondent
                </h3>
                <p className="text-sm text-gray-500 font-normal">
                  This will send an email to{" "}
                  {returnItem?.respondentEmail || "the respondent"} with the
                  information below.
                </p>
              </ModalHeader>
              <ModalBody className="gap-4">
                <Input
                  label="Reason for Return"
                  placeholder="e.g., Incomplete answers, missing information"
                  value={returnReason}
                  onValueChange={setReturnReason}
                  variant="bordered"
                  labelPlacement="outside"
                  description="Optional: Brief reason why the response is being returned"
                />

                <Textarea
                  label="Feedback"
                  placeholder="Provide constructive feedback to help the respondent improve their submission..."
                  value={returnFeedback}
                  onValueChange={setReturnFeedback}
                  variant="bordered"
                  labelPlacement="outside"
                  minRows={4}
                  description="Optional: Detailed feedback for the respondent"
                />

                <Textarea
                  label="Additional Information"
                  placeholder="Any other information you'd like to include in the email..."
                  value={returnAdditionalInfo}
                  onValueChange={setReturnAdditionalInfo}
                  variant="bordered"
                  labelPlacement="outside"
                  minRows={6}
                  description="This will be included in the email body"
                  isRequired
                />

                <Switch
                  isSelected={includeQuestionsAndResponses}
                  onValueChange={setIncludeQuestionsAndResponses}
                  classNames={{
                    base: "inline-flex flex-row-reverse w-full max-w-full bg-content1 hover:bg-content2 items-center justify-between cursor-pointer rounded-lg gap-2 p-4 border-2 border-transparent data-[selected=true]:border-primary",
                    wrapper: "p-0 h-4 overflow-visible",
                    thumb:
                      "w-6 h-6 border-2 shadow-lg group-data-[selected=true]:ml-6",
                  }}
                >
                  <div className="flex flex-col gap-1">
                    <p className="text-medium font-semibold">
                      Include Questions and Responses
                    </p>
                    <p className="text-tiny text-default-400">
                      Include all questions and the respondent's answers in the
                      return email
                    </p>
                  </div>
                </Switch>

                {isQuizForm && returnItem && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Current Score:</strong>{" "}
                      {returnItem.totalScore || 0} points
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      The current score will be included in the email.
                    </p>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button
                  color="default"
                  variant="light"
                  onPress={onClose}
                  isDisabled={returnMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  color="warning"
                  variant="solid"
                  onPress={handleConfirmReturn}
                  isLoading={returnMutation.isPending}
                  isDisabled={
                    !returnAdditionalInfo.trim() || returnMutation.isPending
                  }
                  startContent={
                    returnMutation.isPending ? undefined : <FiSend />
                  }
                >
                  {returnMutation.isPending
                    ? "Sending..."
                    : "Send Return Email"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

export default ResponseTable;
