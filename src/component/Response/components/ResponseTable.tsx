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
        base: "inline-flex flex-row-reverse w-full max-w-full bg-content1 hover:bg-content2 items-center justify-between cursor-pointer rounded-lg gap-2 p-4 border-2 border-transparent data-[selected=true]:border-primary",
        wrapper: "p-0 h-4 overflow-visible",
        thumb: "w-6 h-6 border-2 shadow-lg group-data-[selected=true]:ml-6",
      }}
    >
      <div className="flex flex-col gap-1">
        <p className="text-medium font-semibold">
          Include Questions and Responses
        </p>
        <p className="text-tiny text-default-400">
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
      <div className="mb-4 flex justify-between items-center">
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
              >
                Return Selected
              </Button>
            )}
            <Button
              color="danger"
              variant="flat"
              size="sm"
              onPress={onBulkDeleteOpen}
              startContent={<FiTrash2 />}
            >
              Delete Selected
            </Button>
          </div>
        )}
      </div>

      {viewMode === "normal" ? (
        <Table
          selectionMode="multiple"
          selectedKeys={selectedKeys}
          onSelectionChange={handleSelectionChange}
          aria-label="Response table"
        >
          <TableHeader>
            <TableColumn>No</TableColumn>
            <TableColumn>RESPONDENT</TableColumn>
            <TableColumn>EMAIL</TableColumn>
            <TableColumn>STATUS</TableColumn>
            <TableColumn>SUBMITTED AT</TableColumn>
            {isQuizForm ? (
              <TableColumn>SCORE</TableColumn>
            ) : (
              <TableColumn hideHeader>{""}</TableColumn>
            )}
            <TableColumn>ACTIONS</TableColumn>
          </TableHeader>
          <TableBody emptyContent="No responses found">
            {responses.filter(isResponseListItem).map((response, idx) => (
              <TableRow key={response._id}>
                <TableCell>{(currentPage - 1) * limit + idx + 1}</TableCell>
                <TableCell>{getResponseDisplayName(response)}</TableCell>
                <TableCell>{response.respondentEmail || "N/A"}</TableCell>
                <TableCell>
                  <Chip
                    color={getStatusColor(
                      response.completionStatus || "default",
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
                  {isQuizForm
                    ? response.totalScore !== undefined
                      ? response.totalScore
                      : "N/A"
                    : null}
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
                            onPress={() => onEditScore(response)}
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
      ) : (
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
                (r): r is GroupResponseListItemType => !isResponseListItem(r),
              )
              .map((response, index) => {
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
                  {returnIds.length === 1
                    ? "Return Response to Respondent"
                    : `Return ${returnIds.length} Response(s) to Respondents`}
                </h3>
                <p className="text-sm text-gray-500 font-normal">
                  {returnIds.length === 1
                    ? `This will send an email to ${singleReturnResponse?.respondentEmail || "the respondent"} with the information below.`
                    : `This will send a return email to each of the ${returnIds.length} selected respondents.`}
                </p>
              </ModalHeader>
              <ModalBody className="gap-4">
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
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Current Score:</strong>{" "}
                      {singleReturnResponse.totalScore || 0} points
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
                    !returnState.additionalInfo.trim() ||
                    returnMutation.isPending
                  }
                  startContent={
                    returnMutation.isPending ? undefined : <FiSend />
                  }
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
    </>
  );
};

export default ResponseTable;
