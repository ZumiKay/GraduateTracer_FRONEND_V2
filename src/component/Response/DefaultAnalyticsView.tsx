import React, { memo } from "react";
import { Card, CardHeader, CardBody, Chip, Progress } from "@heroui/react";
import { QuestionAnalytics } from "./ResponseAnalytics.types";

interface DefaultAnalyticsViewProps {
  questions: QuestionAnalytics[];
  formColor?: string;
}

const DefaultAnalyticsView: React.FC<DefaultAnalyticsViewProps> = memo(
  ({ questions, formColor }) => {
    return (
      <div className="space-y-6">
        {questions.map((question, index) => {
          const analytics = question.analytics;
          return (
            <Card
              key={question.questionId ?? `question-${index + 1}`}
              className="shadow-lg dark:bg-gray-800 dark:border-gray-700"
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start flex-wrap gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Chip size="sm" variant="flat" color="default">
                        Question {question.questionId}
                      </Chip>
                      <Chip size="sm" variant="flat" color="primary">
                        {question.questionType}
                      </Chip>
                    </div>
                    <h3 className="text-lg font-semibold dark:text-gray-100">
                      {question.questionTitle}
                    </h3>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Response Rate
                    </p>
                    <p className="text-lg font-bold dark:text-gray-100">
                      {question.responseRate.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {question.totalResponses} responses
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                <div className="p-6 bg-white dark:bg-gray-900 rounded-lg border dark:border-gray-700 shadow-sm">
                  <div className="mb-4">
                    <div
                      className="p-4 rounded-t-lg"
                      style={{ backgroundColor: formColor || "#f5f5f5" }}
                    >
                      <p className="text-sm font-medium text-gray-700 dark:text-black">
                        {question.questionTitle}
                      </p>
                    </div>
                    <div className="mt-4 space-y-3">
                      <div className="flex justify-between items-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                        <span className="text-sm font-medium dark:text-gray-300">
                          Total Responses
                        </span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          {question.totalResponses}
                        </span>
                      </div>
                      {analytics.correctAnswerRate !== undefined && (
                        <div className="flex justify-between items-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                          <span className="text-sm font-medium dark:text-gray-300">
                            Correct Answer Rate
                          </span>
                          <span className="font-bold text-green-600 dark:text-green-400">
                            {analytics.correctAnswerRate.toFixed(1)}%
                          </span>
                        </div>
                      )}

                      {analytics.distribution &&
                        analytics.distribution.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-sm font-semibold mb-2 dark:text-gray-200">
                              Response Distribution
                            </h4>
                            <div className="space-y-2">
                              {analytics.distribution.map((item, idx) => (
                                <div key={idx} className="space-y-1">
                                  <div className="flex justify-between text-sm dark:text-gray-300">
                                    <span>
                                      {item.choiceContent}
                                      {item.isCorrectAnswer && (
                                        <span className="text-green-600 ml-2">
                                          ✓
                                        </span>
                                      )}
                                    </span>
                                    <span className="font-medium">
                                      {item.count} ({item.percentage.toFixed(1)}
                                      %)
                                    </span>
                                  </div>
                                  <Progress
                                    value={item.percentage}
                                    className="h-2"
                                    color={
                                      item.isCorrectAnswer
                                        ? "success"
                                        : "primary"
                                    }
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      {analytics.statistics && (
                        <div className="mt-4">
                          <h4 className="text-sm font-semibold mb-2 dark:text-gray-200">
                            Statistics
                          </h4>
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries(analytics.statistics).map(
                              ([key, value]) =>
                                value !== undefined ? (
                                  <div
                                    key={key}
                                    className="p-2 bg-gray-50 dark:bg-gray-800 rounded"
                                  >
                                    <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                                      {key}
                                    </p>
                                    <p className="text-sm font-bold dark:text-gray-200">
                                      {typeof value === "string"
                                        ? value.includes("T")
                                          ? new Date(value).toLocaleDateString()
                                          : value
                                        : typeof value === "number"
                                        ? value.toFixed(2)
                                        : value}
                                    </p>
                                  </div>
                                ) : null
                            )}
                          </div>
                        </div>
                      )}
                      {analytics.textMetrics && (
                        <div className="mt-4">
                          <h4 className="text-sm font-semibold mb-2 dark:text-gray-200">
                            Text Analysis
                          </h4>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                Avg Length
                              </p>
                              <p className="text-sm font-bold dark:text-gray-200">
                                {analytics.textMetrics.averageLength} chars
                              </p>
                            </div>
                            <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                Avg Words
                              </p>
                              <p className="text-sm font-bold dark:text-gray-200">
                                {analytics.textMetrics.averageWordCount}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      {analytics.message && (
                        <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded text-center">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {analytics.message}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
    );
  }
);

DefaultAnalyticsView.displayName = "DefaultAnalyticsView";
export default DefaultAnalyticsView;
