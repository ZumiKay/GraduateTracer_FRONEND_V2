import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Chip,
  useDisclosure,
} from "@heroui/react";
import {
  PlusIcon,
  TrashIcon,
  DocumentDuplicateIcon,
} from "@heroicons/react/24/outline";
import ApiRequest from "../../hooks/ApiHook";
import { ErrorToast } from "../Modal/AlertModal";
import TemplateEditorModal from "./TemplateEditorModal";

export interface ResponseTemplate {
  id: string;
  name: string;
  description: string;
  type:
    | "survey"
    | "quiz"
    | "feedback"
    | "assessment"
    | "registration"
    | "custom";
  category: string;
  fields: TemplateField[];
  settings: TemplateSettings;
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
  tags: string[];
}

export interface TemplateField {
  id: string;
  type:
    | "text"
    | "textarea"
    | "select"
    | "radio"
    | "checkbox"
    | "number"
    | "date"
    | "email"
    | "phone"
    | "file"
    | "rating"
    | "range";
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  defaultValue?: string;
  helpText?: string;
  conditional?: {
    dependsOn: string;
    condition:
      | "equals"
      | "not_equals"
      | "contains"
      | "greater_than"
      | "less_than";
    value: string;
  };
}

export interface TemplateSettings {
  allowMultipleResponses: boolean;
  requireAuthentication: boolean;
  showProgressBar: boolean;
  randomizeQuestions: boolean;
  enableSaveAndContinue: boolean;
  customCSS?: string;
  successMessage: string;
  redirectUrl?: string;
  emailNotifications: boolean;
  responseLimit?: number;
  expirationDate?: string;
}

interface ResponseTemplateSystemProps {
  onTemplateSelect?: (template: ResponseTemplate) => void;
  selectedTemplate?: ResponseTemplate;
}

