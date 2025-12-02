import React, { useState, memo } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Select,
  SelectItem,
  Progress,
  Tabs,
  Tab,
} from "@heroui/react";
import {
  FiBarChart,
  FiTrendingUp,
  FiUsers,
  FiClock,
  FiTarget,
  FiRefreshCw,
  FiPieChart,
} from "react-icons/fi";
import { useQuery } from "@tanstack/react-query";
import ApiRequest from "../../hooks/ApiHook";
import { FormDataType } from "../../types/Form.types";
import GraphAnalyticsView from "./GraphAnalyticsView";
import DefaultAnalyticsView from "./DefaultAnalyticsView";
import { AnalyticsData } from "./ResponseAnalytics.types";

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
    undefined
  );

  // Get unique pages from form contents
  const availablePages = form.contents
    ? Array.from(
        new Set(
          form.contents
            .map((c) => c.page)
            .filter((p): p is number => p !== undefined && p !== null)
        )
      ).sort((a, b) => a - b)
    : [];

  // Fetch analytics data using the analytics controller
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
    enabled: !!formId,
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

  if (isLoading) {
    return (
      <div className="w-full p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <FiRefreshCw className="animate-spin text-4xl text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics || analytics.isResponse === false) {
    return (
      <div className="w-full p-6">
        <Card>
          <CardBody className="text-center p-8">
            <FiBarChart className="text-6xl text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Analytics Data</h3>
            <p className="text-gray-600">
              Analytics data will appear here once you have responses to your
              form.
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

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
          {availablePages.length > 0 && (
            <Select
              placeholder="All Pages"
              selectedKeys={selectedPage ? [selectedPage.toString()] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                setSelectedPage(
                  selected === "all" ? undefined : Number(selected)
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
            onPress={() => refetch()}
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
      >
        <Tab key="overview" title="Overview">
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardBody className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FiUsers className="text-blue-600 text-xl" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Responses</p>
                      <p className="text-2xl font-bold">
                        {analytics.formStats.totalResponses}
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardBody className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <FiTarget className="text-green-600 text-xl" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Completion Rate</p>
                      <p className="text-2xl font-bold">
                        {analytics.formStats.completionRate.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardBody className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <FiTrendingUp className="text-yellow-600 text-xl" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Average Score</p>
                      <p className="text-2xl font-bold">
                        {analytics.formStats.averageScore.toFixed(1)}
                        <span className="text-sm text-gray-500">
                          /{analytics.formStats.maxPossibleScore}
                        </span>
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardBody className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <FiClock className="text-purple-600 text-xl" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">
                        Completed Responses
                      </p>
                      <p className="text-2xl font-bold">
                        {analytics.formStats.completedResponses}
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Performance Overview */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Performance Overview</h3>
              </CardHeader>
              <CardBody className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm">Completion Rate</span>
                    <span className="text-sm font-semibold">
                      {analytics.formStats.completionRate.toFixed(1)}%
                    </span>
                  </div>
                  <Progress
                    value={analytics.formStats.completionRate}
                    className="h-2"
                    color="warning"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm">Average Score</span>
                    <span className="text-sm font-semibold">
                      {(
                        (analytics.formStats.averageScore /
                          (analytics.formStats.maxPossibleScore || 1)) *
                        100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                  <Progress
                    value={
                      (analytics.formStats.averageScore /
                        (analytics.formStats.maxPossibleScore || 1)) *
                      100
                    }
                    className="h-2"
                    color="success"
                  />
                </div>
              </CardBody>
            </Card>
          </div>
        </Tab>

        <Tab key="questions" title="Question Analysis">
          <div className="space-y-6">
            {/* View Mode Toggle */}
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                {analytics.questions.length} Question
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
                questions={analytics.questions}
                formColor={form.setting?.qcolor}
              />
            ) : (
              <DefaultAnalyticsView
                questions={analytics.questions}
                formColor={form.setting?.qcolor}
              />
            )}
          </div>
        </Tab>
      </Tabs>
    </div>
  );
};

ResponseAnalytics.displayName = "ResponseAnalytics";

export default memo(ResponseAnalytics);
