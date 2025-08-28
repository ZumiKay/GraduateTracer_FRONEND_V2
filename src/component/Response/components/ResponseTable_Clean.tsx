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
import jsPDF from "jspdf";

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

interface ResponseTableProps {
  responses: ResponseData[];
  isLoading: boolean;
  isQuizForm: boolean;
  onViewResponse: (response: ResponseData) => void;
  onEditScore: (response: ResponseData) => void;
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
  const [deleteItem, setDeleteItem] = useState<ResponseData | null>(null);

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

  const exportToPDF = (response: ResponseData) => {
    const doc = new jsPDF();

    // Set document title
    doc.setFontSize(20);
    doc.text("Response Report", 20, 30);

    // Add response details
    doc.setFontSize(12);
    let yPosition = 50;

    doc.text(`Response ID: ${response._id}`, 20, yPosition);
    yPosition += 10;

    if (response.respondentName) {
      doc.text(`Respondent: ${response.respondentName}`, 20, yPosition);
      yPosition += 10;
    }

    if (response.respondentEmail) {
      doc.text(`Email: ${response.respondentEmail}`, 20, yPosition);
      yPosition += 10;
    }

    if (response.totalScore !== undefined) {
      doc.text(`Total Score: ${response.totalScore}`, 20, yPosition);
      yPosition += 10;
    }

    doc.text(`Status: ${response.completionStatus || "N/A"}`, 20, yPosition);
    yPosition += 10;

    if (response.submittedAt) {
      doc.text(`Submitted: ${formatDate(response.submittedAt)}`, 20, yPosition);
      yPosition += 20;
    }

    // Add responses section
    doc.setFontSize(14);
    doc.text("Responses:", 20, yPosition);
    yPosition += 15;

    doc.setFontSize(10);
    response.responseset?.forEach((item, index) => {
      if (yPosition > 270) {
        // Start new page if needed
        doc.addPage();
        yPosition = 30;
      }

      doc.text(`Q${index + 1}:`, 20, yPosition);

      // Handle different response types
      let responseText = "";
      if (Array.isArray(item.response)) {
        responseText = item.response.join(", ");
      } else {
        responseText = String(item.response);
      }

      // Wrap long text
      const splitText = doc.splitTextToSize(responseText, 150);
      doc.text(splitText, 35, yPosition);
      yPosition += splitText.length * 5 + 5;

      if (item.score !== undefined) {
        doc.text(`Score: ${item.score}`, 35, yPosition);
        yPosition += 10;
      }
    });

    // Save the PDF
    const fileName = `response_${response._id.slice(-6)}.pdf`;
    doc.save(fileName);
  };

  const handleSingleDelete = (response: ResponseData) => {
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
            onClick={onBulkDeleteOpen}
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
          {isQuizForm ? <TableColumn>SCORE</TableColumn> : <></>}
          <TableColumn>STATUS</TableColumn>
          <TableColumn>SUBMITTED</TableColumn>
          <TableColumn>ACTIONS</TableColumn>
        </TableHeader>
        <TableBody emptyContent="No responses found">
          {responses.map((response) => (
            <TableRow key={response._id}>
              <TableCell>
                {response.respondentName || response.guest?.name || "Anonymous"}
              </TableCell>
              <TableCell>
                {response.respondentEmail || response.guest?.email || "N/A"}
              </TableCell>
              {isQuizForm ? (
                <TableCell>
                  {response.totalScore !== undefined
                    ? response.totalScore
                    : "N/A"}
                </TableCell>
              ) : (
                <></>
              )}
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
                      onClick={() => onViewResponse(response)}
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
                        onClick={() => onEditScore(response)}
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
                      onClick={() => exportToPDF(response)}
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
                      onClick={() => handleSingleDelete(response)}
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

      {/* Single Delete Confirmation Modal */}
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
                  {deleteItem.respondentName ||
                    deleteItem.guest?.name ||
                    "Anonymous"}
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

      {/* Bulk Delete Confirmation Modal */}
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
