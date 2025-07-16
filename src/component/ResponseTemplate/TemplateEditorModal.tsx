import React, { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
  Textarea,
} from "@heroui/react";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { ResponseTemplate, TemplateField } from "./ResponseTemplateSystem";

interface TemplateEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  template?: ResponseTemplate;
  onSave: (template: ResponseTemplate) => void;
}

const TemplateEditorModal: React.FC<TemplateEditorModalProps> = ({
  isOpen,
  onClose,
  template,
  onSave,
}) => {
  const [editedTemplate, setEditedTemplate] = useState<ResponseTemplate>(
    template || {
      id: "",
      name: "",
      description: "",
      type: "custom",
      category: "business",
      fields: [],
      settings: {
        allowMultipleResponses: false,
        requireAuthentication: false,
        showProgressBar: true,
        randomizeQuestions: false,
        enableSaveAndContinue: false,
        successMessage: "Thank you for your response!",
        emailNotifications: false,
      },
      isPublic: false,
      createdBy: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0,
      tags: [],
    }
  );

  const templateTypes = [
    { key: "survey", label: "Survey" },
    { key: "quiz", label: "Quiz" },
    { key: "feedback", label: "Feedback" },
    { key: "assessment", label: "Assessment" },
    { key: "registration", label: "Registration" },
    { key: "custom", label: "Custom" },
  ];

  const fieldTypes = [
    { key: "text", label: "Text" },
    { key: "textarea", label: "Textarea" },
    { key: "select", label: "Select" },
    { key: "radio", label: "Radio" },
    { key: "checkbox", label: "Checkbox" },
    { key: "number", label: "Number" },
    { key: "date", label: "Date" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "rating", label: "Rating" },
  ];

  const handleSave = () => {
    onSave(editedTemplate);
    onClose();
  };

  const addField = () => {
    const newField: TemplateField = {
      id: `field_${Date.now()}`,
      type: "text",
      label: "New Field",
      required: false,
    };

    setEditedTemplate((prev) => ({
      ...prev,
      fields: [...prev.fields, newField],
    }));
  };

  const updateField = (index: number, field: Partial<TemplateField>) => {
    setEditedTemplate((prev) => ({
      ...prev,
      fields: prev.fields.map((f, i) => (i === index ? { ...f, ...field } : f)),
    }));
  };

  const removeField = (index: number) => {
    setEditedTemplate((prev) => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index),
    }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="3xl"
      scrollBehavior="inside"
      isDismissable={false}
    >
      <ModalContent>
        <ModalHeader>
          {template?.id ? "Edit Template" : "Create New Template"}
        </ModalHeader>
        <ModalBody>
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <Input
                label="Template Name"
                value={editedTemplate.name}
                onValueChange={(value) =>
                  setEditedTemplate((prev) => ({ ...prev, name: value }))
                }
                placeholder="Enter template name"
                isRequired
              />

              <Textarea
                label="Description"
                value={editedTemplate.description}
                onValueChange={(value) =>
                  setEditedTemplate((prev) => ({ ...prev, description: value }))
                }
                placeholder="Enter template description"
                isRequired
              />

              <div className="flex gap-4">
                <Select
                  label="Type"
                  selectedKeys={[editedTemplate.type]}
                  onSelectionChange={(keys) =>
                    setEditedTemplate((prev) => ({
                      ...prev,
                      type: Array.from(keys)[0] as ResponseTemplate["type"],
                    }))
                  }
                >
                  {templateTypes.map((type) => (
                    <SelectItem key={type.key}>{type.label}</SelectItem>
                  ))}
                </Select>

                <Input
                  label="Category"
                  value={editedTemplate.category}
                  onValueChange={(value) =>
                    setEditedTemplate((prev) => ({ ...prev, category: value }))
                  }
                  placeholder="Enter category"
                />
              </div>
            </div>

            {/* Fields */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Fields</h3>
                <Button
                  size="sm"
                  color="primary"
                  startContent={<PlusIcon className="w-4 h-4" />}
                  onPress={addField}
                >
                  Add Field
                </Button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {editedTemplate.fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <Input
                        size="sm"
                        label="Field Label"
                        value={field.label}
                        onValueChange={(value) =>
                          updateField(index, { label: value })
                        }
                        className="max-w-xs"
                      />
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="danger"
                        onPress={() => removeField(index)}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="flex gap-4">
                      <Select
                        size="sm"
                        label="Field Type"
                        selectedKeys={[field.type]}
                        onSelectionChange={(keys) =>
                          updateField(index, {
                            type: Array.from(keys)[0] as TemplateField["type"],
                          })
                        }
                        className="max-w-xs"
                      >
                        {fieldTypes.map((type) => (
                          <SelectItem key={type.key}>{type.label}</SelectItem>
                        ))}
                      </Select>

                      <Input
                        size="sm"
                        label="Placeholder"
                        value={field.placeholder || ""}
                        onValueChange={(value) =>
                          updateField(index, { placeholder: value })
                        }
                        className="max-w-xs"
                      />

                      <div className="flex items-center gap-2">
                        <label className="text-sm">Required</label>
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) =>
                            updateField(index, { required: e.target.checked })
                          }
                          className="w-4 h-4"
                          title="Mark field as required"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Settings</h3>

              <Textarea
                label="Success Message"
                value={editedTemplate.settings.successMessage}
                onValueChange={(value) =>
                  setEditedTemplate((prev) => ({
                    ...prev,
                    settings: { ...prev.settings, successMessage: value },
                  }))
                }
                placeholder="Thank you for your response!"
                rows={2}
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editedTemplate.settings.allowMultipleResponses}
                    onChange={(e) =>
                      setEditedTemplate((prev) => ({
                        ...prev,
                        settings: {
                          ...prev.settings,
                          allowMultipleResponses: e.target.checked,
                        },
                      }))
                    }
                    className="w-4 h-4"
                    title="Allow multiple responses"
                  />
                  <label className="text-sm">Allow Multiple Responses</label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editedTemplate.settings.requireAuthentication}
                    onChange={(e) =>
                      setEditedTemplate((prev) => ({
                        ...prev,
                        settings: {
                          ...prev.settings,
                          requireAuthentication: e.target.checked,
                        },
                      }))
                    }
                    className="w-4 h-4"
                    title="Require authentication"
                  />
                  <label className="text-sm">Require Authentication</label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editedTemplate.settings.showProgressBar}
                    onChange={(e) =>
                      setEditedTemplate((prev) => ({
                        ...prev,
                        settings: {
                          ...prev.settings,
                          showProgressBar: e.target.checked,
                        },
                      }))
                    }
                    className="w-4 h-4"
                    title="Show progress bar"
                  />
                  <label className="text-sm">Show Progress Bar</label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editedTemplate.settings.emailNotifications}
                    onChange={(e) =>
                      setEditedTemplate((prev) => ({
                        ...prev,
                        settings: {
                          ...prev.settings,
                          emailNotifications: e.target.checked,
                        },
                      }))
                    }
                    className="w-4 h-4"
                    title="Email notifications"
                  />
                  <label className="text-sm">Email Notifications</label>
                </div>
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button
            color="primary"
            onPress={handleSave}
            isDisabled={!editedTemplate.name || !editedTemplate.description}
          >
            {template?.id ? "Update" : "Create"} Template
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default TemplateEditorModal;
