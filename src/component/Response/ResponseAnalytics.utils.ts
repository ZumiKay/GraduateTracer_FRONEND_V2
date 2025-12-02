import { GraphData } from "./ResponseAnalytics.types";

export const COLORS = [
  "#FF6384",
  "#36A2EB",
  "#FFCE56",
  "#4BC0C0",
  "#9966FF",
  "#FF9F40",
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

export const convertToRechartsFormat = (chartData?: GraphData) => {
  if (!chartData || !chartData.datasets || chartData.datasets.length === 0) {
    return [];
  }

  const dataset = chartData.datasets[0];
  const bgColors = Array.isArray(dataset.backgroundColor)
    ? dataset.backgroundColor
    : [dataset.backgroundColor];

  return chartData.labels.map((label, index) => ({
    name: label,
    value: dataset.data[index],
    count: dataset.data[index],
    color: bgColors[index] || COLORS[index % COLORS.length],
  }));
};
