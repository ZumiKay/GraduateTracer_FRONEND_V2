import { memo, useCallback, useMemo, useState } from "react";
import { Card, CardBody, CardHeader, Spinner } from "@heroui/react";
import { FiClock, FiTrendingUp, FiUsers, FiAlertCircle } from "react-icons/fi";
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
  OverviewPerformanceData,
  PeriodType,
} from "../ResponseAnalytics.types";
import { SelectionType } from "../../../types/Global.types";
import Selection from "../../FormComponent/Selection";

type PerformanceGraphOptionType = "Response" | "Difficulty" | "Top";
interface OverviewAnalyticsTabsPropsType {
  formId: string;
  isQuizForm: boolean;
}

/* -------------------------------- Constants -------------------------------- */

const getPerformanceGraphOptions = (
  isQuizForm: boolean,
): Array<SelectionType<PerformanceGraphOptionType>> => {
  const baseOptions: Array<SelectionType<PerformanceGraphOptionType>> = [
    { label: "Response Count", value: "Response" },
  ];

  if (isQuizForm) {
    baseOptions.push(
      { label: "Question Difficulty", value: "Difficulty" },
      { label: "Top Scorer", value: "Top" },
    );
  }

  return baseOptions;
};

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
  ({ formId, isQuizForm }: OverviewAnalyticsTabsPropsType) => {
    const performanceGraphOptions = useMemo(
      () => getPerformanceGraphOptions(isQuizForm),
      [isQuizForm],
    );

    const [overviewGraph, setOverviewGraph] =
      useState<PerformanceGraphOptionType>(
        performanceGraphOptions[0]?.value ?? "Response",
      );
    const [period, setPeriod] = useState<PeriodType>("7d");

    const handleOverviewGraphSelection = useCallback(
      (val: PerformanceGraphOptionType) => {
        setOverviewGraph(val);
      },
      [],
    );

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

    const dailyVolumeChartData = useMemo(
      () =>
        perfData?.timeSeriesData.map((d) => ({
          date: d.date.length > 5 ? d.date.slice(5) : d.date,
          Responses: d.responses,
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
                    {perfData?.totalResponses ?? 0}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          {isQuizForm && (
            <>
              <Card aria-label="AverageScore Card">
                <CardBody className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <FiTrendingUp className="text-yellow-600 text-xl" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Average Score</p>
                      <p className="text-2xl font-bold">
                        {perfData?.averageScore.toFixed(1)}
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
                      <p className="text-sm text-gray-600">
                        Completed Responses
                      </p>
                      <p className="text-2xl font-bold">
                        {perfData?.completedResponses}
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </>
          )}
        </div>

        {/* Performance Metrics Selections */}
        <div className="DetailPerformanceContainer w-full space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Selection
              items={performanceGraphOptions}
              selectedKeys={[overviewGraph]}
              onSelectionChange={(val) =>
                val.currentKey &&
                handleOverviewGraphSelection(
                  val.currentKey as PerformanceGraphOptionType,
                )
              }
            />

            <Selection
              items={PeriodOptions}
              selectedKeys={[period]}
              isDisabled={overviewGraph !== "Response"}
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
              {overviewGraph === "Difficulty" && isQuizForm && (
                <Card aria-label="QuestionDifficulty Chart">
                  <CardHeader>
                    <h4 className="text-base font-semibold">
                      Question Difficulty
                    </h4>
                  </CardHeader>
                  <CardBody>
                    {!perfData.performanceMetrics.difficultQuestions ||
                    perfData.performanceMetrics.difficultQuestions.length ===
                      0 ? (
                      <p className="text-sm text-gray-500 text-center py-8">
                        No question difficulty data available.
                      </p>
                    ) : (
                      <ul className="divide-y divide-gray-100">
                        {perfData.performanceMetrics.difficultQuestions.map(
                          (q, idx) => {
                            const pct = Number((q.accuracy * 100).toFixed(1));
                            const color =
                              pct < 40
                                ? "text-red-600 bg-red-50"
                                : pct < 70
                                  ? "text-yellow-600 bg-yellow-50"
                                  : "text-green-600 bg-green-50";
                            return (
                              <li
                                key={q.questionId}
                                className="flex items-center justify-between py-3 gap-4"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <span className="text-xs font-medium text-gray-400 w-5 shrink-0">
                                    {idx + 1}
                                  </span>
                                  <span className="text-sm text-gray-800 truncate">
                                    {q.questionId}
                                  </span>
                                </div>
                                <span
                                  className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${color}`}
                                >
                                  {pct}%
                                </span>
                              </li>
                            );
                          },
                        )}
                      </ul>
                    )}
                  </CardBody>
                </Card>
              )}

              {overviewGraph === "Top" && isQuizForm && (
                <Card aria-label="TopScorer Chart">
                  <CardHeader>
                    <h4 className="text-base font-semibold">Top Scorers</h4>
                  </CardHeader>
                  <CardBody>
                    {!perfData.performanceMetrics.topPerformers ||
                    perfData.performanceMetrics.topPerformers.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-8">
                        No top scorer data available.
                      </p>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={perfData.performanceMetrics.topPerformers.map(
                            (performer, idx) => ({
                              rank: `${idx + 1}`,
                              name: performer.name.substring(0, 20),
                              score: Number(performer.score.toFixed(2)),
                              fullName: performer.name,
                            }),
                          )}
                          margin={{
                            top: 5,
                            right: 10,
                            left: 0,
                            bottom: 60,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="name"
                            tick={{ fontSize: 10 }}
                            angle={-35}
                            textAnchor="end"
                            interval={0}
                            height={80}
                          />
                          <YAxis
                            tick={{ fontSize: 11 }}
                            label={{
                              value: "Score",
                              angle: -90,
                              position: "insideLeft",
                              style: { fontSize: 11 },
                            }}
                          />
                          <Tooltip content={<ChartTooltip />} />
                          <Legend wrapperStyle={{ paddingTop: 16 }} />
                          <Bar
                            dataKey="score"
                            fill={CHART_COLORS.secondary}
                            radius={[4, 4, 0, 0]}
                            name="Score"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardBody>
                </Card>
              )}

              {overviewGraph === "Response" && (
                <>
                  {isQuizForm ? (
                    <Card aria-label="TimeseriesChart Card">
                      <CardHeader>
                        <h4 className="text-base font-semibold">
                          Responses & Average Score Over Time
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
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <Card
                        aria-label="DailyVolume Chart"
                        className="col-span-2"
                      >
                        <CardHeader>
                          <h4 className="text-base font-semibold">
                            Daily Response Volume
                          </h4>
                        </CardHeader>
                        <CardBody>
                          {dailyVolumeChartData.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-8">
                              No data available for this period.
                            </p>
                          ) : (
                            <ResponsiveContainer width="100%" height={260}>
                              <BarChart
                                data={dailyVolumeChartData}
                                margin={{
                                  top: 5,
                                  right: 10,
                                  left: 0,
                                  bottom: 60,
                                }}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                  dataKey="date"
                                  tick={{ fontSize: 11 }}
                                  angle={-35}
                                  textAnchor="end"
                                  interval={0}
                                />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip content={<ChartTooltip />} />
                                <Legend wrapperStyle={{ paddingTop: 16 }} />
                                <Bar
                                  dataKey="Responses"
                                  fill={CHART_COLORS.secondary}
                                  radius={[4, 4, 0, 0]}
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          )}
                        </CardBody>
                      </Card>
                    </div>
                  )}
                </>
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
                  isQuizForm
                    ? {
                        label: "Avg.Score",
                        value: perfData.averageScore.toFixed(2),
                        color: "text-green-600",
                        bg: "bg-green-50",
                      }
                    : {
                        label: "Total Submitted",
                        value: perfData.totalResponses,
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
                ]?.map((stat) => (
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
