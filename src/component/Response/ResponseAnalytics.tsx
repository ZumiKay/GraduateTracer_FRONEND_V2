import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Select,
  SelectItem,
  Chip,
  Progress,
  Tabs,
  Tab,
} from "@heroui/react";
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
  Area,
  AreaChart,
} from "recharts";
import {
  FiBarChart,
  FiTrendingUp,
  FiUsers,
  FiClock,
  FiTarget,
  FiDownload,
  FiRefreshCw,
} from "react-icons/fi";
import ApiRequest, { ApiRequestReturnType } from "../../hooks/ApiHook";
import { FormDataType } from "../../types/Form.types";

interface ResponseAnalyticsProps {
  formId: string;
  form: FormDataType;
}

interface AnalyticsData {
  totalResponses: number;
  completedResponses: number;
  averageScore: number;
  averageCompletionTime: number;
  responseRate: number;
  questionAnalytics: QuestionAnalytics[];
  scoreDistribution: ScoreDistribution[];
  timeSeriesData: TimeSeriesData[];
  performanceMetrics: PerformanceMetrics;
}

interface QuestionAnalytics {
  questionId: string;
  questionTitle: string;
  questionType: string;
  totalResponses: number;
  correctResponses: number;
  accuracy: number;
  averageScore: number;
  responseDistribution: ResponseDistribution[];
  commonAnswers: string[];
}

interface ResponseDistribution {
  option: string;
  count: number;
  percentage: number;
}

interface ScoreDistribution {
  scoreRange: string;
  count: number;
  percentage: number;
}

interface TimeSeriesData {
  date: string;
  responses: number;
  averageScore: number;
}

interface PerformanceMetrics {
  topPerformers: Array<{
    name: string;
    email: string;
    score: number;
    completionTime: number;
  }>;
  difficultQuestions: Array<{
    questionId: string;
    title: string;
    accuracy: number;
    averageScore: number;
  }>;
}

const COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4",
  "#84CC16",
  "#F97316",
  "#EC4899",
  "#6B7280",
];

