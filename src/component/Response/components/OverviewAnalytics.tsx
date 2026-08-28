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

    // Separate all-time query for performance metrics (Top Scorers & Question Difficulty)
    const {
      data: allTimeData,
      isLoading: isAllTimeLoading,
      isError: isAllTimeError,
    } = useQuery<OverviewPerformanceData>({
      queryKey: ["overviewPerformance", formId, "all"],
      queryFn: async () => {
        const params = new URLSearchParams({ formId, period: "all" });
        const result = await ApiRequest({
          url: `/response/getoverviewanalytic?${params.toString()}`,
          method: "GET",
          cookie: true,
          reactQuery: true,
        });
        if (!result.success)
          throw new Error(result.error ?? "Failed to fetch all-time analytics");
        return result.data as OverviewPerformanceData;
      },
      enabled: !!formId && isQuizForm,
      staleTime: 10 * 60 * 1000,
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
        {/* Key Metrics — all sourced from all-time data */}
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
                    {allTimeData?.totalResponses ??
                      perfData?.totalResponses ??
                      0}
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
                        {(
                          allTimeData?.averageScore ??
                          perfData?.averageScore ??
                          0
                        ).toFixed(1)}
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </>
          )}

          <Card aria-label="CompletionTime Card">
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FiClock className="text-purple-600 text-xl" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Avg. Completion Time</p>
                  <p className="text-2xl font-bold">
                    {allTimeData?.averageCompletionTime ??
                      perfData?.averageCompletionTime ??
                      "—"}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
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

          {isPerfLoading && overviewGraph === "Response" && (
            <div className="flex items-center justify-center h-48">
              <Spinner size="lg" color="primary" />
            </div>
          )}

          {isAllTimeLoading &&
            (overviewGraph === "Difficulty" || overviewGraph === "Top") && (
              <div className="flex items-center justify-center h-48">
                <Spinner size="lg" color="primary" />
              </div>
            )}

          {isPerfError && overviewGraph === "Response" && (
            <div className="flex items-center justify-center h-48 gap-2 text-danger">
              <FiAlertCircle className="text-xl" />
              <span className="text-sm">Failed to load performance data.</span>
            </div>
          )}

          {isAllTimeError &&
            (overviewGraph === "Difficulty" || overviewGraph === "Top") && (
              <div className="flex items-center justify-center h-48 gap-2 text-danger">
                <FiAlertCircle className="text-xl" />
                <span className="text-sm">Failed to load all-time data.</span>
              </div>
            )}

          {!isPerfLoading && !isPerfError && perfData && (
            <>
              {overviewGraph === "Difficulty" &&
                isQuizForm &&
                !isAllTimeLoading &&
                !isAllTimeError &&
                allTimeData && (
                  <Card aria-label="QuestionDifficulty Chart">
                    <CardHeader className="flex items-center justify-between">
                      <h4 className="text-base font-semibold">
                        Question Difficulty
                      </h4>
                      <span className="text-xs text-gray-400 font-medium">
                        All time
                      </span>
                    </CardHeader>
                    <CardBody>
                      {!allTimeData.performanceMetrics.difficultQuestions ||
                      allTimeData.performanceMetrics.difficultQuestions
                        .length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-8">
                          No question difficulty data available.
                        </p>
                      ) : (
                        <ul className="divide-y divide-gray-100">
                          {allTimeData.performanceMetrics.difficultQuestions.map(
                            (q, idx) => {
                              const fullPct = Math.round(q.accuracy * 100);
                              const avgPct =
                                q.averagePercent ??
                                Math.round(
                                  (q.averageScore / (q.maxScore || 1)) * 100,
                                );

                              const difficulty =
                                fullPct < 40
                                  ? {
                                      label: "Hard",
                                      badge:
                                        "text-red-700 bg-red-50 border border-red-200",
                                      bar: "bg-red-400",
                                    }
                                  : fullPct < 70
                                    ? {
                                        label: "Medium",
                                        badge:
                                          "text-yellow-700 bg-yellow-50 border border-yellow-200",
                                        bar: "bg-yellow-400",
                                      }
                                    : {
                                        label: "Easy",
                                        badge:
                                          "text-green-700 bg-green-50 border border-green-200",
                                        bar: "bg-green-400",
                                      };

                              return (
                                <li
                                  key={q.questionId}
                                  className="py-4 space-y-2"
                                >
                                  {/* Row 1: rank + title + difficulty badge */}
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className="text-xs font-medium text-gray-400 w-5 shrink-0">
                                        {idx + 1}
                                      </span>
                                      <span className="text-sm font-medium text-gray-800 line-clamp-2">
                                        Question {q.questionId}
                                        {q.title ? `: ${q.title}` : ""}
                                      </span>
                                      {q.isConditional && (
                                        <span className="shrink-0 text-xs font-medium px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-200">
                                          Conditional
                                        </span>
                                      )}
                                    </div>
                                    <span
                                      className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${difficulty.badge}`}
                                    >
                                      {difficulty.label}
                                    </span>
                                  </div>

                                  {/* Row 2: progress bar (avg score %) */}
                                  <div className="pl-7">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-xs text-gray-500">
                                        Avg. score
                                      </span>
                                      <span className="text-xs font-semibold text-gray-700 ml-auto">
                                        {avgPct}%
                                      </span>
                                    </div>
                                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full rounded-full ${difficulty.bar}`}
                                        style={{ width: `${avgPct}%` }}
                                      />
                                    </div>
                                  </div>

                                  {/* Row 3: stat pills */}
                                  <div className="pl-7 flex items-center gap-3 text-xs text-gray-500">
                                    <span>
                                      <span className="font-medium text-gray-700">
                                        {fullPct}%
                                      </span>{" "}
                                      full marks
                                    </span>
                                    <span className="text-gray-300">·</span>
                                    <span>
                                      <span className="font-medium text-gray-700">
                                        {q.responseCount ?? "—"}
                                      </span>{" "}
                                      responses
                                    </span>
                                    <span className="text-gray-300">·</span>
                                    <span>
                                      <span className="font-medium text-gray-700">
                                        {q.averageScore.toFixed(1)}
                                      </span>
                                      /<span>{q.maxScore}</span> pts
                                    </span>
                                  </div>
                                </li>
                              );
                            },
                          )}
                        </ul>
                      )}
                    </CardBody>
                  </Card>
                )}

              {overviewGraph === "Top" &&
                isQuizForm &&
                !isAllTimeLoading &&
                !isAllTimeError &&
                allTimeData && (
                  <Card aria-label="TopScorer Chart">
                    <CardHeader className="flex items-center justify-between">
                      <h4 className="text-base font-semibold">Top Scorers</h4>
                      <span className="text-xs text-gray-400 font-medium">
                        All time
                      </span>
                    </CardHeader>
                    <CardBody>
                      {!allTimeData.performanceMetrics.topPerformers ||
                      allTimeData.performanceMetrics.topPerformers.length ===
                        0 ? (
                        <p className="text-sm text-gray-500 text-center py-8">
                          No top scorer data available.
                        </p>
                      ) : (
                        <ul className="divide-y divide-gray-100">
                          {allTimeData.performanceMetrics.topPerformers.map(
                            (performer, idx) => {
                              const isTop3 = idx < 3;
                              const medalColors = [
                                "bg-yellow-400 text-white", // 1st — gold
                                "bg-gray-400 text-white", // 2nd — silver
                                "bg-amber-600 text-white", // 3rd — bronze
                              ];
                              const rowHighlight = [
                                "bg-yellow-50",
                                "bg-gray-50",
                                "bg-amber-50",
                              ];
                              const maxScore =
                                allTimeData.performanceMetrics.topPerformers[0]
                                  ?.score || 1;

                              return (
                                <li
                                  key={`${performer.name}-${idx}`}
                                  className={`flex items-center gap-4 py-3 px-2 rounded-lg ${isTop3 ? rowHighlight[idx] : ""}`}
                                >
                                  {/* Rank badge */}
                                  <span
                                    className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold shrink-0 ${
                                      isTop3
                                        ? medalColors[idx]
                                        : "bg-gray-100 text-gray-500"
                                    }`}
                                  >
                                    {idx + 1}
                                  </span>

                                  {/* Name */}
                                  <span
                                    className={`flex-1 text-sm truncate ${isTop3 ? "font-semibold text-gray-800" : "text-gray-700"}`}
                                  >
                                    {performer.name}
                                  </span>

                                  {/* Score bar */}
                                  <div className="hidden sm:flex flex-1 max-w-[120px] h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${isTop3 ? "bg-indigo-400" : "bg-gray-300"}`}
                                      style={{
                                        width: `${(performer.score / maxScore) * 100}%`,
                                      }}
                                    />
                                  </div>

                                  {/* Score value */}
                                  <span
                                    className={`text-sm font-semibold shrink-0 ${
                                      idx === 0
                                        ? "text-yellow-600"
                                        : idx === 1
                                          ? "text-gray-500"
                                          : idx === 2
                                            ? "text-amber-700"
                                            : "text-gray-600"
                                    }`}
                                  >
                                    {performer.score.toFixed(2)}
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
            </>
          )}
        </div>
      </div>
    );
  },
);

OverviewAnayticsTabs.displayName = "OverviewAnayticsTabs";

export default OverviewAnayticsTabs;
