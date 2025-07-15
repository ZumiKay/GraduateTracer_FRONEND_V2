import React, { useState, useCallback, useMemo } from "react";
import { Input, Chip, Checkbox, Radio, RadioGroup } from "@heroui/react";
import { useDispatch } from "react-redux";
import { ContentType, QuestionType } from "../../../types/Form.types";
import { setdisbounceQuestion } from "../../../redux/formstore";

interface SolutionInputProps {
  content: ContentType;
  onUpdateContent: (updates: Partial<ContentType>) => void;
  isValidated?: boolean;
  hasAnswer?: boolean;
}

const SolutionInput: React.FC<SolutionInputProps> = ({
  content,
  onUpdateContent,
  isValidated = false,
  hasAnswer = false,
}) => {
  const dispatch = useDispatch();
  const [localAnswer, setLocalAnswer] = useState<string | number | number[]>(
    (content.answer?.answer as string | number | number[]) || ""
  );
  const [localScore, setLocalScore] = useState<number>(content.score || 0);

  const handleAnswerChange = useCallback(
    (answer: string | number | number[]) => {
      setLocalAnswer(answer);
      const updatedContent = {
        ...content,
        answer: { ...content.answer, answer },
        hasAnswer: true,
      };
      onUpdateContent(updatedContent);
      dispatch(setdisbounceQuestion(updatedContent));
    },
    [content, onUpdateContent, dispatch]
  );

  const handleScoreChange = useCallback(
    (score: number) => {
      setLocalScore(score);
      const updatedContent = {
        ...content,
        score,
      };
      onUpdateContent(updatedContent);
      dispatch(setdisbounceQuestion(updatedContent));
    },
    [content, onUpdateContent, dispatch]
  );

  const renderAnswerInput = useMemo(() => {
    switch (content.type) {
      case QuestionType.Text:
        // Text type questions are just for display, no answer key needed
        return (
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              Display text questions don't require answer keys.
            </p>
          </div>
        );

      case QuestionType.MultipleChoice:
        return (
          <div className="space-y-2">
            <p className="text-sm font-medium">Select correct answer:</p>
            <RadioGroup
              value={String(localAnswer)}
              onValueChange={(value) => handleAnswerChange(Number(value))}
            >
              {content.multiple?.map((option, index) => (
                <Radio key={index} value={String(index)}>
                  {option.content}
                </Radio>
              ))}
            </RadioGroup>
          </div>
        );

      case QuestionType.CheckBox:
        return (
          <div className="space-y-2">
            <p className="text-sm font-medium">Select correct answer(s):</p>
            {content.checkbox?.map((option, index) => (
              <Checkbox
                key={index}
                isSelected={
                  Array.isArray(localAnswer) && localAnswer.includes(index)
                }
                onValueChange={(checked) => {
                  const currentAnswers = Array.isArray(localAnswer)
                    ? localAnswer
                    : [];
                  const newAnswers = checked
                    ? [...currentAnswers, index]
                    : currentAnswers.filter((idx) => idx !== index);
                  handleAnswerChange(newAnswers);
                }}
              >
                {option.content}
              </Checkbox>
            ))}
          </div>
        );

      case QuestionType.ShortAnswer:
      case QuestionType.Paragraph:
        return (
          <Input
            label="Correct Answer"
            placeholder="Enter the correct answer"
            value={String(localAnswer)}
            onChange={(e) => handleAnswerChange(e.target.value)}
            variant="bordered"
          />
        );

      case QuestionType.Number:
        return (
          <Input
            label="Correct Answer"
            placeholder="Enter the correct number"
            type="number"
            value={String(localAnswer)}
            onChange={(e) => handleAnswerChange(Number(e.target.value))}
            variant="bordered"
          />
        );

      case QuestionType.Date:
        return (
          <Input
            label="Correct Date"
            type="date"
            value={localAnswer ? String(localAnswer) : ""}
            onChange={(e) => handleAnswerChange(e.target.value)}
            variant="bordered"
          />
        );

      case QuestionType.Selection:
        return (
          <div className="space-y-2">
            <p className="text-sm font-medium">Select correct options:</p>
            {content.selection?.map((option, index) => (
              <Checkbox
                key={index}
                isSelected={
                  Array.isArray(localAnswer) && localAnswer.includes(index)
                }
                onValueChange={(checked) => {
                  const currentAnswers = Array.isArray(localAnswer)
                    ? localAnswer
                    : [];
                  const newAnswers = checked
                    ? [...currentAnswers, index]
                    : currentAnswers.filter((idx) => idx !== index);
                  handleAnswerChange(newAnswers);
                }}
              >
                {option}
              </Checkbox>
            ))}
          </div>
        );

      default:
        return (
          <Input
            label="Answer"
            placeholder="Enter answer"
            value={String(localAnswer)}
            onChange={(e) => handleAnswerChange(e.target.value)}
            variant="bordered"
          />
        );
    }
  }, [content, localAnswer, handleAnswerChange]);

  const validationStatus = useMemo(() => {
    // Text type questions don't need answers or scores since they're just for display
    if (content.type === QuestionType.Text) {
      return { color: "success" as const, text: "Display text" };
    }

    if (!hasAnswer && !localScore) {
      return { color: "danger" as const, text: "Missing answer and score" };
    }
    if (!hasAnswer) {
      return { color: "warning" as const, text: "Missing answer" };
    }
    if (!localScore) {
      return { color: "warning" as const, text: "Missing score" };
    }
    if (isValidated) {
      return { color: "success" as const, text: "Valid" };
    }
    return { color: "default" as const, text: "Needs validation" };
  }, [hasAnswer, localScore, isValidated, content.type]);

  return (
    <div className="w-full space-y-4 p-4 bg-white rounded-lg border">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Solution Settings</h3>
        <Chip color={validationStatus.color} variant="flat" size="sm">
          {validationStatus.text}
        </Chip>
      </div>

      {/* Text type questions are just for display, no need for scoring */}
      {content.type === QuestionType.Text ? (
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              This is a display text question. No scoring or answer key
              required.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Score</label>
            <Input
              type="number"
              placeholder="Enter score points"
              value={localScore.toString()}
              onChange={(e) => handleScoreChange(Number(e.target.value))}
              variant="bordered"
              min="0"
              startContent={<span className="text-sm">pts</span>}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Answer Key</label>
            {renderAnswerInput}
          </div>
        </div>
      )}

      <div className="flex justify-end items-center pt-2 border-t">
        <div className="text-sm text-gray-500">
          {content.type === QuestionType.Text ? (
            "Display text only"
          ) : (
            <>
              {hasAnswer ? "✓ Has answer" : "⚠ No answer"}
              {" | "}
              {localScore > 0 ? `${localScore} pts` : "0 pts"}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SolutionInput;
