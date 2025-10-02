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
} from "@heroui/react";
import {
  FiEye,
  FiEdit3,
  FiDownload,
  FiTrash2,
  FiAlertTriangle,
  FiCornerUpLeft,
} from "react-icons/fi";
import { getResponseDisplayName } from "../../../utils/respondentUtils";
import { ResponseListItem } from "../../../services/responseService";
import { useMutation } from "@tanstack/react-query";
import ApiRequest from "../../../hooks/ApiHook";
import SuccessToast, { ErrorToast } from "../../Modal/AlertModal";

const uniqueToastId = "ResponseTableUniqueErrorToastId";

interface ResponseTableProps {
  responses: ResponseListItem[];
  isLoading: boolean;
  isQuizForm: boolean;
  formId: string;
  onViewResponse: (response: ResponseListItem) => void;
  onEditScore: (response: ResponseListItem) => void;
  onDeleteResponse: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
  formatDate: (date: Date) => string;
  getStatusColor: (
    status: string
  ) => "success" | "warning" | "danger" | "default";
}

const useReturnResponse = () => {
  return useMutation({
    mutationFn: async (responseId: string) => {
      const res = await ApiRequest({
        url: "/response/return",
        method: "POST",
        data: { responseId },
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
  onViewResponse,
  onEditScore,
  onDeleteResponse,
  onBulkDelete,
  formatDate,
  getStatusColor,
}) => {
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));
  const [deleteItem, setDeleteItem] = useState<ResponseListItem | null>(null);
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

  const handleViewResponse = useCallback(
    (response: ResponseListItem) => {
      onViewResponse(response);
    },
    [onViewResponse]
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
    async (response: ResponseListItem) => {
      try {
        await returnMutation.mutateAsync(response._id);

        SuccessToast({
          toastid: "SuccessToast",
          title: "Response Returned",
          content:
            "The response has been successfully returned to the respondent.",
        });
      } catch (error) {
        ErrorToast({
          toastid: uniqueToastId,
          title: "Error Returning Response",
          content: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    [returnMutation]
  );

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
      {selectedCount > 0 && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg flex justify-between items-center">
          <span className="text-sm text-gray-600">
            {selectedCount} item(s) selected
          </span>
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

      <Table
        selectionMode="multiple"
        selectedKeys={selectedKeys}
        onSelectionChange={setSelectedKeys}
        aria-label="Response table"
      >
        <TableHeader>
          <TableColumn>RESPONDENT</TableColumn>
          <TableColumn>EMAIL</TableColumn>
          <TableColumn>STATUS</TableColumn>
          <TableColumn>SUBMITTED</TableColumn>
          <TableColumn>ACTIONS</TableColumn>
        </TableHeader>
        <TableBody emptyContent="No responses found">
          {responses.map((response) => (
            <TableRow key={response._id}>
              <TableCell>{getResponseDisplayName(response)}</TableCell>
              <TableCell>
                {response.respondentEmail || "N/A"}
                {` (${response.respondentType})`}
              </TableCell>
              <TableCell>
                <Chip
                  color={getStatusColor(response.completionStatus || "default")}
                  variant="flat"
                  size="sm"
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
              <div className="mt-2 p-2 bg-gray-50 rounded">
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
    </>
  );
};

export default ResponseTable;
