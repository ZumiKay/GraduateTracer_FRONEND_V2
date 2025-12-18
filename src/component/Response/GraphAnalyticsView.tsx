import React, { useState, memo } from "react";
import { Card, CardHeader, CardBody, Button, Chip } from "@heroui/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";
import { QuestionAnalytics } from "./ResponseAnalytics.types";
import { COLORS, convertToRechartsFormat } from "./ResponseAnalytics.utils";

interface GraphAnalyticsViewProps {
  questions: QuestionAnalytics[];
  formColor?: string;
}

// Custom tooltip component for dark mode support
const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color?: string }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-3 shadow-lg">
        {label && (
          <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">
            {label}
          </p>
        )}
        {payload.map((entry, index) => (
          <p key={index} className="text-sm text-gray-700 dark:text-gray-300">
            <span style={{ color: entry.color }}>{entry.name}:</span>{" "}
            {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const GraphAnalyticsView: React.FC<GraphAnalyticsViewProps> = memo(
  ({ questions }) => {
    const [selectedGraphType, setSelectedGraphType] = useState<{
      [key: string]: string;
    }>({});

    return (
      <div className="space-y-8 pb-8">
        {questions.map((question) => {
          const analytics = question.analytics;
          const hasGraphs = analytics.graphs && analytics.recommendedGraphs;
          const hasDistribution =
            analytics.distribution && analytics.distribution.length > 0;
          const hasHistogram = analytics.histogram;
          const hasScatter =
            analytics.scatter && analytics.scatter.data.length > 0;
          const hasTextMetrics = analytics.textMetrics;
          const hasStatistics = analytics.statistics;

          const currentGraphType =
            selectedGraphType[question.questionId] ||
            (analytics.recommendedGraphs?.[0] ?? "bar");

          return (
            <Card
              key={question.questionId}
              className="shadow-xl border border-gray-100 dark:border-gray-700"
            >
              <CardHeader className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 pb-6">
                <div className="w-full space-y-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="w-full h-fit"></div>
                      <div className="flex items-center gap-3 mb-3">
                        <Chip
                          size="lg"
                          variant="shadow"
                          color="primary"
                          className="font-semibold"
                        >
                          Q{question.questionId}
                        </Chip>
                        <Chip
                          size="sm"
                          variant="bordered"
                          color="default"
                          className="dark:text-gray-200 dark:border-gray-500"
                        >
                          {question.questionType}
                        </Chip>
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-3 leading-tight">
                        {question.questionTitle}
                      </h3>
                      <div className="flex gap-2 flex-wrap">
                        <Chip
                          size="sm"
                          variant="flat"
                          color="secondary"
                          className="font-medium"
                        >
                          📊 {question.totalResponses} responses
                        </Chip>
                        {analytics.correctAnswerRate !== undefined && (
                          <Chip
                            size="sm"
                            variant="flat"
                            color="success"
                            className="font-medium"
                          >
                            ✓ {analytics.correctAnswerRate.toFixed(1)}% accuracy
                          </Chip>
                        )}
                        {analytics.averageScore !== undefined && (
                          <Chip
                            size="sm"
                            variant="flat"
                            color="warning"
                            className="font-medium"
                          >
                            ⭐ Avg: {analytics.averageScore.toFixed(2)}
                          </Chip>
                        )}
                      </div>
                    </div>

                    {hasGraphs && (
                      <div className="flex gap-2 flex-wrap">
                        {analytics.recommendedGraphs?.map((graphType) => (
                          <Button
                            key={graphType}
                            size="sm"
                            radius="full"
                            variant={
                              currentGraphType === graphType
                                ? "bordered"
                                : "solid"
                            }
                            color={
                              currentGraphType === graphType
                                ? "primary"
                                : "default"
                            }
                            onPress={() =>
                              setSelectedGraphType((prev) => ({
                                ...prev,
                                [question.questionId]: graphType,
                              }))
                            }
                            className="font-medium"
                          >
                            {graphType.charAt(0).toUpperCase() +
                              graphType.slice(1)}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardBody className="p-6">
                {hasGraphs && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                      <h4 className="font-bold text-lg mb-4 text-gray-700 dark:text-gray-200 flex items-center gap-2">
                        📈{" "}
                        {currentGraphType.charAt(0).toUpperCase() +
                          currentGraphType.slice(1)}{" "}
                        Chart
                      </h4>
                      <ResponsiveContainer width="100%" height={350}>
                        {currentGraphType === "doughnut" ? (
                          <PieChart>
                            <Pie
                              data={convertToRechartsFormat(
                                analytics.graphs?.doughnut
                              )}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={90}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, value }) => `${name}: ${value}`}
                            >
                              {convertToRechartsFormat(
                                analytics.graphs?.doughnut
                              ).map((entry, idx) => (
                                <Cell key={`cell-${idx}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                          </PieChart>
                        ) : currentGraphType === "pie" ? (
                          <PieChart>
                            <Pie
                              data={convertToRechartsFormat(
                                analytics.graphs?.pie
                              )}
                              cx="50%"
                              cy="50%"
                              outerRadius={90}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, value }) => `${name}: ${value}`}
                            >
                              {convertToRechartsFormat(
                                analytics.graphs?.pie
                              ).map((entry, idx) => (
                                <Cell key={`cell-${idx}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                          </PieChart>
                        ) : (
                          <BarChart
                            data={convertToRechartsFormat(
                              analytics.graphs?.bar
                            )}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Bar dataKey="value" name="Response Count">
                              {convertToRechartsFormat(
                                analytics.graphs?.bar
                              ).map((entry, idx) => (
                                <Cell key={`cell-${idx}`} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        )}
                      </ResponsiveContainer>
                    </div>

                    {hasDistribution && analytics.distribution && (
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                        <h4 className="font-bold text-lg mb-4 text-gray-700 dark:text-gray-200 flex items-center gap-2">
                          📋 Distribution Details
                        </h4>
                        <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                          {analytics.distribution.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 rounded-lg hover:shadow-md transition-shadow duration-200 border border-gray-100 dark:border-gray-600"
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-4 h-4 rounded"
                                  style={{
                                    backgroundColor:
                                      COLORS[idx % COLORS.length],
                                  }}
                                />
                                <span className="text-sm font-medium dark:text-gray-200">
                                  {item.choiceContent}
                                </span>
                                {item.isCorrectAnswer && (
                                  <Chip
                                    size="sm"
                                    variant="flat"
                                    color="success"
                                  >
                                    ✓ Correct
                                  </Chip>
                                )}
                              </div>
                              <div className="flex gap-3 items-center">
                                <Chip size="sm" variant="flat" color="primary">
                                  {item.count} ({item.percentage.toFixed(1)}%)
                                </Chip>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {hasHistogram && analytics.histogram && (
                  <div className="mt-6 bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-100 dark:border-gray-700">
                    <h4 className="font-bold text-lg mb-4 text-gray-700 dark:text-gray-200 flex items-center gap-2">
                      📊 Distribution Histogram
                    </h4>
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={analytics.histogram.bins}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar dataKey="count" fill="#36A2EB" name="Frequency" />
                      </BarChart>
                    </ResponsiveContainer>
                    {hasStatistics && analytics.statistics && (
                      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                        {analytics.statistics.min !== undefined && (
                          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg shadow-sm border border-blue-200 dark:border-blue-700">
                            <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide mb-1">
                              Minimum
                            </p>
                            <p className="font-bold text-gray-900 dark:text-gray-100">
                              {typeof analytics.statistics.min === "string"
                                ? new Date(
                                    analytics.statistics.min
                                  ).toLocaleDateString()
                                : analytics.statistics.min}
                            </p>
                          </div>
                        )}
                        {analytics.statistics.max !== undefined && (
                          <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-lg shadow-sm border border-green-200 dark:border-green-700">
                            <p className="text-xs font-semibold text-green-700 dark:text-green-300 uppercase tracking-wide mb-1">
                              Maximum
                            </p>
                            <p className="font-bold text-gray-900 dark:text-gray-100">
                              {typeof analytics.statistics.max === "string"
                                ? new Date(
                                    analytics.statistics.max
                                  ).toLocaleDateString()
                                : analytics.statistics.max}
                            </p>
                          </div>
                        )}
                        {analytics.statistics.mean !== undefined && (
                          <div className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 rounded-lg shadow-sm border border-yellow-200 dark:border-yellow-700">
                            <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-300 uppercase tracking-wide mb-1">
                              Mean
                            </p>
                            <p className="font-bold text-gray-900 dark:text-gray-100">
                              {typeof analytics.statistics.mean === "string"
                                ? new Date(
                                    analytics.statistics.mean
                                  ).toLocaleDateString()
                                : typeof analytics.statistics.mean === "number"
                                ? analytics.statistics.mean.toFixed(2)
                                : analytics.statistics.mean}
                            </p>
                          </div>
                        )}
                        {analytics.statistics.median !== undefined && (
                          <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-lg shadow-sm border border-purple-200 dark:border-purple-700">
                            <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wide mb-1">
                              Median
                            </p>
                            <p className="font-bold text-gray-900 dark:text-gray-100">
                              {typeof analytics.statistics.median === "string"
                                ? new Date(
                                    analytics.statistics.median
                                  ).toLocaleDateString()
                                : typeof analytics.statistics.median ===
                                  "number"
                                ? analytics.statistics.median.toFixed(2)
                                : analytics.statistics.median}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {hasScatter && analytics.scatter && (
                  <div className="mt-6 bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-100 dark:border-gray-700">
                    <h4 className="font-bold text-lg mb-4 text-gray-700 dark:text-gray-200 flex items-center gap-2">
                      📍 Scatter Plot - Start vs End Values
                    </h4>
                    <ResponsiveContainer width="100%" height={450}>
                      <ScatterChart
                        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          type="number"
                          dataKey="x"
                          name={analytics.scatter.xAxisLabel}
                          domain={["auto", "auto"]}
                          label={{
                            value: analytics.scatter.xAxisLabel,
                            position: "insideBottom",
                            offset: -10,
                          }}
                          tickFormatter={(value) => {
                            if (
                              analytics.scatter?.xAxisLabel.includes("Date")
                            ) {
                              return new Date(value).toLocaleDateString();
                            }
                            return value.toString();
                          }}
                        />
                        <YAxis
                          type="number"
                          dataKey="y"
                          name={analytics.scatter.yAxisLabel}
                          domain={["auto", "auto"]}
                          label={{
                            value: analytics.scatter.yAxisLabel,
                            angle: -90,
                            position: "insideLeft",
                          }}
                          tickFormatter={(value) => {
                            if (
                              analytics.scatter?.yAxisLabel.includes("Date")
                            ) {
                              return new Date(value).toLocaleDateString();
                            }
                            return value.toString();
                          }}
                        />
                        <ZAxis range={[100, 400]} />
                        <Tooltip
                          cursor={{ strokeDasharray: "3 3" }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              const isDate =
                                analytics.scatter?.xAxisLabel.includes("Date");
                              return (
                                <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-600 rounded shadow-lg">
                                  <p className="font-semibold mb-2 text-gray-900 dark:text-gray-100">
                                    Range Values
                                  </p>
                                  <p className="text-sm text-gray-700 dark:text-gray-300">
                                    <span className="font-medium">
                                      {analytics.scatter?.xAxisLabel}:
                                    </span>{" "}
                                    {isDate
                                      ? new Date(
                                          data.startValue
                                        ).toLocaleDateString()
                                      : data.startValue}
                                  </p>
                                  <p className="text-sm text-gray-700 dark:text-gray-300">
                                    <span className="font-medium">
                                      {analytics.scatter?.yAxisLabel}:
                                    </span>{" "}
                                    {isDate
                                      ? new Date(
                                          data.endValue
                                        ).toLocaleDateString()
                                      : data.endValue}
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend />
                        <Scatter
                          name={analytics.scatter.datasets[0].label}
                          data={analytics.scatter.data}
                          fill={analytics.scatter.datasets[0].backgroundColor}
                        />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {hasTextMetrics && analytics.textMetrics && (
                  <div className="space-y-6 mt-6">
                    <h4 className="font-bold text-lg text-gray-700 dark:text-white flex items-center gap-2">
                      📝 Text Metrics
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg shadow-sm border border-blue-200 dark:border-blue-700">
                        <p className="text-xs text-gray-600 dark:text-blue-300">
                          Avg Length
                        </p>
                        <p className="font-bold text-gray-900 dark:text-gray-100">
                          {analytics.textMetrics.averageLength} chars
                        </p>
                      </div>
                      <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded border border-green-200 dark:border-green-700">
                        <p className="text-xs text-gray-600 dark:text-green-300">
                          Avg Words
                        </p>
                        <p className="font-bold text-gray-900 dark:text-gray-100">
                          {analytics.textMetrics.averageWordCount}
                        </p>
                      </div>
                      <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded border border-yellow-200 dark:border-yellow-700">
                        <p className="text-xs text-gray-600 dark:text-yellow-300">
                          Min Length
                        </p>
                        <p className="font-bold text-gray-900 dark:text-gray-100">
                          {analytics.textMetrics.minLength}
                        </p>
                      </div>
                      <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded border border-purple-200 dark:border-purple-700">
                        <p className="text-xs text-gray-600 dark:text-purple-300">
                          Max Length
                        </p>
                        <p className="font-bold text-gray-900 dark:text-gray-100">
                          {analytics.textMetrics.maxLength}
                        </p>
                      </div>
                    </div>

                    {analytics.topWords && analytics.topWords.length > 0 && (
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <h4 className="font-bold text-base mb-3 text-gray-700 dark:text-gray-200">
                          💬 Most Common Words
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {analytics.topWords.slice(0, 15).map((word, idx) => (
                            <Chip key={idx} size="sm" variant="solid">
                              {word.word} ({word.count})
                            </Chip>
                          ))}
                        </div>
                      </div>
                    )}

                    {analytics.sampleResponses &&
                      analytics.sampleResponses.length > 0 && (
                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                          <h4 className="font-bold text-base mb-3 text-gray-700 dark:text-gray-200">
                            💭 Sample Responses
                          </h4>
                          <div className="space-y-2">
                            {analytics.sampleResponses.map((sample) => (
                              <div
                                key={sample.id}
                                className="p-3 bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow duration-200"
                              >
                                <p className="text-sm mb-1 text-gray-800 dark:text-gray-200">
                                  {sample.response}
                                </p>
                                <div className="flex gap-2 text-xs text-gray-600 dark:text-white">
                                  <span>{sample.wordCount} words</span>
                                  <span>•</span>
                                  <span>{sample.characterCount} chars</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                )}

                {hasStatistics &&
                  !hasHistogram &&
                  !hasTextMetrics &&
                  !hasGraphs &&
                  analytics.statistics && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      {Object.entries(analytics.statistics).map(
                        ([key, value]) => (
                          <div
                            key={key}
                            className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600"
                          >
                            <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                              {key}
                            </p>
                            <p className="font-bold text-gray-900 dark:text-gray-100">
                              {typeof value === "string"
                                ? value.includes("T")
                                  ? new Date(value).toLocaleDateString()
                                  : value
                                : typeof value === "number"
                                ? value.toFixed(2)
                                : value}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  )}

                {analytics.message && (
                  <div className="text-center p-12 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-gray-600 dark:text-gray-300 text-lg">
                      {analytics.message}
                    </p>
                  </div>
                )}
              </CardBody>
            </Card>
          );
        })}
      </div>
    );
  }
);

GraphAnalyticsView.displayName = "GraphAnalyticsView";
export default GraphAnalyticsView;
