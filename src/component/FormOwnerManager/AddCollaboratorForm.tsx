import React from "react";
import { Button } from "@heroui/react";
import Selection from "../FormComponent/Selection";
import { SelectionType } from "../../types/Global.types";
import { CollaboratorType } from "../../types/Form.types";
import { AddUserIcon, CloseIcon } from "./Icons";

interface AddCollaboratorFormProps {
  newOwnerEmail: string;
  setNewOwnerEmail: (email: string) => void;
  selectedRole?: CollaboratorType;
  onSelectRole: (role: CollaboratorType) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  isLoading: boolean;
  isCreator?: boolean;
}

const collaboratorTypeSelection = (
  isCreator?: boolean
): Array<SelectionType<CollaboratorType>> => {
  const options: Array<SelectionType<CollaboratorType>> = [
    {
      label: "Owner",
      value: CollaboratorType.owner,
      description: "Can edit form, manage collaborators, and view responses",
    },
    {
      label: "Editor",
      value: CollaboratorType.editor,
      description: "Can edit form content and view responses",
    },
  ];

  return !isCreator
    ? options.filter((opt) => opt.value === CollaboratorType.editor)
    : options;
};

export const AddCollaboratorForm: React.FC<AddCollaboratorFormProps> = ({
  newOwnerEmail,
  setNewOwnerEmail,
  selectedRole,
  onSelectRole,
  onSubmit,
  onClose,
  isLoading,
  isCreator,
}) => (
  <div className="Add_container space-y-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-lg">
          <AddUserIcon className="w-5 h-5 text-primary" />
        </div>
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
          Add New Collaborator
        </h4>
      </div>
      <Button
        size="sm"
        variant="light"
        isIconOnly
        onPress={onClose}
        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
      >
        <CloseIcon className="w-5 h-5" />
      </Button>
    </div>

    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
        >
          Email Address
        </label>
        <input
          id="email"
          type="email"
          value={newOwnerEmail}
          onChange={(e) => setNewOwnerEmail(e.target.value)}
          placeholder="colleague@example.com"
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all shadow-sm hover:border-gray-400 dark:hover:border-gray-500"
          required
          disabled={isLoading}
        />
        <Selection
          items={collaboratorTypeSelection(isCreator)}
          selectedKeys={selectedRole ? [selectedRole] : []}
          onSelectionChange={(val) =>
            onSelectRole(val.currentKey as CollaboratorType)
          }
          aria-label="Select Collaborator Role"
          className="w-full"
          label="Role"
          variant="flat"
        />
      </div>

      <div className="flex gap-3">
        <Button
          type="submit"
          color="primary"
          isDisabled={isLoading || !newOwnerEmail.trim()}
          className="flex-1"
        >
          {isLoading ? "Adding..." : "Add Collaborator"}
        </Button>
        <Button
          type="button"
          variant="bordered"
          onPress={onClose}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </div>
    </form>
  </div>
);

export default AddCollaboratorForm;
