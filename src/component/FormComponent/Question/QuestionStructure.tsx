import { useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/store";
import { ContentType, QuestionType } from "../../../types/Form.types";
import {
  Button,
  Card,
  CardBody,
  Chip,
  Divider,
  ScrollShadow,
} from "@heroui/react";

// Eye icons
const EyeIcon = ({
  width = "16",
  height = "16",
}: {
  width?: string;
  height?: string;
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
      fill="currentColor"
    />
  </svg>
);

const EyeSlashIcon = ({
  width = "16",
  height = "16",
}: {
  width?: string;
  height?: string;
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"
      fill="currentColor"
    />
  </svg>
);

const XMarkIcon = ({
  width = "16",
  height = "16",
}: {
  width?: string;
  height?: string;
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M18.3 5.71c-.39-.39-1.02-.39-1.41 0L12 10.59 7.11 5.7c-.39-.39-1.02-.39-1.41 0s-.39 1.02 0 1.41L10.59 12 5.7 16.89c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0L12 13.41l4.89 4.89c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4z"
      fill="currentColor"
    />
  </svg>
);

interface QuestionStructureProps {
  onQuestionClick: (questionKey: string) => void;
  onToggleVisibility: (questionId: string | number) => void;
  currentPage: number;
  onClose?: () => void;
}

const QuestionStructure: React.FC<QuestionStructureProps> = ({
  onQuestionClick,
  onToggleVisibility,
  currentPage,
  onClose,
}) => {
  const allQuestion = useSelector(
    (root: RootState) => root.allform.allquestion
  );
  const showLinkedQuestion = useSelector(
    (root: RootState) => root.allform.showLinkedQuestions
  );
  const formState = useSelector((root: RootState) => root.allform.formstate);

  // Filter questions for current page and ensure they exist
  const filteredQuestions = useMemo(() => {
    if (!allQuestion || !Array.isArray(allQuestion)) {
      return [];
    }
    return allQuestion.filter((q) => q && q.page === currentPage);
  }, [allQuestion, currentPage]);

  // Get question type label
  const getQuestionTypeLabel = useCallback((type: QuestionType) => {
    switch (type) {
      case QuestionType.MultipleChoice:
        return "Multiple Choice";
      case QuestionType.CheckBox:
        return "Checkbox";
      case QuestionType.Text:
        return "Text";
      case QuestionType.ShortAnswer:
        return "Short Answer";
      case QuestionType.Paragraph:
        return "Paragraph";
      case QuestionType.Number:
        return "Number";
      case QuestionType.Date:
        return "Date";
      case QuestionType.RangeNumber:
        return "Range Number";
      case QuestionType.RangeDate:
        return "Range Date";
      case QuestionType.Selection:
        return "Selection";
      default:
        return "Unknown";
    }
  }, []);

  // Get question title text
  const getQuestionTitle = useCallback((question: ContentType) => {
    if (typeof question.title === "string") {
      return question.title;
    }
    if (question.title && typeof question.title === "object") {
      try {
        // Simple text extraction from TipTap content
        const titleStr = JSON.stringify(question.title);
        const textMatches = titleStr.match(/"text":"([^"]+)"/g);
        if (textMatches) {
          return textMatches
            .map((match) => match.replace(/"text":"([^"]+)"/, "$1"))
            .join(" ");
        }
      } catch (error) {
        console.error("Error parsing title:", error);
      }
    }
    return "Untitled Question";
  }, []);

  // Check if question visibility can be toggled
  const canToggleVisibility = useCallback((question: ContentType) => {
    return question.conditional && question.conditional.length > 0;
  }, []);

  // Check if question is currently visible
  const isQuestionVisible = useCallback(
    (question: ContentType) => {
      if (!canToggleVisibility(question)) return true;

      const questionId =
        question._id?.toString() || `temp-question-${Date.now()}`;
      const linkedQuestion = showLinkedQuestion?.find(
        (i) => i.question === questionId
      );
      return linkedQuestion?.show !== undefined ? linkedQuestion.show : true;
    },
    [showLinkedQuestion, canToggleVisibility]
  );

  // Get total questions count for current page
  const totalQuestionsOnPage = useMemo(
    () => filteredQuestions.length,
    [filteredQuestions]
  );

  // Build hierarchical structure with recursive nesting
  const buildQuestionHierarchy = useCallback(() => {
    const hierarchy: Array<ContentType & { children: ContentType[] }> = [];

    // Helper function to recursively build children
    const buildChildren = (
      parentId: string | number
    ): (ContentType & { children: ContentType[] })[] => {
      const children = filteredQuestions.filter(
        (q) => q.parentcontent?.qId === parentId
      );

      return children.map((child, index) => ({
        ...child,
        children: buildChildren(child._id || `temp-child-${parentId}-${index}`),
      }));
    };

    // First, add all parent questions (questions without parentcontent)
    filteredQuestions.forEach((question, index) => {
      if (!question.parentcontent) {
        hierarchy.push({
          ...question,
          children: buildChildren(question._id || `temp-parent-${index}`),
        });
      }
    });

    return hierarchy;
  }, [filteredQuestions]);

  const questionHierarchy = useMemo(() => {
    return buildQuestionHierarchy();
  }, [buildQuestionHierarchy]);

  // Get visible questions count (non-conditional or visible conditional questions)
  const visibleQuestionsCount = useMemo(() => {
    // Count questions that are actually visible in the hierarchy
    const countVisibleInHierarchy = (
      questions: (ContentType & { children: ContentType[] })[]
    ): number => {
      let count = 0;
      questions.forEach((question) => {
        // Count the question itself if it's visible
        if (isQuestionVisible(question)) {
          count += 1;
          // If the question is visible, also count its visible children
          if (question.children.length > 0) {
            count += countVisibleInHierarchy(
              question.children as (ContentType & { children: ContentType[] })[]
            );
          }
        }
      });
      return count;
    };

    return countVisibleInHierarchy(questionHierarchy);
  }, [questionHierarchy, isQuestionVisible]);

  // Handle question click
  const handleQuestionClick = useCallback(
    (question: ContentType, idx: number) => {
      const questionKey = `${question.type}${question._id ?? idx}`;
      onQuestionClick(questionKey);
    },
    [onQuestionClick]
  );

  // Handle visibility toggle
  const handleToggleVisibility = useCallback(
    (question: ContentType) => {
      const questionId = question._id || `temp-question-${Date.now()}`;
      if (questionId) {
        onToggleVisibility(questionId);
      }
    },
    [onToggleVisibility]
  );

  // Generate a unique key for questions
  const generateQuestionKey = useCallback(
    (question: ContentType, index: number = 0) => {
      if (question._id) {
        return question._id.toString();
      }
      // Use a combination of type, index, and a portion of the title content
      const titleHash =
        typeof question.title === "string"
          ? question.title.slice(0, 10)
          : JSON.stringify(question.title).slice(0, 20);
      return `${question.type}-${index}-${titleHash.replace(
        /[^a-zA-Z0-9]/g,
        ""
      )}`;
    },
    []
  );

  // Render a single question card (used for both parent and child questions)
  const renderQuestionCard = useCallback(
    (
      question: ContentType & { children: ContentType[] },
      level: number = 0,
      parentQuestion?: ContentType,
      index: number = 0
    ) => {
      const isChild = level > 0;
      const indentClass = isChild ? `ml-${level * 4}` : "";
      const borderClass = isChild ? "border-l-4 border-blue-300" : "";
      const questionKey = generateQuestionKey(question, index);

      return (
        <div key={questionKey} className={`${indentClass} mt-2`}>
          <Card
            className={`cursor-pointer hover:shadow-lg transition-shadow ${borderClass}`}
            isPressable
            onPress={() => handleQuestionClick(question, index)}
          >
            <CardBody className="p-4">
              {/* Parent indicator for child questions */}
              {isChild && parentQuestion && (
                <div className="mb-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="text-blue-600"
                    >
                      <path
                        d="M7 14l3-3 3 3"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="text-xs text-blue-600 font-medium">
                      Child of:
                    </span>
                    <span className="text-xs text-blue-800 truncate max-w-[150px]">
                      {getQuestionTitle(parentQuestion)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {/* Level indicator for better hierarchy visualization */}
                  {level > 0 ? (
                    <Chip size="sm" color="secondary" variant="flat">
                      Level {level + 1}
                    </Chip>
                  ) : (
                    <></>
                  )}
                  <Chip size="sm" color="primary" variant="flat">
                    {getQuestionTypeLabel(question.type)}
                  </Chip>
                  {question.conditional && question.conditional.length > 0 && (
                    <Chip size="sm" color="warning" variant="flat">
                      Has Condition
                    </Chip>
                  )}
                  {question.require && (
                    <Chip size="sm" color="danger" variant="flat">
                      Required
                    </Chip>
                  )}
                </div>

                {canToggleVisibility(question) ? (
                  <Button
                    size="sm"
                    variant="light"
                    isIconOnly
                    onPress={() => handleToggleVisibility(question)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {isQuestionVisible(question) ? (
                      <EyeIcon width="16" height="16" />
                    ) : (
                      <EyeSlashIcon width="16" height="16" />
                    )}
                  </Button>
                ) : (
                  <></>
                )}
              </div>

              <p className="text-sm text-gray-600 line-clamp-3">
                {getQuestionTitle(question)}
              </p>

              {question.score && question.score > 0 ? (
                <Chip size="sm" color="success" variant="flat" className="mt-2">
                  {question.score} pts
                </Chip>
              ) : (
                <></>
              )}

              {question.children.length > 0 && (
                <div className="mt-2">
                  <Chip size="sm" color="warning" variant="flat">
                    {question.children.length} linked question(s)
                  </Chip>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      );
    },
    [
      handleQuestionClick,
      getQuestionTypeLabel,
      canToggleVisibility,
      isQuestionVisible,
      handleToggleVisibility,
      getQuestionTitle,
      generateQuestionKey,
    ]
  );

  // Recursively render questions and their children
  const renderQuestionsRecursively = useCallback(
    (
      questions: (ContentType & { children: ContentType[] })[],
      level: number = 0,
      parentQuestion?: ContentType
    ) => {
      return questions.map((question, index) => {
        const questionKey = generateQuestionKey(question, index);
        return (
          <div key={questionKey} className="space-y-2">
            {renderQuestionCard(question, level, parentQuestion, index)}

            {/* Recursively render child questions if parent is visible */}
            {isQuestionVisible(question) && question.children.length > 0 && (
              <div className="space-y-2">
                {renderQuestionsRecursively(
                  question.children as (ContentType & {
                    children: ContentType[];
                  })[],
                  level + 1,
                  question // Pass current question as parent for its children
                )}
              </div>
            )}
          </div>
        );
      });
    },
    [renderQuestionCard, isQuestionVisible, generateQuestionKey]
  );

  return (
    <aside className="w-80 h-full bg-gray-50 border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            Question Structure
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Page {currentPage} of {formState.totalpage}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {visibleQuestionsCount} of {totalQuestionsOnPage} questions visible
          </p>
        </div>
        <Button
          size="sm"
          variant="light"
          isIconOnly
          onPress={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <XMarkIcon width="16" height="16" />
        </Button>
      </div>

      <ScrollShadow className="flex-1 p-4">
        <div className="space-y-4">
          {questionHierarchy.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No questions on this page</p>
              <p className="text-xs mt-2">
                {totalQuestionsOnPage > 0
                  ? "All questions are conditionally hidden"
                  : "Click the add button to create your first question"}
              </p>
            </div>
          ) : (
            <>
              {renderQuestionsRecursively(questionHierarchy)}
              {questionHierarchy.length > 1 && (
                <div className="mt-4">
                  <Divider />
                </div>
              )}
            </>
          )}
        </div>
      </ScrollShadow>
    </aside>
  );
};

export default QuestionStructure;
