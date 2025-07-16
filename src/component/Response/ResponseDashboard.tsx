import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Input,
  Select,
  SelectItem,
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Chip,
  Pagination,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Tooltip,
  Spinner,
} from "@heroui/react";
import {
  FiMail,
  FiLink,
  FiDownload,
  FiEye,
  FiEdit3,
  FiBarChart,
} from "react-icons/fi";
import ApiRequest, { ApiRequestReturnType } from "../../hooks/ApiHook";
import { FormDataType } from "../../types/Form.types";
import SuccessToast, { ErrorToast } from "../Modal/AlertModal";

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

interface ResponseDashboardProps {
  formId: string;
  form: FormDataType;
}

interface FormLinkResponse {
  link?: string;
  url?: string;
}

const errorToastId = "uniqueResponseErrorId";

const ResponseDashboard: React.FC<ResponseDashboardProps> = ({
  formId,
  form,
}) => {
  const [responses, setResponses] = useState<ResponseData[]>([]);
  const [filteredResponses, setFilteredResponses] = useState<ResponseData[]>(
    []
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [emailSendingLoading, setEmailSendingLoading] = useState(false);
  const [linkGeneratingLoading, setLinkGeneratingLoading] = useState(false);
  const [scoreUpdateLoading, setScoreUpdateLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    dateRange: "",
    searchTerm: "",
  });
  const [selectedResponse, setSelectedResponse] = useState<ResponseData | null>(
    null
  );
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailList, setEmailList] = useState("");
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");

  const {
    isOpen: isViewOpen,
    onOpen: onViewOpen,
    onClose: onViewClose,
  } = useDisclosure();
  const {
    isOpen: isScoreOpen,
    onOpen: onScoreOpen,
    onClose: onScoreClose,
  } = useDisclosure();

  // Apply filters to responses
  const applyFilters = useCallback(() => {
    let filtered = responses;

    // Filter by search term
    if (filters.searchTerm) {
      filtered = filtered.filter(
        (response) =>
          (response.respondentName &&
            response.respondentName
              .toLowerCase()
              .includes(filters.searchTerm.toLowerCase())) ||
          (response.respondentEmail &&
            response.respondentEmail
              .toLowerCase()
              .includes(filters.searchTerm.toLowerCase())) ||
          (response.guest?.name &&
            response.guest.name
              .toLowerCase()
              .includes(filters.searchTerm.toLowerCase())) ||
          (response.guest?.email &&
            response.guest.email
              .toLowerCase()
              .includes(filters.searchTerm.toLowerCase()))
      );
    }

    // Filter by completion status
    if (filters.status) {
      filtered = filtered.filter(
        (response) => response.completionStatus === filters.status
      );
    }

    // Filter by date range
    if (filters.dateRange) {
      const now = new Date();

      switch (filters.dateRange) {
        case "today": {
          filtered = filtered.filter((response) => {
            if (!response.submittedAt) return false;
            const respDate = new Date(response.submittedAt);
            return respDate.toDateString() === now.toDateString();
          });
          break;
        }
        case "week": {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter((response) => {
            if (!response.submittedAt) return false;
            return new Date(response.submittedAt) >= weekAgo;
          });
          break;
        }
        case "month": {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter((response) => {
            if (!response.submittedAt) return false;
            return new Date(response.submittedAt) >= monthAgo;
          });
          break;
        }
      }
    }

    setFilteredResponses(filtered);
  }, [responses, filters]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Fetch responses with filters
  const fetchResponses = useCallback(
    async (page = 1) => {
      if (!formId) {
        console.log("No formId provided, skipping response fetch");
        return;
      }

      setLoading(true);
      try {
        const params = new URLSearchParams({
          id: formId,
          p: page.toString(),
          lt: "10",
        });

        console.log({ formId });

        const result = (await ApiRequest({
          url: `/getresponsebyform?${params}`,
          method: "GET",
          cookie: true,
        })) as ApiRequestReturnType;

        if (result.success && result.data) {
          const responses = result.data as ResponseData[];
          setResponses(responses);
          // Calculate total pages based on response count (backend doesn't provide total count)
          setTotalPages(responses.length < 10 ? page : page + 1);
        } else {
          ErrorToast({
            toastid: errorToastId,
            title: "Error",
            content: result.message || "Failed to fetch responses",
          });
        }
      } catch (error) {
        console.error("Error fetching responses:", error);
        ErrorToast({
          toastid: errorToastId,
          title: "Error",
          content: "Failed to fetch responses",
        });
      } finally {
        setLoading(false);
      }
    },
    [formId]
  );

  // Send form links via email
  const sendFormLinks = async () => {
    if (!emailList.trim()) return;

    if (!formId) {
      ErrorToast({
        title: "Error",
        content: "Form ID is required to send links",
      });
      return;
    }

    const emails = emailList
      .split(",")
      .map((email) => email.trim())
      .filter((email) => email);

    if (emails.length === 0) {
      ErrorToast({
        title: "Error",
        content: "Please enter at least one valid email address",
      });
      return;
    }

    setEmailSendingLoading(true);
    try {
      const result = (await ApiRequest({
        url: "/response/send-links",
        method: "POST",
        cookie: true,
        data: {
          formId,
          emails,
          message: `You have been invited to complete the survey: ${form.title}`,
        },
      })) as ApiRequestReturnType;

      if (result.success) {
        setEmailModalOpen(false);
        setEmailList("");
        SuccessToast({
          title: "Success",
          content: "Form links sent successfully!",
        });
      } else {
        ErrorToast({
          title: "Error",
          content: result.message || "Failed to send form links",
        });
      }
    } catch (error) {
      console.error("Error sending form links:", error);
      ErrorToast({
        title: "Error",
        content: "Failed to send form links",
      });
    } finally {
      setEmailSendingLoading(false);
    }
  };

  // Generate form link
  const generateFormLink = async () => {
    if (!formId) {
      ErrorToast({
        title: "Error",
        content: "Form ID is required to generate link",
      });
      return;
    }

    setLinkGeneratingLoading(true);
    try {
      const result = (await ApiRequest({
        url: "/response/generate-link",
        method: "POST",
        cookie: true,
        data: { formId, secure: true },
      })) as ApiRequestReturnType;

      if (result.success && result.data) {
        const linkData = result.data as FormLinkResponse;
        setGeneratedLink(
          linkData.link || linkData.url || (result.data as string)
        );
        setLinkModalOpen(true);
        SuccessToast({
          title: "Success",
          content: "Form link generated successfully!",
        });
      } else {
        ErrorToast({
          title: "Error",
          content: result.message || "Failed to generate form link",
        });
      }
    } catch (error) {
      console.error("Error generating form link:", error);
      ErrorToast({
        title: "Error",
        content: "Failed to generate form link",
      });
    } finally {
      setLinkGeneratingLoading(false);
    }
  };

  // Update response score
  const updateResponseScore = async (responseId: string, newScore: number) => {
    setScoreUpdateLoading(true);

    try {
      const result = await ApiRequest({
        method: "PUT",
        url: `/response/update-score`,
        data: {
          responseId,
          score: newScore,
        },
        cookie: true,
      });

      if (result.success) {
        // Update local state
        setResponses((prev) =>
          prev.map((resp) =>
            resp._id === responseId
              ? { ...resp, totalScore: newScore, isManuallyScored: true }
              : resp
          )
        );
        setFilteredResponses((prev) =>
          prev.map((resp) =>
            resp._id === responseId
              ? { ...resp, totalScore: newScore, isManuallyScored: true }
              : resp
          )
        );

        onScoreClose();
        SuccessToast({
          title: "Success",
          content: "Response score updated successfully!",
        });
      } else {
        ErrorToast({
          title: "Error",
          content: result.message || "Failed to update response score",
          toastid: errorToastId,
        });
      }
    } catch {
      ErrorToast({
        title: "Error",
        content: "Failed to update response score",
        toastid: errorToastId,
      });
    } finally {
      setScoreUpdateLoading(false);
    }
  };

  // Copy link to clipboard
  const copyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    SuccessToast({ title: "Success", content: "Link copied to clipboard!" });
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get status color
  const getStatusColor = (
    status: string
  ): "success" | "warning" | "danger" | "default" => {
    switch (status) {
      case "completed":
        return "success";
      case "partial":
        return "warning";
      case "abandoned":
        return "danger";
      default:
        return "default";
    }
  };

  useEffect(() => {
    fetchResponses(currentPage);
  }, [currentPage, fetchResponses]);

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Response Management</h2>
        <div className="flex gap-2">
          <Button
            color="primary"
            startContent={<FiMail />}
            onPress={() => setEmailModalOpen(true)}
          >
            Send Links
          </Button>
          <Button
            color="secondary"
            startContent={
              linkGeneratingLoading ? <Spinner size="sm" /> : <FiLink />
            }
            onPress={generateFormLink}
            isLoading={linkGeneratingLoading}
            disabled={linkGeneratingLoading}
          >
            {linkGeneratingLoading ? "Generating..." : "Generate Link"}
          </Button>
          <Button
            color="success"
            startContent={<FiBarChart />}
            onPress={() => window.open(`/analytics/${formId}`, "_blank")}
          >
            Analytics
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Filters</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Search by name or email..."
              value={filters.searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFilters({ ...filters, searchTerm: e.target.value })
              }
              isClearable
            />
            <Select
              placeholder="Completion Status"
              selectedKeys={filters.status ? [filters.status] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                setFilters({ ...filters, status: selected || "" });
              }}
            >
              <SelectItem key="completed">Completed</SelectItem>
              <SelectItem key="partial">Partial</SelectItem>
              <SelectItem key="abandoned">Abandoned</SelectItem>
            </Select>
            <Select
              placeholder="Date Range"
              selectedKeys={filters.dateRange ? [filters.dateRange] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                setFilters({ ...filters, dateRange: selected || "" });
              }}
            >
              <SelectItem key="today">Today</SelectItem>
              <SelectItem key="week">This Week</SelectItem>
              <SelectItem key="month">This Month</SelectItem>
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Responses Table */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">
            Responses ({responses.length})
          </h3>
        </CardHeader>
        <CardBody>
          <Table aria-label="Responses table">
            <TableHeader>
              <TableColumn>RESPONDENT</TableColumn>
              <TableColumn>EMAIL</TableColumn>
              <TableColumn>SCORE</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>SUBMITTED</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody
              items={filteredResponses}
              loadingContent={<Spinner size="lg" />}
              isLoading={loading}
              emptyContent={
                <div className="text-center py-8">
                  <p className="text-gray-500">No responses found</p>
                </div>
              }
            >
              {(response: ResponseData) => (
                <TableRow key={response._id}>
                  <TableCell>
                    {response.respondentName ||
                      response.guest?.name ||
                      "Anonymous"}
                  </TableCell>
                  <TableCell>
                    {response.respondentEmail || response.guest?.email || "N/A"}
                  </TableCell>
                  <TableCell>
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
                      color={getStatusColor(
                        response.completionStatus || "default"
                      )}
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
                          onClick={() => {
                            setSelectedResponse(response);
                            onViewOpen();
                          }}
                        >
                          <FiEye />
                        </Button>
                      </Tooltip>
                      <Tooltip content="Edit Score">
                        <Button
                          size="sm"
                          variant="light"
                          isIconOnly
                          onClick={() => {
                            setSelectedResponse(response);
                            onScoreOpen();
                          }}
                        >
                          <FiEdit3 />
                        </Button>
                      </Tooltip>
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
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex justify-center mt-4">
              <Pagination
                total={totalPages}
                page={currentPage}
                onChange={setCurrentPage}
                showControls
              />
            </div>
          )}
        </CardBody>
      </Card>

      {/* Email Modal */}
      <Modal isOpen={emailModalOpen} onClose={() => setEmailModalOpen(false)}>
        <ModalContent>
          <ModalHeader>Send Form Links</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Email Addresses (comma-separated)
                </label>
                <textarea
                  className="w-full p-2 border rounded-md h-24"
                  placeholder="email1@example.com, email2@example.com"
                  value={emailList}
                  onChange={(e) => setEmailList(e.target.value)}
                />
              </div>
              <div className="text-sm text-gray-600">Form: {form.title}</div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onClick={() => setEmailModalOpen(false)}>
              Cancel
            </Button>
            <Button
              color="primary"
              onClick={sendFormLinks}
              isLoading={emailSendingLoading}
              disabled={emailSendingLoading}
            >
              {emailSendingLoading ? <Spinner size="sm" /> : "Send Links"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Link Generation Modal */}
      <Modal isOpen={linkModalOpen} onClose={() => setLinkModalOpen(false)}>
        <ModalContent>
          <ModalHeader>Generated Form Link</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Shareable Link
                </label>
                <div className="flex gap-2">
                  <Input value={generatedLink} readOnly className="flex-1" />
                  <Button onClick={copyLink}>Copy</Button>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                This link can be shared with anyone to access the form.
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => setLinkModalOpen(false)}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* View Response Modal */}
      <Modal isOpen={isViewOpen} onClose={onViewClose} size="2xl">
        <ModalContent>
          <ModalHeader>Response Details</ModalHeader>
          <ModalBody>
            {selectedResponse && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <strong>Respondent:</strong>{" "}
                    {selectedResponse.respondentName || "Anonymous"}
                  </div>
                  <div>
                    <strong>Email:</strong>{" "}
                    {selectedResponse.respondentEmail || "N/A"}
                  </div>
                  <div>
                    <strong>Score:</strong> {selectedResponse.totalScore || 0}
                  </div>
                  <div>
                    <strong>Status:</strong>{" "}
                    {selectedResponse.completionStatus || "Unknown"}
                  </div>
                </div>
                <div>
                  <strong>Submitted:</strong>{" "}
                  {selectedResponse.submittedAt
                    ? formatDate(selectedResponse.submittedAt)
                    : "N/A"}
                </div>
                <div>
                  <strong>Responses:</strong>
                  <div className="mt-2 space-y-2">
                    {selectedResponse.responseset.map(
                      (resp: ResponseSetType, index: number) => (
                        <div key={index} className="p-2 bg-gray-50 rounded">
                          <div className="font-medium">
                            Question {index + 1}
                          </div>
                          <div>{String(resp.response)}</div>
                          {resp.score && (
                            <div className="text-sm text-gray-600">
                              Score: {resp.score}
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={onViewClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Score Edit Modal */}
      <Modal isOpen={isScoreOpen} onClose={onScoreClose}>
        <ModalContent>
          <ModalHeader>Edit Score</ModalHeader>
          <ModalBody>
            {selectedResponse && (
              <div className="space-y-4">
                <div>
                  <strong>Respondent:</strong>{" "}
                  {selectedResponse.respondentName || "Anonymous"}
                </div>
                <div>
                  <strong>Current Score:</strong>{" "}
                  {selectedResponse.totalScore || 0}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    New Score
                  </label>
                  <Input
                    type="number"
                    placeholder="Enter new score"
                    defaultValue={(selectedResponse.totalScore || 0).toString()}
                    onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
                      if (e.key === "Enter") {
                        const newScore = parseInt(
                          (e.target as HTMLInputElement).value
                        );
                        updateResponseScore(selectedResponse._id, newScore);
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onClick={onScoreClose}>
              Cancel
            </Button>
            <Button
              color="primary"
              isLoading={scoreUpdateLoading}
              disabled={scoreUpdateLoading}
              onClick={() => {
                const input = document.querySelector(
                  'input[type="number"]'
                ) as HTMLInputElement;
                if (input && selectedResponse) {
                  const newScore = parseInt(input.value);
                  updateResponseScore(selectedResponse._id, newScore);
                }
              }}
            >
              {scoreUpdateLoading ? <Spinner size="sm" /> : "Update Score"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default ResponseDashboard;
