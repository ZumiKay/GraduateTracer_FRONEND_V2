import React, { useState } from "react";
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
} from "react-icons/fi";
import { getResponseDisplayName } from "../../../utils/respondentUtils";
import { ResponseListItem } from "../../../services/responseService";

interface ResponseTableProps {
  responses: ResponseListItem[];
  isLoading: boolean;
  isQuizForm: boolean;
  onViewResponse: (response: ResponseListItem) => void;
  onEditScore: (response: ResponseListItem) => void;
  onDeleteResponse: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
  formatDate: (date: Date) => string;
  getStatusColor: (
    status: string
  ) => "success" | "warning" | "danger" | "default";
}

const ResponseTable: React.FC<ResponseTableProps> = ({
  responses,
  isLoading,
  isQuizForm,
  onViewResponse,
  onEditScore,
  onDeleteResponse,
  onBulkDelete,
  formatDate,
  getStatusColor,
}) => {
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));
  const [deleteItem, setDeleteItem] = useState<ResponseListItem | null>(null);

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

  const exportToPDF = () => {
    // Note: Export functionality is currently disabled for table view
    // as it requires detailed response data with responseset
    // This would need to be handled by fetching detailed data first
    console.warn("Export functionality requires detailed response data");
    return;
  };

  const handleSingleDelete = (response: ResponseListItem) => {
    setDeleteItem(response);
    onDeleteOpen();
  };

  const handleConfirmDelete = () => {
    if (deleteItem) {
      onDeleteResponse(deleteItem._id);
      setDeleteItem(null);
      onDeleteClose();
    }
  };

  const handleBulkDelete = () => {
    const selectedIds = Array.from(selectedKeys) as string[];
    if (selectedIds.length > 0) {
      onBulkDelete(selectedIds);
      setSelectedKeys(new Set([]));
      onBulkDeleteClose();
    }
  };

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
            onPress={onBulkDeleteOpen}
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
                {response.respondentEmail || response.guest?.email || "N/A"}
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
                      onPress={() => onViewResponse(response)}
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
                        onPress={() => onEditScore(response)}
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
                      onPress={() => exportToPDF()}
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
                  <strong>Email:</strong>{" "}
                  {deleteItem.respondentEmail ||
                    deleteItem.guest?.email ||
                    "N/A"}
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