const ResponseTemplateSystem: React.FC<ResponseTemplateSystemProps> = ({
  onTemplateSelect,
  selectedTemplate,
}) => {
  const [templates, setTemplates] = useState<ResponseTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<
    ResponseTemplate[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [editingTemplate, setEditingTemplate] =
    useState<ResponseTemplate | null>(null);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const categories = [
    "all",
    "business",
    "education",
    "healthcare",
    "technology",
    "marketing",
    "research",
    "events",
    "hr",
    "customer-service",
  ];

  const templateTypes = [
    "all",
    "survey",
    "quiz",
    "feedback",
    "assessment",
    "registration",
    "custom",
  ];

  const filterTemplates = useCallback(() => {
    let filtered = templates;

    if (searchTerm) {
      filtered = filtered.filter(
        (template) =>
          template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          template.description
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          template.tags.some((tag) =>
            tag.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (template) => template.category === selectedCategory
      );
    }

    if (selectedType !== "all") {
      filtered = filtered.filter((template) => template.type === selectedType);
    }

    setFilteredTemplates(filtered);
  }, [templates, searchTerm, selectedCategory, selectedType]);

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [filterTemplates]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await ApiRequest({
        url: "/api/response-templates",
        method: "GET",
        cookie: true,
      });

      if (response.success) {
        const data = response.data as { templates: ResponseTemplate[] };
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error);
      ErrorToast({ title: "Error", content: "Failed to load templates" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = () => {
    const newTemplate: ResponseTemplate = {
      id: "",
      name: "New Template",
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
    };

    setEditingTemplate(newTemplate);
    onOpen();
  };

  const handleEditTemplate = (template: ResponseTemplate) => {
    setEditingTemplate({ ...template });
    onOpen();
  };

  const handleSaveTemplate = async (template: ResponseTemplate) => {
    try {
      const url = template.id
        ? `/api/response-templates/${template.id}`
        : "/api/response-templates";
      const method = template.id ? "PUT" : "POST";

      const response = await ApiRequest({
        url,
        method,
        cookie: true,
        data: template as unknown as Record<string, unknown>,
      });

      if (response.success) {
        console.log("Template saved successfully");
        fetchTemplates();
        setEditingTemplate(null);
      }
    } catch (error) {
      console.error("Failed to save template:", error);
      ErrorToast({ title: "Error", content: "Failed to save template" });
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    console.log("Deleting template:", templateId);
    // In a real implementation, you would call the API to delete the template
  };

  const handleDuplicateTemplate = (template: ResponseTemplate) => {
    const duplicatedTemplate = {
      ...template,
      id: "",
      name: `${template.name} (Copy)`,
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log("Duplicating template:", duplicatedTemplate);
    // In a real implementation, you would open the template editor
    // with the duplicated template
  };

  const getTypeColor = (
    type: string
  ): "primary" | "secondary" | "success" | "warning" | "danger" | "default" => {
    switch (type) {
      case "survey":
        return "primary";
      case "quiz":
        return "secondary";
      case "feedback":
        return "success";
      case "assessment":
        return "warning";
      case "registration":
        return "danger";
      default:
        return "default";
    }
  };

  return (
    <div className="response-template-system p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Response Templates</h1>
        <Button
          color="primary"
          startContent={<PlusIcon className="w-4 h-4" />}
          onPress={handleCreateTemplate}
        >
          Create Template
        </Button>
      </div>

      {/* Filters */}
      <div className="filters mb-6 flex flex-wrap gap-4">
        <Input
          placeholder="Search templates..."
          value={searchTerm}
          onValueChange={setSearchTerm}
          className="max-w-xs"
        />

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border rounded-md"
          aria-label="Select category"
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </option>
          ))}
        </select>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-3 py-2 border rounded-md"
          aria-label="Select type"
        >
          {templateTypes.map((type) => (
            <option key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Templates Grid */}
      <div className="templates-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            No templates found matching your criteria
          </div>
        ) : (
          filteredTemplates.map((template) => (
            <Card
              key={template.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedTemplate?.id === template.id
                  ? "ring-2 ring-blue-500"
                  : ""
              }`}
              isPressable
              onPress={() => onTemplateSelect?.(template)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start w-full">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{template.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {template.description}
                    </p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => handleEditTemplate(template)}
                    >
                      <DocumentDuplicateIcon className="w-4 h-4" />
                    </Button>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => handleDuplicateTemplate(template)}
                    >
                      <DocumentDuplicateIcon className="w-4 h-4" />
                    </Button>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color="danger"
                      onPress={() => handleDeleteTemplate(template.id)}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardBody className="pt-0">
                <div className="flex flex-wrap gap-2 mb-3">
                  <Chip
                    size="sm"
                    color={getTypeColor(template.type)}
                    variant="flat"
                  >
                    {template.type}
                  </Chip>
                  <Chip size="sm" variant="flat" color="default">
                    {template.category}
                  </Chip>
                </div>

                <div className="text-sm text-gray-600 mb-2">
                  {template.fields.length} fields • Used {template.usageCount}{" "}
                  times
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  {template.tags.slice(0, 3).map((tag, index) => (
                    <Chip
                      key={index}
                      size="sm"
                      variant="bordered"
                      className="text-xs"
                    >
                      {tag}
                    </Chip>
                  ))}
                  {template.tags.length > 3 && (
                    <Chip size="sm" variant="bordered" className="text-xs">
                      +{template.tags.length - 3}
                    </Chip>
                  )}
                </div>

                <div className="text-xs text-gray-500">
                  Created: {new Date(template.createdAt).toLocaleDateString()}
                </div>
              </CardBody>
            </Card>
          ))
        )}
      </div>

      {/* Template Editor Modal */}
      <TemplateEditorModal
        isOpen={isOpen}
        onClose={() => {
          onOpenChange();
          setEditingTemplate(null);
        }}
        template={editingTemplate || undefined}
        onSave={handleSaveTemplate}
      />
    </div>
  );
};

export default ResponseTemplateSystem;
