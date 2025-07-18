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
  Spinner,
  Progress,
} from "@heroui/react";
import {
  FiCalendar,
  FiCheck,
  FiClock,
  FiFileText,
  FiSearch,
  FiFilter,
  FiEye,
  FiTrendingUp,
  FiTarget,
} from "react-icons/fi";
import ApiRequest, { ApiRequestReturnType } from "../../hooks/ApiHook";
import { ErrorToast } from "../Modal/AlertModal";

interface UserResponseData {
  _id: string;
  formId: string;
  formTitle: string;
  formType: string;
  totalScore: number;
  maxScore: number;
  isCompleted: boolean;
  submittedAt: Date;
  createdAt: Date;
  responseCount: number;
  isAutoScored: boolean;
  formCreatedAt: Date;
}

interface UserResponsesApiResponse {
  responses: UserResponseData[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

const UserResponseDashboard: React.FC = () => {
  const [responses, setResponses] = useState<UserResponseData[]>([]);
  const [filteredResponses, setFilteredResponses] = useState<
    UserResponseData[]
  >([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    searchTerm: "",
    formType: "",
    dateRange: "",
  });

  // Fetch user responses
  const fetchUserResponses = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });

      const result = (await ApiRequest({
        url: `/getuserresponses?${params}`,
        method: "GET",
        cookie: true,
      })) as ApiRequestReturnType;

      if (result.success && result.data) {
        const responseData = result.data as UserResponsesApiResponse;
        setResponses(responseData.responses);
        setTotalPages(responseData.pagination.totalPages);
      } else {
        ErrorToast({
          title: "Error",
          content: result.message || "Failed to fetch your responses",
        });
      }
    } catch (error) {
      console.error("Error fetching user responses:", error);
      ErrorToast({
        title: "Error",
        content: "Failed to fetch your responses",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Apply filters
  const applyFilters = useCallback(() => {
    let filtered = [...responses];

    // Search filter
    if (filters.searchTerm) {
      filtered = filtered.filter((response) =>
        response.formTitle
          .toLowerCase()
          .includes(filters.searchTerm.toLowerCase())
      );
    }

    // Form type filter
    if (filters.formType) {
      filtered = filtered.filter(
        (response) => response.formType === filters.formType
      );
    }

    // Date range filter
    if (filters.dateRange) {
      const now = new Date();
      switch (filters.dateRange) {
        case "today": {
          filtered = filtered.filter((response) => {
            const respDate = new Date(response.submittedAt);
            return respDate.toDateString() === now.toDateString();
          });
          break;
        }
        case "week": {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter((response) => {
            return new Date(response.submittedAt) >= weekAgo;
          });
          break;
        }
        case "month": {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter((response) => {
            return new Date(response.submittedAt) >= monthAgo;
          });
          break;
        }
      }
    }

    setFilteredResponses(filtered);
  }, [responses, filters]);

  useEffect(() => {
    fetchUserResponses(currentPage);
  }, [currentPage, fetchUserResponses]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

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

  // Get form type color
  const getFormTypeColor = (
    type: string
  ): "primary" | "secondary" | "success" | "warning" | "danger" | "default" => {
    switch (type.toLowerCase()) {
      case "quiz":
        return "success";
      case "survey":
        return "primary";
      case "form":
        return "secondary";
      default:
        return "default";
    }
  };

  // Calculate statistics
  const stats = {
    totalForms: responses.length,
    averageScore:
      responses.length > 0
        ? responses.reduce((sum, r) => sum + (r.totalScore || 0), 0) /
          responses.length
        : 0,
    completedForms: responses.filter((r) => r.isCompleted).length,
    quizzes: responses.filter((r) => r.formType.toLowerCase() === "quiz")
      .length,
  };

  return (
    <div className="w-full p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">My Form Responses</h2>
          <p className="text-gray-600">
            View all the forms you've filled out and your scores
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody className="flex flex-row items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FiFileText className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Forms</p>
              <p className="text-2xl font-bold">{stats.totalForms}</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex flex-row items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <FiTarget className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Average Score</p>
              <p className="text-2xl font-bold">
                {stats.averageScore.toFixed(1)}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex flex-row items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FiCheck className="text-purple-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold">{stats.completedForms}</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex flex-row items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <FiTrendingUp className="text-orange-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Quizzes</p>
              <p className="text-2xl font-bold">{stats.quizzes}</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FiFilter />
            Filters
          </h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Search forms..."
              value={filters.searchTerm}
              onChange={(e) =>
                setFilters({ ...filters, searchTerm: e.target.value })
              }
              startContent={<FiSearch />}
              isClearable
            />
            <Select
              placeholder="Form Type"
              selectedKeys={filters.formType ? [filters.formType] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                setFilters({ ...filters, formType: selected || "" });
              }}
            >
              <SelectItem key="QUIZ">Quiz</SelectItem>
              <SelectItem key="SURVEY">Survey</SelectItem>
              <SelectItem key="FORM">Form</SelectItem>
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
            Your Responses ({filteredResponses.length})
          </h3>
        </CardHeader>
        <CardBody>
          <Table aria-label="User responses table">
            <TableHeader>
              <TableColumn>FORM TITLE</TableColumn>
              <TableColumn>TYPE</TableColumn>
              <TableColumn>SCORE</TableColumn>
              <TableColumn>COMPLETION</TableColumn>
              <TableColumn>SUBMITTED</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody
              items={filteredResponses}
              loadingContent={<Spinner size="lg" />}
              isLoading={loading}
              emptyContent={
                <div className="text-center py-8">
                  <FiFileText
                    className="mx-auto text-gray-400 mb-4"
                    size={48}
                  />
                  <p className="text-gray-500">No responses found</p>
                  <p className="text-sm text-gray-400">
                    Start filling out forms to see your responses here
                  </p>
                </div>
              }
            >
              {(response: UserResponseData) => (
                <TableRow key={response._id}>
                  <TableCell>
                    <div className="max-w-xs">
                      <p className="font-medium truncate">
                        {response.formTitle}
                      </p>
                      <p className="text-sm text-gray-500">
                        {response.responseCount} questions
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="sm"
                      color={getFormTypeColor(response.formType)}
                      variant="flat"
                    >
                      {response.formType}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {response.totalScore || 0}
                        </span>
                        {response.maxScore > 0 && (
                          <span className="text-sm text-gray-500">
                            / {response.maxScore}
                          </span>
                        )}
                      </div>
                      {response.maxScore > 0 && (
                        <Progress
                          value={
                            ((response.totalScore || 0) / response.maxScore) *
                            100
                          }
                          size="sm"
                          color="primary"
                          className="max-w-md"
                        />
                      )}
                      {response.isAutoScored && (
                        <Chip size="sm" color="success" variant="flat">
                          Auto-scored
                        </Chip>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {response.isCompleted ? (
                        <>
                          <FiCheck className="text-green-500" />
                          <span className="text-green-600">Completed</span>
                        </>
                      ) : (
                        <>
                          <FiClock className="text-orange-500" />
                          <span className="text-orange-600">Partial</span>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FiCalendar className="text-gray-400" />
                      <span className="text-sm">
                        {formatDate(response.submittedAt)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="light"
                      startContent={<FiEye />}
                      onClick={() => {
                        window.open(`/form/${response.formId}`, "_blank");
                      }}
                    >
                      View Form
                    </Button>
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
    </div>
  );
};

export default UserResponseDashboard;
