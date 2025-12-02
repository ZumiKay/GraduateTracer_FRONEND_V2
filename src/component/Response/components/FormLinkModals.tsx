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

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  emailList: string;
  setEmailList: (value: string) => void;
  onSend: () => void;
  formTitle: string;
  isPending: boolean;
}

export const EmailModal: React.FC<EmailModalProps> = ({
  isOpen,
  onClose,
  emailList,
  setEmailList,
  onSend,
  formTitle,
  isPending,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent className="dark:bg-gray-800">
        <ModalHeader className="dark:text-gray-100">
          Send Form Links
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                Email Addresses (comma-separated)
              </label>
              <textarea
                className="w-full p-2 border dark:border-gray-600 rounded-md h-24 dark:bg-gray-700 dark:text-gray-200"
                placeholder="email1@example.com, email2@example.com"
                value={emailList}
                onChange={(e) => setEmailList(e.target.value)}
              />
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Form: {formTitle}
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button
            color="primary"
            onPress={onSend}
            isLoading={isPending}
            disabled={isPending}
          >
            {isPending ? <Spinner size="sm" /> : "Send Links"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

interface LinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  generatedLink: string;
  onCopy: () => void;
}

export const LinkModal: React.FC<LinkModalProps> = ({
  isOpen,
  onClose,
  generatedLink,
  onCopy,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent className="dark:bg-gray-800">
        <ModalHeader className="dark:text-gray-100">
          Generated Form Link
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                Shareable Link
              </label>
              <div className="flex gap-2">
                <Input value={generatedLink} readOnly className="flex-1" />
                <Button onPress={onCopy}>Copy</Button>
              </div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              This link can be shared with anyone to access the form.
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button onPress={onClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
