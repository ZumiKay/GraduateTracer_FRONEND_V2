import React, { useState, memo } from "react";
import {
  Card,
  CardBody,
  Button,
  Select,
  SelectItem,
  Tabs,
  Tab,
} from "@heroui/react";
import { FiBarChart, FiRefreshCw, FiPieChart } from "react-icons/fi";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ApiRequest from "../../hooks/APIHook/ApiHook";
import { FormDataType, FormTypeEnum } from "../../types/Form.types";
import GraphAnalyticsView from "./GraphAnalyticsView";
import DefaultAnalyticsView from "./DefaultAnalyticsView";
import { AnalyticsData } from "./ResponseAnalytics.types";
import OverviewAnayticsTabs from "./components/OverviewAnalytics";
import Pagination from "../Navigator/PaginationComponent";

interface ResponseAnalyticsProps {
  formId: string;
  form: FormDataType;
}

const ResponseAnalytics: React.FC<ResponseAnalyticsProps> = ({
  formId,
  form,
}) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [viewMode, setViewMode] = useState<"default" | "graph">("graph");
  const [selectedPage, setSelectedPage] = useState<number | undefined>(
    undefined,
  );
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const queryClient = useQueryClient();

  // Get unique pages from form contents
  const availablePages = form.contents
    ? Array.from(
        new Set(
          form.contents
            .map((c) => c.page)
            .filter((p): p is number => p !== undefined && p !== null),
        ),
      ).sort((a, b) => a - b)
    : [];

  // Fetch detail analytics for form
  const {
    data: analytics,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["analytics", formId, selectedPage],
    queryFn: async () => {
      if (!formId) {
        throw new Error("No formId provided");
      }

      const params = new URLSearchParams({ formId });
      if (selectedPage && selectedPage > 0) {
        params.append("page", selectedPage.toString());
      }

      const result = await ApiRequest({
        url: `/response/getanalytics?${params.toString()}`,
        method: "GET",
        cookie: true,
        reactQuery: true,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch analytics");
      }

      return result.data as AnalyticsData;
    },
    enabled: !!formId && activeTab === "questions",
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount) => {
      if (failureCount >= 2) return false;
      return true;
    },
  });

  // Handle query errors
  if (error) {
    console.error("Error fetching analytics:", error);
  }

  // Reset pagination when tab changes or analytics data updates
  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, analytics?.questions.length]);

  // Calculate paginated questions
  const paginatedQuestions = React.useMemo(() => {
    if (!analytics?.questions) return [];
    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    return analytics.questions.slice(startIdx, endIdx);
  }, [analytics?.questions, currentPage, itemsPerPage]);

  const totalPages = analytics?.questions
    ? Math.ceil(analytics.questions.length / itemsPerPage)
    : 0;

  const handleRefresh = () => {
    if (activeTab === "questions") {
      refetch();
    } else {
      queryClient.invalidateQueries({
        queryKey: ["overviewPerformance", formId],
      });
    }
  };

  return (
    <div className="w-full p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">Response Analytics</h2>
          <p className="text-gray-600">
            Insights and statistics for {form.title}
          </p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          {activeTab === "questions" && availablePages.length > 0 && (
            <Select
              placeholder="All Pages"
              aria-label="Response Analytics Pagintion"
              selectedKeys={selectedPage ? [selectedPage.toString()] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                setSelectedPage(
                  selected === "all" ? undefined : Number(selected),
                );
              }}
              className="w-32"
              size="sm"
              items={[
                { key: "all", label: "All Pages" },
                ...availablePages.map((page) => ({
                  key: page.toString(),
                  label: `Page ${page}`,
                })),
              ]}
            >
              {(item) => <SelectItem key={item.key}>{item.label}</SelectItem>}
            </Select>
          )}
          <Button
            size="sm"
            onPress={handleRefresh}
            aria-label="Refresh Button"
            startContent={<FiRefreshCw />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        selectedKey={activeTab}
        onSelectionChange={(key) => setActiveTab(key as string)}
        className="w-full"
        aria-label="Analytics Tab"
      >
        <Tab key="overview" title="Overview">
          <OverviewAnayticsTabs
            formId={formId}
            isQuizForm={form.type === FormTypeEnum.Quiz}
          />
        </Tab>

        <Tab
          key="questions"
          title="Question Analysis"
          aria-label="QuestionAnalysis Tab"
        >
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <FiRefreshCw className="animate-spin text-4xl text-blue-500 mx-auto mb-4" />
                <p className="text-gray-600">Loading analytics...</p>
              </div>
            </div>
          ) : !analytics || analytics.isResponse === false ? (
            <Card>
              <CardBody className="text-center p-8">
                <FiBarChart className="text-6xl text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  No Analytics Data
                </h3>
                <p className="text-gray-600">
                  Analytics data will appear here once you have responses to
                  your form.
                </p>
              </CardBody>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* View Mode Toggle */}
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  Showing{" "}
                  {Math.min(
                    (currentPage - 1) * itemsPerPage + 1,
                    analytics.questions.length,
                  )}
                  -
                  {Math.min(
                    currentPage * itemsPerPage,
                    analytics.questions.length,
                  )}{" "}
                  of {analytics.questions.length} Question
                  {analytics.questions.length !== 1 ? "s" : ""} Analyzed
                </h3>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={viewMode === "default" ? "solid" : "ghost"}
                    color={viewMode === "default" ? "primary" : "default"}
                    onPress={() => setViewMode("default")}
                    startContent={<FiBarChart />}
                  >
                    Default View
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === "graph" ? "solid" : "ghost"}
                    color={viewMode === "graph" ? "primary" : "default"}
                    onPress={() => setViewMode("graph")}
                    startContent={<FiPieChart />}
                  >
                    Graph View
                  </Button>
                </div>
              </div>

              {/* Questions Display */}
              {viewMode === "graph" ? (
                <GraphAnalyticsView
                  questions={paginatedQuestions}
                  formColor={form.setting?.qcolor}
                />
              ) : (
                <DefaultAnalyticsView
                  questions={paginatedQuestions}
                  formColor={form.setting?.qcolor}
                />
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-8">
                  <Pagination
                    totalPage={totalPages}
                    page={currentPage}
                    setPage={setCurrentPage}
                    isDisable={isLoading}
                  />
                </div>
              )}
            </div>
          )}
        </Tab>
      </Tabs>
    </div>
  );
};

ResponseAnalytics.displayName = "ResponseAnalytics";

export default memo(ResponseAnalytics);
