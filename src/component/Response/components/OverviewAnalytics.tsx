import { memo, useCallback, useMemo, useState } from "react";
import { Card, CardBody, CardHeader, Progress, Spinner } from "@heroui/react";
import {
  FiClock,
  FiTarget,
  FiTrendingUp,
  FiUsers,
  FiAlertCircle,
} from "react-icons/fi";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import ApiRequest from "../../../hooks/APIHook/ApiHook";
import {
  AnalyticsData,
  GraphType,
  OverviewPerformanceData,
  PeriodType,
} from "../ResponseAnalytics.types";
import { SelectionType } from "../../../types/Global.types";
import Selection from "../../FormComponent/Selection";

interface OverviewAnalyticsTabsPropsType {
  analytics: AnalyticsData;
  formId: string;
}

/* -------------------------------- Constants -------------------------------- */

const PerformanceGraphsViewOptions: Array<SelectionType<GraphType>> = [
  { label: "Bar", value: GraphType.BAR },
  { label: "Timeseries", value: GraphType.TIMESERIES },
];

const PeriodOptions: Array<SelectionType<PeriodType>> = [
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 90 days", value: "90d" },
  { label: "All time", value: "all" },
];

const CHART_COLORS = {
  primary: "#6366f1",
  secondary: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
};

/* ----------------------------- Assets ----------------------------- */

const ChartTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color?: string }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-sm">
      {label && <p className="font-medium text-gray-900 mb-1">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }}>
          {entry.name}:{" "}
          {typeof entry.value === "number"
            ? entry.value.toFixed(1)
            : entry.value}
        </p>
      ))}
    </div>
  );
};