const ResponseAnalytics: React.FC<ResponseAnalyticsProps> = ({
  formId,
  form,
}) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("7d");
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!formId) {
        console.log("No formId provided, skipping analytics fetch");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const result = (await ApiRequest({
          url: `/response/analytics/${formId}?period=${selectedPeriod}`,
          method: "GET",
        })) as ApiRequestReturnType;

        if (result.success && result.data) {
          setAnalytics(result.data as AnalyticsData);
        }
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [formId, selectedPeriod]);

  // Export analytics data
  const exportAnalytics = async (format: "pdf" | "csv") => {
    if (!formId) {
      console.error("No formId provided, cannot export analytics");
      return;
    }

    try {
      const result = (await ApiRequest({
        url: `/response/analytics/${formId}/export?format=${format}`,
        method: "GET",
      })) as ApiRequestReturnType;

      if (result.success) {
        const blob = new Blob([result.data as BlobPart]);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${form.title}-analytics.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error exporting analytics:", error);
    }
  };

  if (loading) {
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

  if (!analytics) {
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Response Analytics</h2>
          <p className="text-gray-600">
            Insights and statistics for {form.title}
          </p>
        </div>
        <div className="flex gap-2">
          <Select
            placeholder="Select period"
            selectedKeys={[selectedPeriod]}
            onSelectionChange={(keys) =>
              setSelectedPeriod(Array.from(keys)[0] as string)
            }
            className="w-32"
            size="sm"
          >
            <SelectItem key="7d">Last 7 days</SelectItem>
            <SelectItem key="30d">Last 30 days</SelectItem>
            <SelectItem key="90d">Last 90 days</SelectItem>
            <SelectItem key="all">All time</SelectItem>
          </Select>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => exportAnalytics("pdf")}
            startContent={<FiDownload />}
          >
            Export PDF
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => exportAnalytics("csv")}
            startContent={<FiDownload />}
          >
            Export CSV
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
                        {analytics.totalResponses}
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
                        {(
                          (analytics.completedResponses /
                            analytics.totalResponses) *
                          100
                        ).toFixed(1)}
                        %
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
                        {analytics.averageScore.toFixed(1)}
                        <span className="text-sm text-gray-500">
                          /{form.totalscore}
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
                      <p className="text-sm text-gray-600">Avg. Time</p>
                      <p className="text-2xl font-bold">
                        {Math.round(analytics.averageCompletionTime)}m
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Response Trends */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Response Trends</h3>
              </CardHeader>
              <CardBody>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analytics.timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="responses"
                      stackId="1"
                      stroke="#3B82F6"
                      fill="#3B82F6"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>

            {/* Score Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Score Distribution</h3>
                </CardHeader>
                <CardBody>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analytics.scoreDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ scoreRange, percentage }) =>
                          `${scoreRange} (${percentage}%)`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {analytics.scoreDistribution.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">
                    Performance Overview
                  </h3>
                </CardHeader>
                <CardBody className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm">Response Rate</span>
                      <span className="text-sm font-semibold">
                        {analytics.responseRate.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={analytics.responseRate} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm">Average Score</span>
                      <span className="text-sm font-semibold">
                        {(
                          (analytics.averageScore / (form.totalscore || 1)) *
                          100
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                    <Progress
                      value={
                        (analytics.averageScore / (form.totalscore || 1)) * 100
                      }
                      className="h-2"
                      color="success"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm">Completion Rate</span>
                      <span className="text-sm font-semibold">
                        {(
                          (analytics.completedResponses /
                            analytics.totalResponses) *
                          100
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                    <Progress
                      value={
                        (analytics.completedResponses /
                          analytics.totalResponses) *
                        100
                      }
                      className="h-2"
                      color="warning"
                    />
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        </Tab>

        <Tab key="questions" title="Question Analysis">
          <div className="space-y-4">
            {analytics.questionAnalytics.map((question, index) => (
              <Card key={question.questionId}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">
                        Question {index + 1}: {question.questionTitle}
                      </h3>
                      <div className="flex gap-2 mt-2">
                        <Chip size="sm" variant="flat" color="primary">
                          {question.questionType}
                        </Chip>
                        <Chip size="sm" variant="flat" color="success">
                          {question.accuracy.toFixed(1)}% accuracy
                        </Chip>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Responses</p>
                      <p className="text-lg font-bold">
                        {question.totalResponses}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">
                        Response Distribution
                      </h4>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={question.responseDistribution}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="option" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#3B82F6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div>
                      <h4 className="font-medium mb-3">Common Answers</h4>
                      <div className="space-y-2">
                        {question.commonAnswers
                          .slice(0, 5)
                          .map((answer, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between items-center p-2 bg-gray-50 rounded"
                            >
                              <span className="text-sm">{answer}</span>
                              <Chip size="sm" variant="flat">
                                {question.responseDistribution.find(
                                  (r) => r.option === answer
                                )?.count || 0}
                              </Chip>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </Tab>

        <Tab key="performance" title="Performance">
          <div className="space-y-6">
            {/* Top Performers */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Top Performers</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  {analytics.performanceMetrics.topPerformers.map(
                    (performer, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-blue-600">
                              #{index + 1}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{performer.name}</p>
                            <p className="text-sm text-gray-600">
                              {performer.email}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">
                            {performer.score} pts
                          </p>
                          <p className="text-sm text-gray-600">
                            {performer.completionTime}m
                          </p>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Difficult Questions */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">
                  Most Difficult Questions
                </h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  {analytics.performanceMetrics.difficultQuestions.map(
                    (question, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{question.title}</p>
                          <p className="text-sm text-gray-600">
                            Accuracy: {question.accuracy.toFixed(1)}%
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-red-600">
                            {question.averageScore.toFixed(1)} avg
                          </p>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </CardBody>
            </Card>
          </div>
        </Tab>
      </Tabs>
    </div>
  );
};

export default ResponseAnalytics;
