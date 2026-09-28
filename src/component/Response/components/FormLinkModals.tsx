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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      classNames={{
        base: "m-3 sm:m-auto max-w-md w-full",
      }}
    >
      <ModalContent className="dark:bg-gray-800">
        <ModalHeader className="dark:text-gray-100 text-lg sm:text-xl font-bold px-4 sm:px-6 pt-5 sm:pt-6">
          Send Form Links
        </ModalHeader>
        <ModalBody className="px-4 sm:px-6 py-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                Email Addresses (comma-separated)
              </label>
              <textarea
                className="w-full p-3 border dark:border-gray-600 rounded-lg h-24 dark:bg-gray-700 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="email1@example.com, email2@example.com"
                value={emailList}
                onChange={(e) => setEmailList(e.target.value)}
              />
            </div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Form: <span className="font-semibold text-gray-900 dark:text-gray-200">{formTitle}</span>
            </div>
          </div>
        </ModalBody>
        <ModalFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-3 px-4 sm:px-6 pb-5 sm:pb-6">
          <Button variant="light" onPress={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button
            color="primary"
            onPress={onSend}
            isLoading={isPending}
            disabled={isPending}
            className="w-full sm:w-auto"
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      classNames={{
        base: "m-3 sm:m-auto max-w-lg w-full",
      }}
    >
      <ModalContent className="dark:bg-gray-800">
        <ModalHeader className="dark:text-gray-100 text-lg sm:text-xl font-bold px-4 sm:px-6 pt-5 sm:pt-6">
          Generated Form Link
        </ModalHeader>
        <ModalBody className="px-4 sm:px-6 py-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                Shareable Link
              </label>
              <div className="flex gap-2 items-center">
                <Input
                  value={generatedLink}
                  readOnly
                  className="flex-1 min-w-0"
                  size="md"
                />
                <Button color="primary" onPress={onCopy} className="flex-shrink-0">
                  Copy
                </Button>
              </div>
            </div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              This link can be shared with anyone to access the form.
            </div>
          </div>
        </ModalBody>
        <ModalFooter className="px-4 sm:px-6 pb-5 sm:pb-6">
          <Button onPress={onClose} variant="light" className="w-full sm:w-auto">
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
