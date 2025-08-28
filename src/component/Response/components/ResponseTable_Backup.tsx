import React, { useState } from "react";
import {
  Table,
  Ta  const exportToPDF = (response: ResponseData) => {
    const doc = new jsPDF();
    
    // Set document title
    doc.setFontSize(20);
    doc.text('Response Report', 20, 30);
    
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
    
    doc.text(`Status: ${response.completionStatus || 'N/A'}`, 20, yPosition);
    yPosition += 10;
    
    if (response.submittedAt) {
      doc.text(`Submitted: ${formatDate(response.submittedAt)}`, 20, yPosition);
      yPosition += 20;
    }
    
    // Add responses section
    doc.setFontSize(14);
    doc.text('Responses:', 20, yPosition);
    yPosition += 15;
    
    doc.setFontSize(10);
    response.responseset?.forEach((item, index) => {
      if (yPosition > 270) { // Start new page if needed
        doc.addPage();
        yPosition = 30;
      }
      
      doc.text(`Q${index + 1}:`, 20, yPosition);
      
      // Handle different response types
      let responseText = '';
      if (Array.isArray(item.response)) {
        responseText = item.response.join(', ');
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

  const ResponseTable: React.FC<ResponseTableProps> = ({leHeader,
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
} from "@heroui/react";
import { FiEye, FiEdit3, FiDownload, FiTrash2, FiAlertTriangle } from "react-icons/fi";
import jsPDF from 'jspdf';

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
  onDeleteResponse: (responseId: string) => void;
  onBulkDelete: (responseIds: string[]) => void;
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
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set([]));
  const [responseToDelete, setResponseToDelete] = useState<ResponseData | null>(
    null
  );
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

  const handleSingleDelete = (response: ResponseData) => {
    setResponseToDelete(response);
    onDeleteOpen();
  };

  const confirmSingleDelete = () => {
    if (responseToDelete) {
      onDeleteResponse(responseToDelete._id);
      onDeleteClose();
      setResponseToDelete(null);
    }
  };

  const handleBulkDelete = () => {
    if (selectedKeys.size > 0) {
      onBulkDeleteOpen();
    }
  };

  const confirmBulkDelete = () => {
    const responseIds = Array.from(selectedKeys);
    onBulkDelete(responseIds);
    onBulkDeleteClose();
    setSelectedKeys(new Set([]));
  };

  const selectedCount = selectedKeys.size;
  return (
    <div className="space-y-4">
      {/* Bulk Actions Header */}
      {selectedCount > 0 && (
        <div className="flex items-center justify-between p-4 bg-danger-50 border border-danger-200 rounded-lg">
          <span className="text-danger-700 font-medium">
            {selectedCount} response{selectedCount > 1 ? "s" : ""} selected
          </span>
          <Button
            color="danger"
            variant="flat"
            startContent={<FiTrash2 />}
            onClick={handleBulkDelete}
            size="sm"
          >
            Delete Selected
          </Button>
        </div>
      )}

      <Table
        aria-label="Responses table"
        selectionMode="multiple"
        selectedKeys={selectedKeys}
        onSelectionChange={(keys) => {
          if (keys === "all") {
            setSelectedKeys(new Set(responses.map((r) => r._id)));
          } else {
            setSelectedKeys(new Set(Array.from(keys) as string[]));
          }
        }}
      >
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
          items={responses}
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
                {response.respondentName || response.guest?.name || "Anonymous"}
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
                  color={getStatusColor(response.completionStatus || "default")}
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
                      onClick={() => onViewResponse(response)}
                    >
                      <FiEye />
                    </Button>
                  </Tooltip>
                  {isQuizForm && (
                    <Tooltip content="Edit Overall Score">
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
                      onClick={() => {
                        // TODO: Implement PDF export
                        alert("PDF export coming soon!");
                      }}
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
          )}
        </TableBody>
      </Table>

      {/* Single Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
        <ModalContent>
          <ModalHeader className="flex items-center gap-2">
            <FiAlertTriangle className="text-danger" />
            Confirm Delete
          </ModalHeader>
          <ModalBody>
            <p>
              Are you sure you want to delete the response from{" "}
              <strong>
                {responseToDelete?.respondentName ||
                  responseToDelete?.guest?.name ||
                  "Anonymous"}
              </strong>
              ?
            </p>
            <p className="text-sm text-danger-600 mt-2">
              This action cannot be undone.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onClick={onDeleteClose}>
              Cancel
            </Button>
            <Button color="danger" onClick={confirmSingleDelete}>
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Bulk Delete Confirmation Modal */}
      <Modal isOpen={isBulkDeleteOpen} onClose={onBulkDeleteClose}>
        <ModalContent>
          <ModalHeader className="flex items-center gap-2">
            <FiAlertTriangle className="text-danger" />
            Confirm Bulk Delete
          </ModalHeader>
          <ModalBody>
            <p>
              Are you sure you want to delete <strong>{selectedCount}</strong>{" "}
              selected response{selectedCount > 1 ? "s" : ""}?
            </p>
            <p className="text-sm text-danger-600 mt-2">
              This action cannot be undone.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onClick={onBulkDeleteClose}>
              Cancel
            </Button>
            <Button color="danger" onClick={confirmBulkDelete}>
              Delete {selectedCount} Response{selectedCount > 1 ? "s" : ""}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default ResponseTable;
