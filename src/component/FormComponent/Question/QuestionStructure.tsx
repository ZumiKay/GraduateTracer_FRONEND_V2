import { useCallback, useMemo, useState, useEffect } from "react";
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
  Tooltip,
  Input,
  Badge,
} from "@heroui/react";

// Icon components
const EyeIcon = ({
  width = "16",
  height = "16",
  className = "",
}: {
  width?: string;
  height?: string;
  className?: string;
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
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
  className = "",
}: {
  width?: string;
  height?: string;
  className?: string;
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
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
  className = "",
}: {
  width?: string;
  height?: string;
  className?: string;
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M18.3 5.71c-.39-.39-1.02-.39-1.41 0L12 10.59 7.11 5.7c-.39-.39-1.02-.39-1.41 0s-.39 1.02 0 1.41L10.59 12 5.7 16.89c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0L12 13.41l4.89 4.89c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4z"
      fill="currentColor"
    />
  </svg>
);

const ChevronDownIcon = ({
  width = "16",
  height = "16",
  className = "",
}: {
  width?: string;
  height?: string;
  className?: string;
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"
      fill="currentColor"
    />
  </svg>
);

const ChevronUpIcon = ({
  width = "16",
  height = "16",
  className = "",
}: {
  width?: string;
  height?: string;
  className?: string;
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6 1.41 1.41z"
      fill="currentColor"
    />
  </svg>
);

const QuestionIcon = ({
  width = "16",
  height = "16",
  className = "",
}: {
  width?: string;
  height?: string;
  className?: string;
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92c-.5.51-.86.97-1.04 1.69-.08.32-.13.68-.13 1.14h-2v-.5c0-.46.08-.9.22-1.31.2-.58.53-1.1.95-1.52l1.24-1.26c.46-.44.68-1.1.55-1.8-.13-.72-.69-1.33-1.39-1.53-1.11-.31-2.14.32-2.47 1.27-.12.35-.43.58-.79.58h-.28c-.52 0-.96-.41-.92-.93.12-1.77 1.59-3.2 3.36-3.38 1.96-.2 3.73 1.3 3.93 3.24.12 1.13-.36 2.19-1.33 2.88z"
      fill="currentColor"
    />
  </svg>
);

const ConnectionIcon = ({
  width = "16",
  height = "16",
  className = "",
}: {
  width?: string;
  height?: string;
  className?: string;
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M17 7h-4v2h4c1.65 0 3 1.35 3 3s-1.35 3-3 3h-4v2h4c2.76 0 5-2.24 5-5s-2.24-5-5-5zm-6 8H7c-1.65 0-3-1.35-3-3s1.35-3 3-3h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-2zm-3-4h8v2H8v-2z"
      fill="currentColor"
    />
  </svg>
);

const FolderIcon = ({
  width = "16",
  height = "16",
  className = "",
}: {
  width?: string;
  height?: string;
  className?: string;
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"
      fill="currentColor"
    />
  </svg>
);

const SearchIcon = ({
  width = "16",
  height = "16",
  className = "",
}: {
  width?: string;
  height?: string;
  className?: string;
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
      fill="currentColor"
    />
  </svg>
);

const FilterIcon = ({
  width = "16",
  height = "16",
  className = "",
}: {
  width?: string;
  height?: string;
  className?: string;
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"
      fill="currentColor"
    />
  </svg>
);
const DocumentTextIcon = ({
  width = "16",
  height = "16",
  className = "",
}: {
  width?: string;
  height?: string;
  className?: string;
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"
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
  // Add state for responsive sidebar and collapsible sections
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({});

  // Track if we're in a mobile view
  const [isMobile, setIsMobile] = useState(false);

  // Search and filter functionality
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [showOnlyVisible, setShowOnlyVisible] = useState(false);

  const allQuestion = useSelector(
    (root: RootState) => root.allform.allquestion
  );
  const showLinkedQuestion = useSelector(
    (root: RootState) => root.allform.showLinkedQuestions
  );
  const formState = useSelector((root: RootState) => root.allform.formstate);

  // Check if we're in mobile view
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initialize on mount
    handleResize();

    // Add resize listener
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Toggle section expanded state
  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  }, []);

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

  // Enhanced filteredQuestions with search and filter capabilities
  const enhancedFilteredQuestions = useMemo(() => {
    if (!allQuestion || !Array.isArray(allQuestion)) {
      return [];
    }

    let questions = allQuestion.filter((q) => q && q.page === currentPage);

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      questions = questions.filter((q) => {
        const title = getQuestionTitle(q).toLowerCase();
        const type = getQuestionTypeLabel(q.type).toLowerCase();
        return (
          title.includes(query) ||
          type.includes(query) ||
          (q.qidx && q.qidx.toString().includes(query))
        );
      });
    }

    // Apply type filter
    if (selectedFilter !== "all") {
      questions = questions.filter((q) => {
        switch (selectedFilter) {
          case "required":
            return q.require;
          case "conditional":
            return q.conditional && q.conditional.length > 0;
          case "multiple":
            return q.type === QuestionType.MultipleChoice;
          case "text":
            return (
              q.type === QuestionType.Text ||
              q.type === QuestionType.ShortAnswer ||
              q.type === QuestionType.Paragraph
            );
          case "number":
            return (
              q.type === QuestionType.Number ||
              q.type === QuestionType.RangeNumber
            );
          case "date":
            return (
              q.type === QuestionType.Date || q.type === QuestionType.RangeDate
            );
          default:
            return true;
        }
      });
    }

    // Apply visibility filter
    if (showOnlyVisible) {
      questions = questions.filter((q) => isQuestionVisible(q));
    }

    return questions;
  }, [
    allQuestion,
    currentPage,
    searchQuery,
    selectedFilter,
    showOnlyVisible,
    getQuestionTitle,
    getQuestionTypeLabel,
    isQuestionVisible,
  ]);

  // Build hierarchical structure with recursive nesting
  const buildQuestionHierarchy = useCallback(() => {
    const hierarchy: Array<ContentType & { children: ContentType[] }> = [];

    // Helper function to recursively build children
    const buildChildren = (
      parentId: string | number
    ): (ContentType & { children: ContentType[] })[] => {
      const children = enhancedFilteredQuestions.filter(
        (q) => q.parentcontent?.qId === parentId
      );

      return children.map((child, index) => ({
        ...child,
        children: buildChildren(child._id || `temp-child-${parentId}-${index}`),
      }));
    };

    // First, add all parent questions (questions without parentcontent)
    enhancedFilteredQuestions.forEach((question, index) => {
      if (!question.parentcontent) {
        hierarchy.push({
          ...question,
          children: buildChildren(question._id || `temp-parent-${index}`),
        });
      }
    });

    return hierarchy;
  }, [enhancedFilteredQuestions]);

  const questionHierarchy = useMemo(() => {
    return buildQuestionHierarchy();
  }, [buildQuestionHierarchy]);

  const visibleQuestionsCount = useMemo(() => {
    // Count questions that are actually visible in the hierarchy
    const countVisibleInHierarchy = (
      questions: (ContentType & { children: ContentType[] })[]
    ): number => {
      let count = 0;
      questions.forEach((question) => {
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

  const generateQuestionKey = useCallback(
    (question: ContentType, index: number = 0) => {
      if (question._id) {
        return question._id.toString();
      }
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

  const renderQuestionCard = useCallback(
    (
      question: ContentType & { children: ContentType[] },
      level: number = 0,
      parentQuestion?: ContentType,
      index: number = 0
    ) => {
      const isChild = level > 0;
      const questionKey = generateQuestionKey(question, index);
      const isExpanded = expandedSections[questionKey] !== false; // Default to expanded
      const hasChildren = question.children.length > 0;

      // Calculate indentation and visual hierarchy indicators
      const levelColors = [
        "border-primary",
        "border-warning",
        "border-secondary",
        "border-success",
      ];
      const borderColor = levelColors[level % levelColors.length];

      // Create gradient effect based on nesting level
      const bgGradient = isChild
        ? `bg-gradient-to-r from-${borderColor.replace(
            "border-",
            ""
          )}/5 to-transparent`
        : "";

      return (
        <div
          key={questionKey}
          className={`mt-3 transition-all duration-200 ${
            level > 0 ? `pl-${Math.min(level * 4, 12)}` : ""
          }`}
        >
          <Card
            className={`
              group cursor-pointer transition-all duration-300 ease-out
              hover:shadow-lg hover:shadow-primary/10 hover:scale-[1.02] hover:-translate-y-1
              active:scale-[0.98] active:transition-none
              ${isChild ? `border-l-4 ${borderColor} ml-2` : ""}
              ${bgGradient}
              relative overflow-hidden
              before:absolute before:inset-0 before:bg-gradient-to-r 
              before:from-transparent before:via-white/5 before:to-transparent
              before:translate-x-[-100%] before:transition-transform before:duration-700
              hover:before:translate-x-[100%]
            `}
            isPressable
            onPress={() => handleQuestionClick(question, index)}
            shadow="sm"
          >
            <CardBody className="p-3 sm:p-4">
              {/* Parent indicator for child questions - improved with icon and tooltip */}
              {isChild && parentQuestion && (
                <div className="mb-2 p-2 bg-gradient-to-r from-blue-50 to-blue-50/30 rounded-lg border border-blue-200/70">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <ConnectionIcon
                      width="14"
                      height="14"
                      className="text-blue-500 flex-shrink-0"
                    />
                    <span className="text-xs text-blue-600 font-medium whitespace-nowrap flex-shrink-0">
                      Child of:
                    </span>
                    <Tooltip
                      content={getQuestionTitle(parentQuestion)}
                      placement="top"
                    >
                      <span className="text-xs text-blue-800 truncate max-w-[150px] hover:underline">
                        {getQuestionTitle(parentQuestion)}
                      </span>
                    </Tooltip>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between gap-2 mb-2 flex-wrap sm:flex-nowrap">
                {/* Badges section with improved layout */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Level indicator with nicer design */}
                  {level > 0 && (
                    <Chip
                      size="sm"
                      color={
                        level === 1
                          ? "secondary"
                          : level === 2
                          ? "warning"
                          : "primary"
                      }
                      variant="flat"
                      classNames={{
                        base: "border border-secondary/30",
                        content: "font-medium",
                      }}
                    >
                      L{level + 1}
                    </Chip>
                  )}

                  {/* Question type with improved visualization */}
                  <Chip
                    size="sm"
                    color="primary"
                    variant="flat"
                    classNames={{
                      base: "border border-primary/30",
                      content: "font-medium",
                    }}
                  >
                    {getQuestionTypeLabel(question.type)}
                  </Chip>

                  {/* Condition indicator with icon */}
                  {question.conditional && question.conditional.length > 0 && (
                    <Chip
                      size="sm"
                      color="warning"
                      variant="flat"
                      startContent={
                        <ChevronDownIcon
                          width="12"
                          height="12"
                          className="text-warning"
                        />
                      }
                      classNames={{
                        base: "border border-warning/30",
                        content: "font-medium",
                      }}
                    >
                      Conditional
                    </Chip>
                  )}

                  {/* Required indicator */}
                  {question.require && (
                    <Chip
                      size="sm"
                      color="danger"
                      variant="flat"
                      classNames={{
                        base: "border border-danger/30 animate-pulse",
                        content: "font-medium",
                      }}
                    >
                      Required
                    </Chip>
                  )}
                </div>

                {/* Action buttons with improved hover effects */}
                <div className="flex items-center gap-1">
                  {/* Toggle visibility button with tooltip */}
                  {canToggleVisibility(question) && (
                    <Tooltip
                      content={
                        isQuestionVisible(question)
                          ? "Hide question"
                          : "Show question"
                      }
                      placement="top"
                    >
                      <Button
                        size="sm"
                        variant="light"
                        isIconOnly
                        onPress={() => handleToggleVisibility(question)}
                        className={`
                          rounded-full p-1 transition-colors
                          ${
                            isQuestionVisible(question)
                              ? "text-primary hover:bg-primary/10"
                              : "text-danger hover:bg-danger/10"
                          }
                        `}
                      >
                        {isQuestionVisible(question) ? (
                          <EyeIcon width="16" height="16" />
                        ) : (
                          <EyeSlashIcon width="16" height="16" />
                        )}
                      </Button>
                    </Tooltip>
                  )}

                  {/* Expand/collapse button for questions with children */}
                  {hasChildren && (
                    <Tooltip
                      content={isExpanded ? "Collapse" : "Expand"}
                      placement="top"
                    >
                      <Button
                        size="sm"
                        variant="light"
                        isIconOnly
                        onPress={() => toggleSection(questionKey)}
                        className="rounded-full p-1 text-warning hover:bg-warning/10 transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronUpIcon width="16" height="16" />
                        ) : (
                          <ChevronDownIcon width="16" height="16" />
                        )}
                      </Button>
                    </Tooltip>
                  )}
                </div>
              </div>

              {/* Question title with improved typography */}
              <div className="group-hover:text-primary transition-colors flex items-start gap-2">
                {/* Question type icon for better visual indication */}
                <div className="mt-0.5 flex-shrink-0">
                  {hasChildren ? (
                    <FolderIcon
                      width="18"
                      height="18"
                      className="text-yellow-500"
                    />
                  ) : question.type === QuestionType.MultipleChoice ? (
                    <QuestionIcon
                      width="18"
                      height="18"
                      className="text-blue-500"
                    />
                  ) : (
                    <DocumentTextIcon
                      width="18"
                      height="18"
                      className="text-blue-500"
                    />
                  )}
                </div>

                <p className="text-sm font-medium text-gray-700 line-clamp-3 transition-colors">
                  {getQuestionTitle(question)}
                </p>
              </div>

              {/* Bottom metadata section with improved layout */}
              <div className="flex flex-wrap gap-2 mt-2 items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  {/* Score badge */}
                  {question.score && question.score > 0 && (
                    <Chip
                      size="sm"
                      color="success"
                      variant="flat"
                      classNames={{
                        base: "border border-success/30",
                        content: "font-medium",
                      }}
                    >
                      {question.score} points
                    </Chip>
                  )}

                  {/* Child questions count badge with animation */}
                  {hasChildren && (
                    <Chip
                      size="sm"
                      color="warning"
                      variant="dot"
                      classNames={{
                        base: "border border-warning/30",
                        dot: "bg-warning",
                        content: "font-medium",
                      }}
                    >
                      {question.children.length}{" "}
                      {question.children.length === 1 ? "child" : "children"}
                    </Chip>
                  )}
                </div>

                {/* Question type icon */}
                <div className="opacity-70 group-hover:opacity-100 transition-opacity">
                  <QuestionIcon
                    width="16"
                    height="16"
                    className="text-gray-500"
                  />
                </div>
              </div>
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
      expandedSections,
      toggleSection,
    ]
  );

  const renderQuestionsRecursively = useCallback(
    (
      questions: (ContentType & { children: ContentType[] })[],
      level: number = 0,
      parentQuestion?: ContentType
    ) => {
      return questions.map((question, index) => {
        const questionKey = generateQuestionKey(question, index);
        const isExpanded = expandedSections[questionKey] !== false; // Default to expanded
        const hasChildren = question.children.length > 0;

        // Determine vertical connector style
        const showConnector = level > 0 && hasChildren;

        return (
          <div key={questionKey} className="relative">
            {/* Question card */}
            {renderQuestionCard(question, level, parentQuestion, index)}

            {/* Vertical connector line for better visual hierarchy */}
            {showConnector && isQuestionVisible(question) && isExpanded && (
              <div
                className={`absolute left-[${
                  Math.min(level * 4, 12) / 2
                }] w-0.5 bg-gray-200 z-0`}
                style={{
                  top: "2rem",
                  bottom: "0.5rem",
                  left: `${Math.min(level * 8, 24)}px`,
                }}
              />
            )}

            {/* Recursively render child questions if parent is visible */}
            {isQuestionVisible(question) && hasChildren && isExpanded && (
              <div
                className={`
                  space-y-2 pl-2 
                  transition-all duration-300 ease-in-out 
                  opacity-100 max-h-[2000px]
                `}
              >
                {renderQuestionsRecursively(
                  question.children as (ContentType & {
                    children: ContentType[];
                  })[],
                  level + 1,
                  question // Pass current question as parent for its children
                )}
              </div>
            )}

            {/* Collapsed state indicator */}
            {isQuestionVisible(question) && hasChildren && !isExpanded && (
              <div
                className="
                  ml-8 my-1 py-1 px-2 
                  text-xs text-gray-500 
                  bg-gray-100 rounded-md 
                  inline-block
                  cursor-pointer
                  hover:bg-gray-200
                  transition-colors
                "
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSection(questionKey);
                }}
              >
                <div className="flex items-center gap-1">
                  <ChevronDownIcon width="12" height="12" />
                  {question.children.length} hidden{" "}
                  {question.children.length === 1 ? "child" : "children"}
                </div>
              </div>
            )}
          </div>
        );
      });
    },
    [
      renderQuestionCard,
      isQuestionVisible,
      generateQuestionKey,
      expandedSections,
      toggleSection,
    ]
  );

  return (
    <aside
      className={`
        w-full sm:w-80 h-full 
        bg-gray-50 border-r border-gray-200 
        flex flex-col 
        transition-all duration-300 ease-in-out
        ${isMobile ? "shadow-lg" : ""}
      `}
    >
      {/* Header section with improved styling */}
      <div className="p-4 border-b border-gray-200 bg-white/90 backdrop-blur sticky top-0 z-10 space-y-3">
        {/* Title and close button */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              Question Structure
              <Badge
                content={visibleQuestionsCount}
                color="primary"
                size="sm"
                className="ml-2"
              >
                <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full font-normal">
                  visible
                </span>
              </Badge>
            </h2>
            <div className="text-sm text-gray-600 mt-1 flex items-center gap-2">
              <span>
                Page {currentPage} of {formState.totalpage}
              </span>
              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                {totalQuestionsOnPage} total
              </span>
            </div>
          </div>

          {/* Close button with improved hover effect */}
          <Button
            size="sm"
            variant="light"
            isIconOnly
            onPress={onClose}
            className="rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          >
            <XMarkIcon width="16" height="16" />
          </Button>
        </div>

        {/* Search and filter controls */}
        <div className="space-y-2">
          {/* Search input */}
          <Input
            placeholder="Search questions..."
            value={searchQuery}
            onValueChange={setSearchQuery}
            startContent={
              <SearchIcon width="16" height="16" className="text-gray-400" />
            }
            size="sm"
            variant="bordered"
            classNames={{
              input: "text-sm",
              inputWrapper:
                "border-gray-200 hover:border-primary/50 focus-within:border-primary/50",
            }}
            isClearable
          />

          {/* Filter chips */}
          <div className="flex flex-wrap gap-1">
            {[
              { key: "all", label: "All", color: "default" as const },
              { key: "required", label: "Required", color: "danger" as const },
              {
                key: "conditional",
                label: "Conditional",
                color: "warning" as const,
              },
              {
                key: "multiple",
                label: "Multiple Choice",
                color: "primary" as const,
              },
              { key: "text", label: "Text", color: "secondary" as const },
              { key: "number", label: "Number", color: "success" as const },
              { key: "date", label: "Date", color: "default" as const },
            ].map((filter) => (
              <Chip
                key={filter.key}
                size="sm"
                variant={selectedFilter === filter.key ? "solid" : "flat"}
                color={selectedFilter === filter.key ? filter.color : "default"}
                className="cursor-pointer transition-all hover:scale-105"
                onClick={() => setSelectedFilter(filter.key)}
              >
                {filter.label}
              </Chip>
            ))}
          </div>

          {/* Visibility toggle */}
          <div className="flex items-center justify-between">
            <Button
              size="sm"
              variant="light"
              startContent={<FilterIcon width="14" height="14" />}
              className={`text-xs ${
                showOnlyVisible ? "text-primary" : "text-gray-600"
              }`}
              onPress={() => setShowOnlyVisible(!showOnlyVisible)}
            >
              {showOnlyVisible ? "Show All" : "Visible Only"}
            </Button>

            {/* Expand/Collapse all controls */}
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="light"
                className="text-xs text-gray-600"
                onPress={() => setExpandedSections({})}
              >
                Expand All
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar showing current page */}
      <div className="w-full h-1 bg-gray-100">
        <div
          className="h-full bg-primary/80"
          style={{ width: `${(currentPage / formState.totalpage) * 100}%` }}
        />
      </div>

      {/* Main content with improved scrolling */}
      <ScrollShadow
        className="flex-1 px-3 py-4 overflow-x-hidden"
        hideScrollBar={false}
        size={20}
      >
        <div className="space-y-2">
          {questionHierarchy.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="p-6 border border-dashed border-gray-300 rounded-lg bg-gray-50/50">
                <p className="text-base font-medium">
                  No questions on this page
                </p>
                <p className="text-sm mt-2 text-gray-500">
                  {totalQuestionsOnPage > 0
                    ? "All questions are conditionally hidden"
                    : "Click the add button to create your first question"}
                </p>

                {/* Visual indicator for empty state */}
                <div className="mt-4 flex justify-center">
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"
                      fill="currentColor"
                      className="text-gray-300"
                    />
                    <path
                      d="M11 17h2v-6h-2v6zm0-8h2V7h-2v2z"
                      fill="currentColor"
                      className="text-gray-300"
                    />
                  </svg>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Questions list with animation */}
              <div className="animate-in slide-in-from-top-2 duration-500">
                {renderQuestionsRecursively(questionHierarchy)}
              </div>

              {/* Footer section */}
              {questionHierarchy.length > 1 && (
                <div className="mt-6 pt-2">
                  <Divider />
                  <div className="text-center text-xs text-gray-500 py-2">
                    {questionHierarchy.length} top-level questions
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </ScrollShadow>

      {/* Mobile-friendly bottom action bar */}
      {isMobile && (
        <div className="p-3 border-t border-gray-200 bg-white/95 backdrop-blur flex justify-between items-center">
          {/* Search results count for mobile */}
          <div className="text-xs text-gray-600">
            {searchQuery && (
              <span>
                {questionHierarchy.length} result
                {questionHierarchy.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Close button for mobile */}
          <Button
            size="sm"
            variant="solid"
            color="primary"
            className="text-white shadow-lg"
            onPress={onClose}
          >
            Close
          </Button>
        </div>
      )}
    </aside>
  );
};

export default QuestionStructure;
