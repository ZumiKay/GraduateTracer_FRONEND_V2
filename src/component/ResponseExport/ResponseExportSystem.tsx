import React, { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Select,
  SelectItem,
  Input,
  Chip,
  Progress,
} from "@heroui/react";
import {
  ArrowDownTrayIcon,
  DocumentArrowDownIcon,
  TableCellsIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import ApiRequest from "../../hooks/ApiHook";
import { ErrorToast } from "../Modal/AlertModal";

export interface ExportConfig {
  format: "csv" | "excel" | "json" | "pdf";
  includeHeaders: boolean;
  includeMetadata: boolean;
  dateFormat: "iso" | "local" | "timestamp";
  columns: string[];
  filters: ExportFilter[];
  groupBy?: string;
  sortBy?: string;
  sortOrder: "asc" | "desc";
  customName?: string;
  schedule?: ExportSchedule;
}

export interface ExportFilter {
  field: string;
  operator:
    | "equals"
    | "not_equals"
    | "contains"
    | "starts_with"
    | "ends_with"
    | "greater_than"
    | "less_than"
    | "between"
    | "in";
  value: string | string[];
  label: string;
}

export interface ExportSchedule {
  enabled: boolean;
  frequency: "daily" | "weekly" | "monthly";
  time: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  recipients: string[];
}

export interface ExportJob {
  id: string;
  formId: string;
  formName: string;
  config: ExportConfig;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  createdAt: string;
  completedAt?: string;
  downloadUrl?: string;
  error?: string;
  recordCount?: number;
  fileSize?: number;
}

interface ResponseExportSystemProps {
  formId?: string;
  formName?: string;
  onExportComplete?: (job: ExportJob) => void;
}

const ResponseExportSystem: React.FC<ResponseExportSystemProps> = ({
  formId,
  formName,
  onExportComplete,
}) => {
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    format: "csv",
    includeHeaders: true,
    includeMetadata: false,
    dateFormat: "local",
    columns: [],
    filters: [],
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState<number | null>(null);

  const exportFormats = [
    {
      key: "csv",
      label: "CSV",
      icon: TableCellsIcon,
      description: "Comma-separated values",
    },
    {
      key: "excel",
      label: "Excel",
      icon: DocumentArrowDownIcon,
      description: "Microsoft Excel format",
    },
    {
      key: "json",
      label: "JSON",
      icon: DocumentTextIcon,
      description: "JavaScript Object Notation",
    },
    {
      key: "pdf",
      label: "PDF",
      icon: DocumentArrowDownIcon,
      description: "Portable Document Format",
    },
  ];

  const dateFormats = [
    { key: "iso", label: "ISO 8601 (2023-12-25T10:30:00Z)" },
    { key: "local", label: "Local Format (Dec 25, 2023 10:30 AM)" },
    { key: "timestamp", label: "Unix Timestamp (1703505000)" },
  ];

  const filterOperators = [
    { key: "equals", label: "Equals" },
    { key: "not_equals", label: "Not Equals" },
    { key: "contains", label: "Contains" },
    { key: "starts_with", label: "Starts With" },
    { key: "ends_with", label: "Ends With" },
    { key: "greater_than", label: "Greater Than" },
    { key: "less_than", label: "Less Than" },
    { key: "between", label: "Between" },
    { key: "in", label: "In List" },
  ];

  const fetchAvailableColumns = async () => {
    if (!formId) return;

    try {
      const response = await ApiRequest({
        url: `/api/forms/${formId}/columns`,
        method: "GET",
        cookie: true,
      });

      if (response.success) {
        const data = response.data as { columns: string[] };
        setAvailableColumns(data.columns || []);
        setExportConfig((prev) => ({
          ...prev,
          columns: data.columns || [],
        }));
      }
    } catch (error) {
      console.error("Failed to fetch available columns:", error);
    }
  };

  const fetchExportJobs = async () => {
    if (!formId) return;

    try {
      const response = await ApiRequest({
        url: `/api/forms/${formId}/exports`,
        method: "GET",
        cookie: true,
      });

      if (response.success) {
        const data = response.data as { jobs: ExportJob[] };
        setExportJobs(data.jobs || []);
      }
    } catch (error) {
      console.error("Failed to fetch export jobs:", error);
    }
  };

  useEffect(() => {
    if (formId) {
      fetchAvailableColumns();
      fetchExportJobs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formId]);

  useEffect(() => {
    return () => {
      if (polling) {
        clearInterval(polling);
      }
    };
  }, [polling]);

  const startExport = async () => {
    if (!formId) return;

    try {
      setLoading(true);
      const response = await ApiRequest({
        url: `/api/forms/${formId}/exports`,
        method: "POST",
        cookie: true,
        data: exportConfig as unknown as Record<string, unknown>,
      });

      if (response.success) {
        const data = response.data as { job: ExportJob };
        const newJob = data.job;

        setExportJobs((prev) => [newJob, ...prev]);

        // Start polling for job status
        const pollInterval = setInterval(async () => {
          try {
            const statusResponse = await ApiRequest({
              url: `/api/forms/${formId}/exports/${newJob.id}`,
              method: "GET",
              cookie: true,
            });

            if (statusResponse.success) {
              const statusData = statusResponse.data as { job: ExportJob };
              const updatedJob = statusData.job;

              setExportJobs((prev) =>
                prev.map((job) => (job.id === newJob.id ? updatedJob : job))
              );

              if (
                updatedJob.status === "completed" ||
                updatedJob.status === "failed"
              ) {
                clearInterval(pollInterval);
                setPolling(null);

                if (updatedJob.status === "completed") {
                  onExportComplete?.(updatedJob);
                }
              }
            }
          } catch (error) {
            console.error("Failed to check export status:", error);
          }
        }, 2000);

        setPolling(pollInterval);
      }
    } catch (error) {
      console.error("Failed to start export:", error);
      ErrorToast({ title: "Error", content: "Failed to start export" });
    } finally {
      setLoading(false);
    }
  };

  const downloadExport = (job: ExportJob) => {
    if (job.downloadUrl) {
      window.open(job.downloadUrl, "_blank");
    }
  };

  const addFilter = () => {
    const newFilter: ExportFilter = {
      field: availableColumns[0] || "",
      operator: "equals",
      value: "",
      label: "New Filter",
    };

    setExportConfig((prev) => ({
      ...prev,
      filters: [...prev.filters, newFilter],
    }));
  };

  const updateFilter = (index: number, filter: Partial<ExportFilter>) => {
    setExportConfig((prev) => ({
      ...prev,
      filters: prev.filters.map((f, i) =>
        i === index ? { ...f, ...filter } : f
      ),
    }));
  };

  const removeFilter = (index: number) => {
    setExportConfig((prev) => ({
      ...prev,
      filters: prev.filters.filter((_, i) => i !== index),
    }));
  };

  const getStatusColor = (
    status: string
  ): "primary" | "secondary" | "success" | "warning" | "danger" | "default" => {
    switch (status) {
      case "pending":
        return "default";
      case "processing":
        return "primary";
      case "completed":
        return "success";
      case "failed":
        return "danger";
      default:
        return "default";
    }
  };

  const getFormatIcon = (format: string) => {
    const formatConfig = exportFormats.find((f) => f.key === format);
    return formatConfig?.icon || DocumentArrowDownIcon;
  };

  const formatFileSize = (bytes: number): string => {
    const sizes = ["Bytes", "KB", "MB", "GB"];
    if (bytes === 0) return "0 Bytes";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="response-export-system p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Response Export</h1>
          {formName && (
            <p className="text-gray-600 mt-1">
              Export responses from: {formName}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Export Configuration */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Export Configuration</h2>
            </CardHeader>
            <CardBody className="space-y-6">
              {/* Format Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Export Format
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {exportFormats.map((format) => {
                    const Icon = format.icon;
                    return (
                      <div
                        key={format.key}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          exportConfig.format === format.key
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() =>
                          setExportConfig((prev) => ({
                            ...prev,
                            format: format.key as ExportConfig["format"],
                          }))
                        }
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="w-5 h-5" />
                          <span className="font-medium">{format.label}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {format.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Column Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Columns to Export
                </label>
                <div className="max-h-40 overflow-y-auto border rounded-lg p-3">
                  <div className="space-y-2">
                    {availableColumns.map((column) => (
                      <div key={column} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={exportConfig.columns.includes(column)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setExportConfig((prev) => ({
                                ...prev,
                                columns: [...prev.columns, column],
                              }));
                            } else {
                              setExportConfig((prev) => ({
                                ...prev,
                                columns: prev.columns.filter(
                                  (c) => c !== column
                                ),
                              }));
                            }
                          }}
                          className="w-4 h-4"
                          title={`Include ${column} column`}
                        />
                        <label className="text-sm">{column}</label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Options */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Export Options
                </label>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={exportConfig.includeHeaders}
                      onChange={(e) =>
                        setExportConfig((prev) => ({
                          ...prev,
                          includeHeaders: e.target.checked,
                        }))
                      }
                      className="w-4 h-4"
                      title="Include headers in export"
                    />
                    <label className="text-sm">Include column headers</label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={exportConfig.includeMetadata}
                      onChange={(e) =>
                        setExportConfig((prev) => ({
                          ...prev,
                          includeMetadata: e.target.checked,
                        }))
                      }
                      className="w-4 h-4"
                      title="Include metadata in export"
                    />
                    <label className="text-sm">
                      Include metadata (timestamps, IDs)
                    </label>
                  </div>
                </div>
              </div>

              {/* Date Format */}
              <div>
                <Select
                  label="Date Format"
                  selectedKeys={[exportConfig.dateFormat]}
                  onSelectionChange={(keys) =>
                    setExportConfig((prev) => ({
                      ...prev,
                      dateFormat: Array.from(
                        keys
                      )[0] as ExportConfig["dateFormat"],
                    }))
                  }
                >
                  {dateFormats.map((format) => (
                    <SelectItem key={format.key}>{format.label}</SelectItem>
                  ))}
                </Select>
              </div>

              {/* Filters */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium">Filters</label>
                  <Button size="sm" variant="light" onPress={addFilter}>
                    Add Filter
                  </Button>
                </div>

                <div className="space-y-2">
                  {exportConfig.filters.map((filter, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <select
                        value={filter.field}
                        onChange={(e) =>
                          updateFilter(index, { field: e.target.value })
                        }
                        className="px-2 py-1 border rounded text-sm"
                        aria-label="Filter field"
                      >
                        {availableColumns.map((column) => (
                          <option key={column} value={column}>
                            {column}
                          </option>
                        ))}
                      </select>

                      <select
                        value={filter.operator}
                        onChange={(e) =>
                          updateFilter(index, {
                            operator: e.target
                              .value as ExportFilter["operator"],
                          })
                        }
                        className="px-2 py-1 border rounded text-sm"
                        aria-label="Filter operator"
                      >
                        {filterOperators.map((op) => (
                          <option key={op.key} value={op.key}>
                            {op.label}
                          </option>
                        ))}
                      </select>

                      <Input
                        size="sm"
                        value={filter.value as string}
                        onValueChange={(value) =>
                          updateFilter(index, { value })
                        }
                        className="min-w-0"
                        placeholder="Value"
                      />

                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="danger"
                        onPress={() => removeFilter(index)}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Export Button */}
              <Button
                color="primary"
                size="lg"
                onPress={startExport}
                isLoading={loading}
                isDisabled={!formId || exportConfig.columns.length === 0}
                startContent={<ArrowDownTrayIcon className="w-5 h-5" />}
              >
                Start Export
              </Button>
            </CardBody>
          </Card>
        </div>

        {/* Export Jobs */}
        <div>
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Export History</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                {exportJobs.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No export jobs yet
                  </p>
                ) : (
                  exportJobs.map((job) => {
                    const Icon = getFormatIcon(job.config.format);
                    return (
                      <div
                        key={job.id}
                        className="border rounded-lg p-3 space-y-2"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            <span className="font-medium text-sm">
                              {job.config.format.toUpperCase()}
                            </span>
                          </div>
                          <Chip
                            size="sm"
                            color={getStatusColor(job.status)}
                            variant="flat"
                          >
                            {job.status}
                          </Chip>
                        </div>

                        {job.status === "processing" && (
                          <Progress
                            value={job.progress}
                            size="sm"
                            color="primary"
                            className="w-full"
                          />
                        )}

                        <div className="text-xs text-gray-600">
                          <div>
                            Created: {new Date(job.createdAt).toLocaleString()}
                          </div>
                          {job.recordCount && (
                            <div>{job.recordCount} records</div>
                          )}
                          {job.fileSize && (
                            <div>Size: {formatFileSize(job.fileSize)}</div>
                          )}
                        </div>

                        {job.status === "completed" && job.downloadUrl && (
                          <Button
                            size="sm"
                            variant="light"
                            color="primary"
                            onPress={() => downloadExport(job)}
                            className="w-full"
                          >
                            Download
                          </Button>
                        )}

                        {job.status === "failed" && job.error && (
                          <div className="text-xs text-red-600">
                            Error: {job.error}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ResponseExportSystem;
