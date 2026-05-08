import { QuestionType } from "../../types/Form.types";
import { FormDataType } from "../../types/Form.types";

export enum GraphType {
  BAR = "Bar",
  PIE = "Pie",
  SCATTER = "Scatter",
  DOUGHNUT = "Doughnut",
  LINE = "Line",
  TIMESERIES = "Timeseries",
}

export interface ResponseAnalyticsProps {
  formId: string;
  form: FormDataType;
}

export interface FormStats {
  totalResponses: number;
  completedResponses: number;
  partialResponses: number;
  completionRate: number;
  averageScore: number;
  maxPossibleScore: number;
}

export interface ChoiceDistribution {
  choiceIdx: number;
  choiceContent: string;
  count: number;
  percentage: number;
  correctCount?: number;
  isCorrectAnswer?: boolean;
}

export interface GraphDataset {
  label?: string;
  data: number[];
  backgroundColor: string | string[];
  borderColor: string | string[];
  borderWidth: number;
}

export interface GraphData {
  labels: string[];
  datasets: GraphDataset[];
}

export interface QuestionAnalytics {
  questionId: string;
  questionTitle: string;
  questionType: QuestionType;
  questionIndex: number | undefined;
  totalResponses: number;
  responseRate: number;
  analytics: {
    distribution?: ChoiceDistribution[];
    correctAnswerRate?: number;
    averageScore?: number;
    graphs?: {
      bar?: GraphData;
      doughnut?: GraphData;
      pie?: GraphData;
      line?: GraphData;
    };
    recommendedGraphs?: Array<GraphType>;
    statistics?: {
      min?: number | string;
      max?: number | string;
      mean?: number | string;
      median?: number | string;
      range?: number;
      earliest?: string;
      latest?: string;
      mostCommon?: string;
    };
    histogram?: {
      bins: Array<{ min: number; max: number; count: number; label: string }>;
      labels: string[];
      datasets: GraphDataset[];
    };
    scatter?: {
      data: Array<{
        x: number;
        y: number;
        startValue: string | number;
        endValue: string | number;
      }>;
      datasets: Array<{
        label: string;
        data: Array<{
          x: number;
          y: number;
          startValue: string | number;
          endValue: string | number;
        }>;
        backgroundColor: string;
        borderColor: string;
        borderWidth: number;
        pointRadius: number;
        pointHoverRadius: number;
      }>;
      xAxisLabel: string;
      yAxisLabel: string;
    };
    textMetrics?: {
      averageLength: number;
      averageWordCount: number;
      minLength: number;
      maxLength: number;
    };
    topWords?: Array<{ word: string; count: number }>;
    sampleResponses?: Array<{
      id: number;
      response: string;
      wordCount: number;
      characterCount: number;
    }>;
    totalUniqueWords?: number;
    message?: string;
  };
}

export interface AnalyticsData {
  formId: string;
  formTitle: string;
  page?: number;
  totalResponses: number;
  formStats: FormStats;
  questions: QuestionAnalytics[];
  timestamp: string;
  isResponse: boolean;
}

export type PeriodType = "7d" | "30d" | "90d" | "all";

export interface TimeSeriesPoint {
  date: string;
  responses: number;
  averageScore: number;
}

export interface TopPerformer {
  name: string;
  email: string | null;
  score: number;
}

export interface DifficultQuestion {
  questionId: string;
  title: string;
  accuracy: number;
  averageScore: number;
}

export interface OverviewPerformanceData {
  totalResponses: number;
  completedResponses: number;
  averageScore: number;
  responseRate: number;
  averageCompletionTime: number;
  timeSeriesData: TimeSeriesPoint[];
  performanceMetrics: {
    topPerformers: TopPerformer[];
    difficultQuestions: DifficultQuestion[];
  };
}
