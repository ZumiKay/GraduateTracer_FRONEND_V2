import { useState, useCallback, useMemo } from "react";
import { Input, Card, Progress } from "@heroui/react";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/solid";

interface ScoreModeInput {
  maxScore: number;
  onScoreChange: (props: { score: number; comment?: string }) => void;
  initialScore?: number;
  initialComment?: string;
}

export const ScoreModeInput = ({
  maxScore,
  onScoreChange,
  initialScore = 0,
  initialComment = "",
}: ScoreModeInput) => {
  const [score, setScore] = useState<string>(initialScore.toString());
  const localScore = useMemo(
    () => (isNaN(Number(score)) ? 0 : Number(score)),
    [score]
  );
  const [comment, setComment] = useState<string>(initialComment);
  const [hasChanged, setHasChanged] = useState(false);
  const [error, setError] = useState<string>("");

  // Calculate score percentage
  const scorePercentage = (localScore / maxScore) * 100;

  // Determine score status
  const getScoreStatus = () => {
    if (localScore === 0) return "neutral";
    if (localScore >= maxScore * 0.8) return "success";
    if (localScore >= maxScore * 0.5) return "warning";
    return "error";
  };

  const scoreStatus = getScoreStatus();

  // Validate score input
  const validateScore = useCallback(
    (value: number): boolean => {
      if (isNaN(value) || value === null) {
        setError("Invalid score");
        return false;
      }
      if (value < 0) {
        setError("Score cannot be negative");
        return false;
      }
      if (value > maxScore) {
        setError(`Score cannot exceed ${maxScore}`);
        return false;
      }
      setError("");
      return true;
    },
    [maxScore]
  );

  // Handle score change
  const handleScoreChange = useCallback(
    (value: string) => {
      const numValue = value === "" ? 0 : Number(value);

      if (validateScore(numValue)) {
        setScore(value);
        setHasChanged(true);
      }
    },
    [validateScore]
  );

  // Handle comment change
  const handleCommentChange = useCallback((value: string) => {
    setComment(value);
    setHasChanged(true);
  }, []);

  // Submit changes
  const handleSubmit = useCallback(() => {
    if (validateScore(localScore)) {
      onScoreChange({
        score: localScore,
        comment: comment || undefined,
      });
      setHasChanged(false);
    }
  }, [validateScore, localScore, onScoreChange, comment]);

  // Handle blur with conditions
  const handleInputBlur = useCallback(() => {
    const isValid = !error && validateScore(localScore);

    if (isValid && hasChanged) {
      handleSubmit();
    }
  }, [localScore, error, validateScore, hasChanged, handleSubmit]);

  // Get color based on status
  const getColorClass = () => {
    switch (scoreStatus) {
      case "success":
        return "text-green-600";
      case "warning":
        return "text-amber-600";
      case "error":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  //Get color for progress bar
  const getProgressColor = () => {
    switch (scoreStatus) {
      case "success":
        return "success";
      case "warning":
        return "warning";
      case "error":
        return "danger";
      default:
        return "default";
    }
  };

  return (
    <Card className="w-full p-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-50 border-2 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
              <span className="text-white text-sm">★</span>
            </div>
            Score Entry
          </h3>
          {scoreStatus === "success" && Number(score) > 0 && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
              <CheckCircleIcon className="w-6 h-6" />
              <span className="text-base font-bold">Excellent!</span>
            </div>
          )}
        </div>

        {/* Score Input Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-base font-bold text-slate-800 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs">
                🎯
              </span>
              Score
            </label>
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
              Press Tab to move to feedback
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Input
              aria-label="score input"
              type="number"
              value={score}
              onValueChange={handleScoreChange}
              startContent=""
              endContent=""
              onBlur={handleInputBlur}
              placeholder="0"
              min="0"
              max={maxScore}
              className="flex-1"
              size="lg"
              classNames={{
                input: "text-3xl font-black text-center text-blue-700",
                inputWrapper:
                  "border-3 border-blue-300 shadow-md hover:border-blue-400 transition-colors h-20",
              }}
              isInvalid={!!error}
              errorMessage={error}
            />
            <div className="flex flex-col items-center gap-2 min-w-[120px]">
              <div className="text-5xl font-black text-slate-300">/</div>
            </div>
            <div className="flex flex-col items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl px-6 py-4 min-w-[120px] border-3 border-purple-200 shadow-md">
              <div className="text-4xl font-black text-purple-700">
                {maxScore}
              </div>
              <div className="text-xs text-purple-600 font-bold uppercase tracking-wide mt-1">
                Max
              </div>
            </div>
          </div>

          {/* Large Percentage Display */}
          <div className="bg-white rounded-xl p-5 border-2 border-slate-200 shadow-inner">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-slate-700">Progress</span>
              <div className={`text-3xl font-black ${getColorClass()}`}>
                {scorePercentage.toFixed(0)}%
              </div>
            </div>

            {/* Progress Bar */}
            <Progress
              value={Math.min(scorePercentage, 100)}
              color={getProgressColor()}
              size="lg"
              className="h-4"
              classNames={{
                track: "bg-slate-200",
                indicator: "shadow-md",
              }}
            />

            {/* Score Status Text */}
            <div className="text-sm text-slate-600 text-center font-medium mt-3">
              {localScore === 0
                ? "✏️ Enter a score to get started"
                : localScore === maxScore
                ? "🎉 Perfect score achieved!"
                : `${score} out of ${maxScore} points (${
                    scorePercentage >= 80
                      ? "👍 Great!"
                      : scorePercentage >= 50
                      ? "👌 Good!"
                      : "👊 Keep going!"
                  })`}
            </div>
          </div>
        </div>

        {/* Comment Section */}
        <div className="space-y-3">
          <label className="text-base font-bold text-slate-800 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 text-xs">
              💬
            </span>
            Feedback{" "}
            <span className="text-xs font-normal text-slate-500">
              (Optional)
            </span>
          </label>
          <Input
            type="text"
            value={comment}
            onValueChange={handleCommentChange}
            aria-label="Comment"
            placeholder="Add helpful feedback"
            onBlur={handleInputBlur}
            size="lg"
            className="w-full"
            classNames={{
              input: "text-base",
              inputWrapper:
                "border-2 border-slate-300 shadow-sm hover:border-blue-300 transition-colors",
            }}
            maxLength={500}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">
              💡 Tip: Provide constructive feedback to help improve
            </span>
            <span
              className={`text-xs font-medium ${
                comment.length > 450 ? "text-orange-600" : "text-slate-500"
              }`}
            >
              {comment.length}/500
            </span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border-2 border-red-300 rounded-xl shadow-sm">
            <ExclamationCircleIcon className="w-6 h-6 text-red-600 flex-shrink-0" />
            <span className="text-base font-medium text-red-700">{error}</span>
          </div>
        )}
      </div>
    </Card>
  );
};