const OverviewAnayticsTabs = memo(
  ({ analytics, formId }: OverviewAnalyticsTabsPropsType) => {
    const [overviewGraph, setOverviewGraph] = useState<GraphType>(
      GraphType.BAR,
    );
    const [period, setPeriod] = useState<PeriodType>("7d");

    const handleOverviewGraphSelection = useCallback((val: GraphType) => {
      setOverviewGraph(val);
    }, []);

    const handlePeriodChange = useCallback((val: PeriodType) => {
      setPeriod(val);
    }, []);

    const {
      data: perfData,
      isLoading: isPerfLoading,
      isError: isPerfError,
    } = useQuery<OverviewPerformanceData>({
      queryKey: ["overviewPerformance", formId, period],
      queryFn: async () => {
        const params = new URLSearchParams({ formId, period });
        const result = await ApiRequest({
          url: `/response/getoverviewanalytic?${params.toString()}`,
          method: "GET",
          cookie: true,
          reactQuery: true,
        });
        if (!result.success)
          throw new Error(result.error ?? "Failed to fetch overview analytics");
        return result.data as OverviewPerformanceData;
      },
      enabled: !!formId,
      staleTime: 5 * 60 * 1000,
      retry: 1,
    });

    const completionRatePct = analytics.formStats.completionRate;
    const avgScorePct = useMemo(
      () =>
        analytics.formStats.maxPossibleScore > 0
          ? (analytics.formStats.averageScore /
              analytics.formStats.maxPossibleScore) *
            100
          : 0,
      [analytics.formStats.averageScore, analytics.formStats.maxPossibleScore],
    );

    const difficultQuestionsChartData = useMemo(
      () =>
        perfData?.performanceMetrics.difficultQuestions.map((q) => ({
          name: q.title.length > 25 ? `${q.title.slice(0, 25)}…` : q.title,
          Accuracy: parseFloat(q.accuracy.toFixed(1)),
          "Avg Score": parseFloat(q.averageScore.toFixed(2)),
        })) ?? [],
      [perfData],
    );

    const topPerformersChartData = useMemo(
      () =>
        perfData?.performanceMetrics.topPerformers.map((p) => ({
          name: p.name.length > 16 ? `${p.name.slice(0, 16)}…` : p.name,
          Score: p.score,
        })) ?? [],
      [perfData],
    );

    return (
      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card aria-label="Response Card">
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

          <Card aria-label="CompletionRate Card">
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

          <Card aria-label="AverageScore Card">
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

          <Card aria-label="CompletedResponses Card">
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FiClock className="text-purple-600 text-xl" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Completed Responses</p>
                  <p className="text-2xl font-bold">
                    {analytics.formStats.completedResponses}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Form Stats Overview */}
        <Card aria-label="PerformanceOverview Card">
          <CardHeader>
            <h3 className="text-lg font-semibold">Performance Overview</h3>
          </CardHeader>
          <CardBody className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">Completion Rate</span>
                <span className="text-sm font-semibold">
                  {completionRatePct.toFixed(1)}%
                </span>
              </div>
              <Progress
                value={completionRatePct}
                className="h-2"
                color="warning"
                aria-label="analytics progressBar"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">Average Score</span>
                <span className="text-sm font-semibold">
                  {avgScorePct.toFixed(1)}%
                </span>
              </div>
              <Progress
                value={avgScorePct}
                className="h-2"
                color="success"
                aria-label="averageScore progressBar"
              />
            </div>
          </CardBody>
        </Card>

        {/* Details Performance Analytics */}
        <div className="DetailPerformanceContainer w-full space-y-4">
          {/* Filter Section */}
          <div className="flex flex-wrap items-center gap-3">
            <Selection
              items={PerformanceGraphsViewOptions}
              selectedKeys={[overviewGraph]}
              onSelectionChange={(val) =>
                val.currentKey &&
                handleOverviewGraphSelection(val.currentKey as GraphType)
              }
            />
            <Selection
              items={PeriodOptions}
              selectedKeys={[period]}
              onSelectionChange={(val) =>
                val.currentKey &&
                handlePeriodChange(val.currentKey as PeriodType)
              }
            />
          </div>

          {isPerfLoading && (
            <div className="flex items-center justify-center h-48">
              <Spinner size="lg" color="primary" />
            </div>
          )}

          {isPerfError && (
            <div className="flex items-center justify-center h-48 gap-2 text-danger">
              <FiAlertCircle className="text-xl" />
              <span className="text-sm">Failed to load performance data.</span>
            </div>
          )}

          {!isPerfLoading && !isPerfError && perfData && (
            <>
              {overviewGraph === GraphType.BAR && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Question Difficulty Chart */}
                  <Card aria-label="QuestionDifficulty Chart">
                    <CardHeader>
                      <h4 className="text-base font-semibold">
                        Question Difficulty (Accuracy %)
                      </h4>
                    </CardHeader>
                    <CardBody>
                      {difficultQuestionsChartData.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-8">
                          No question data available.
                        </p>
                      ) : (
                        <ResponsiveContainer width="100%" height={260}>
                          <BarChart
                            data={difficultQuestionsChartData}
                            margin={{ top: 5, right: 10, left: 0, bottom: 60 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="name"
                              tick={{ fontSize: 11 }}
                              angle={-35}
                              textAnchor="end"
                              interval={0}
                            />
                            <YAxis
                              tick={{ fontSize: 11 }}
                              domain={[0, 100]}
                              tickFormatter={(v) => `${v}%`}
                            />
                            <Tooltip content={<ChartTooltip />} />
                            <Legend wrapperStyle={{ paddingTop: 16 }} />
                            <Bar
                              dataKey="Accuracy"
                              fill={CHART_COLORS.danger}
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </CardBody>
                  </Card>

                  {/* Top Performers Chart */}
                  <Card aria-label="TopPerformers Chart">
                    <CardHeader>
                      <h4 className="text-base font-semibold">
                        Top Performers
                      </h4>
                    </CardHeader>
                    <CardBody>
                      {topPerformersChartData.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-8">
                          No performer data available.
                        </p>
                      ) : (
                        <ResponsiveContainer width="100%" height={260}>
                          <BarChart
                            data={topPerformersChartData}
                            margin={{ top: 5, right: 10, left: 0, bottom: 60 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="name"
                              tick={{ fontSize: 11 }}
                              angle={-35}
                              textAnchor="end"
                              interval={0}
                            />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip content={<ChartTooltip />} />
                            <Legend wrapperStyle={{ paddingTop: 16 }} />
                            <Bar
                              dataKey="Score"
                              fill={CHART_COLORS.primary}
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </CardBody>
                  </Card>
                </div>
              )}

              {overviewGraph === GraphType.TIMESERIES && (
                <Card aria-label="TimeseriesChart Card">
                  <CardHeader>
                    <h4 className="text-base font-semibold">
                      Responses &amp; Average Score Over Time
                    </h4>
                  </CardHeader>
                  <CardBody>
                    {perfData.timeSeriesData.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-8">
                        No timeseries data available.
                      </p>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart
                          data={perfData.timeSeriesData}
                          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 11 }}
                            tickFormatter={(v: string) =>
                              v.length > 5 ? v.slice(5) : v
                            }
                          />
                          <YAxis
                            yAxisId="left"
                            tick={{ fontSize: 11 }}
                            label={{
                              value: "Responses",
                              angle: -90,
                              position: "insideLeft",
                              style: { fontSize: 11 },
                            }}
                          />
                          <YAxis
                            yAxisId="right"
                            orientation="right"
                            tick={{ fontSize: 11 }}
                            label={{
                              value: "Avg Score",
                              angle: 90,
                              position: "insideRight",
                              style: { fontSize: 11 },
                            }}
                          />
                          <Tooltip content={<ChartTooltip />} />
                          <Legend />
                          <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="responses"
                            stroke={CHART_COLORS.primary}
                            strokeWidth={2}
                            dot={false}
                            name="Responses"
                          />
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="averageScore"
                            stroke={CHART_COLORS.secondary}
                            strokeWidth={2}
                            dot={false}
                            name="Avg Score"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </CardBody>
                </Card>
              )}

              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  {
                    label: "Response Rate",
                    value: `${perfData.responseRate.toFixed(1)}%`,
                    color: "text-blue-600",
                    bg: "bg-blue-50",
                  },
                  {
                    label: "Avg.Score",
                    value: perfData.averageScore.toFixed(2),
                    color: "text-green-600",
                    bg: "bg-green-50",
                  },
                  {
                    label: "Completed",
                    value: perfData.completedResponses,
                    color: "text-purple-600",
                    bg: "bg-purple-50",
                  },
                  {
                    label: "Avg.Completion Time",
                    value: `${perfData.averageCompletionTime} min`,
                    color: "text-yellow-600",
                    bg: "bg-yellow-50",
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className={`${stat.bg} rounded-lg p-3 text-center`}
                  >
                    <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                    <p className={`text-lg font-bold ${stat.color}`}>
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  },
);

OverviewAnayticsTabs.displayName = "OverviewAnayticsTabs";

export default OverviewAnayticsTabs;
