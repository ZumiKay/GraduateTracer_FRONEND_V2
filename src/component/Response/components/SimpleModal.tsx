import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Spinner,
} from "@heroui/react";
import { getResponseDisplayName } from "../../../utils/respondentUtils";

interface SimpleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onConfirm?: () => void;
  confirmText?: string;
  isLoading?: boolean;
  confirmColor?: "primary" | "secondary" | "success" | "warning" | "danger";
}

const SimpleModal: React.FC<SimpleModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  onConfirm,
  confirmText = "Confirm",
  isLoading = false,
  confirmColor = "primary",
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>{title}</ModalHeader>
        <ModalBody>{children}</ModalBody>
        <ModalFooter>
          <Button variant="light" onClick={onClose}>
            Cancel
          </Button>
          {onConfirm && (
            <Button
              color={confirmColor}
              isLoading={isLoading}
              disabled={isLoading}
              onClick={onConfirm}
            >
              {isLoading ? <Spinner size="sm" /> : confirmText}
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

// Score Edit Modal Component
interface ScoreEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedResponse: {
    _id: string;
    respondentName?: string;
    totalScore?: number;
  } | null;
  onUpdateScore: (responseId: string, newScore: number) => void;
  isLoading: boolean;
}

export const ScoreEditModal: React.FC<ScoreEditModalProps> = ({
  isOpen,
  onClose,
  selectedResponse,
  onUpdateScore,
  isLoading,
}) => {
  const [newScore, setNewScore] = React.useState("");

  React.useEffect(() => {
    if (selectedResponse) {
      setNewScore((selectedResponse.totalScore || 0).toString());
    }
  }, [selectedResponse]);

  const handleConfirm = () => {
    if (selectedResponse) {
      onUpdateScore(selectedResponse._id, parseInt(newScore) || 0);
    }
  };

  return (
    <SimpleModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Overall Score"
      onConfirm={handleConfirm}
      confirmText="Update Score"
      isLoading={isLoading}
    >
      {selectedResponse && (
        <div className="space-y-4">
          <div>
            <strong>Respondent:</strong>{" "}
            {getResponseDisplayName(selectedResponse)}
          </div>
          <div>
            <strong>Current Score:</strong> {selectedResponse.totalScore || 0}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              New Overall Score
            </label>
            <Input
              type="number"
              placeholder="Enter new score"
              value={newScore}
              onChange={(e) => setNewScore(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleConfirm();
                }
              }}
            />
          </div>
        </div>
      )}
    </SimpleModal>
  );
};

export default SimpleModal;
