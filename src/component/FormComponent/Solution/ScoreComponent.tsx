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
        comment: comment.trim() || undefined,
      });
      setHasChanged(false);
    }
  }, [validateScore, localScore, onScoreChange, comment]);

  // Handle blur with conditions
  const handleInputBlur = useCallback(() => {
    // Only submit on blur if both inputs have values and no errors
    const hasBothInputs = localScore > 0 && comment.trim().length > 0;
    const isValid = !error && validateScore(localScore);

    if (hasBothInputs && isValid && hasChanged) {
      handleSubmit();
    }
  }, [localScore, comment, error, validateScore, hasChanged, handleSubmit]);

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
    <Card className="w-full p-6 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 shadow-sm">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">Score Entry</h3>
          {scoreStatus === "success" && Number(score) > 0 && (
            <div className="flex items-center gap-1.5 text-green-600">
              <CheckCircleIcon className="w-5 h-5" />
              <span className="text-sm font-medium">Complete</span>
            </div>
          )}
        </div>

        {/* Score Input Section */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-slate-700">Score</label>
          <div className="flex items-end gap-3">
            <Input
              aria-label="score input"
              type="number"
              value={score}
              onValueChange={handleScoreChange}
              startContent={
                <span className="text-slate-500 text-sm font-medium">pts</span>
              }
              endContent={
                <span className={`text-sm font-medium ${getColorClass()}`}>
                  /{maxScore}
                </span>
              }
              onBlur={handleInputBlur}
              placeholder="0"
              min="0"
              max={maxScore}
              className="flex-1"
              classNames={{
                input: "font-semibold text-center",
                inputWrapper: "border-slate-300",
              }}
              isInvalid={!!error}
              errorMessage={error}
            />
            <div className={`text-sm font-semibold ${getColorClass()}`}>
              {scorePercentage.toFixed(0)}%
            </div>
          </div>

          {/* Progress Bar */}
          <Progress
            value={Math.min(scorePercentage, 100)}
            color={getProgressColor()}
            className="h-2"
            classNames={{
              track: "bg-slate-200",
            }}
          />

          {/* Score Status Text */}
          <div className="text-xs text-slate-600 text-center">
            {localScore === 0
              ? "Enter a score to get started"
              : localScore === maxScore
              ? "Perfect score achieved! 🎉"
              : `${score} out of ${maxScore} points`}
          </div>
        </div>

        {/* Comment Section */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Feedback (Optional)
          </label>
          <Input
            type="text"
            value={comment}
            onValueChange={handleCommentChange}
            aria-label="Comment"
            placeholder="Add feedback or notes..."
            onBlur={handleInputBlur}
            className="w-full"
            classNames={{
              inputWrapper: "border-slate-300",
            }}
            maxLength={500}
          />
          <div className="text-xs text-slate-500 text-right">
            {comment.length}/500
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <ExclamationCircleIcon className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}
      </div>
    </Card>
  );
};
