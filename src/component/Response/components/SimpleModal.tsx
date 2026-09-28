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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      classNames={{
        base: "m-3 sm:m-auto max-w-md w-full",
      }}
    >
      <ModalContent className="dark:bg-gray-800">
        <ModalHeader className="dark:text-gray-100 text-lg sm:text-xl font-bold px-4 sm:px-6 pt-5 sm:pt-6">
          {title}
        </ModalHeader>
        <ModalBody className="px-4 sm:px-6 py-4">{children}</ModalBody>
        <ModalFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-3 px-4 sm:px-6 pb-5 sm:pb-6">
          <Button
            variant="light"
            onPress={onClose}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          {onConfirm && (
            <Button
              color={confirmColor}
              isLoading={isLoading}
              disabled={isLoading}
              onPress={onConfirm}
              className="w-full sm:w-auto"
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
              onKeyDown={(e) => {
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

// Batch Score Edit Modal Component
interface BatchScoreEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  onConfirm: (newScore: number) => void;
  isLoading: boolean;
}

export const BatchScoreEditModal: React.FC<BatchScoreEditModalProps> = ({
  isOpen,
  onClose,
  selectedCount,
  onConfirm,
  isLoading,
}) => {
  const [newScore, setNewScore] = React.useState("");

  const handleConfirm = () => {
    onConfirm(parseInt(newScore) || 0);
    setNewScore("");
  };

  return (
    <SimpleModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Batch Update Scores (${selectedCount} selected)`}
      onConfirm={handleConfirm}
      confirmText="Update All Scores"
      isLoading={isLoading}
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Apply a new overall score to all {selectedCount} selected responses.
        </p>
        <div>
          <label className="block text-sm font-medium mb-2">
            New Overall Score
          </label>
          <Input
            type="number"
            placeholder="Enter new score"
            value={newScore}
            onChange={(e) => setNewScore(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleConfirm();
              }
            }}
            min={0}
          />
        </div>
      </div>
    </SimpleModal>
  );
};

export default SimpleModal;
