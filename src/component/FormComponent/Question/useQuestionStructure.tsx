import { useState, useEffect, useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/store";
import { ContentType } from "../../../types/Form.types";
import {
  getQuestionTitle,
  canToggleVisibility,
  generateQuestionKey,
  filterQuestions,
} from "./utils";

export const useQuestionStructure = () => {
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({});
  const [isMobile, setIsMobile] = useState(false);
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

  // Check mobile view
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Toggle section expanded state
  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  }, []);

  const isQuestionVisible = useCallback(
    (question: ContentType, mapIdx: number) => {
      if (!canToggleVisibility(question)) return true;
      const questionId = question._id?.toString() || `temp-question-${mapIdx}`;
      const linkedQuestion = showLinkedQuestion?.find(
        (i) => i.question === questionId
      );
      return linkedQuestion?.show !== undefined ? linkedQuestion.show : true;
    },
    [showLinkedQuestion]
  );

  const enhancedFilteredQuestions = useMemo(() => {
    if (!Array.isArray(allQuestion)) return [];

    let questions = [...allQuestion];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      questions = questions.filter((q) => {
        const title = getQuestionTitle(q).toLowerCase();
        return title.includes(query) || q.qidx?.toString().includes(query);
      });
    }

    questions = filterQuestions.applyFilter(questions, selectedFilter);

    if (showOnlyVisible) {
      questions = questions.filter((q, idx) => isQuestionVisible(q, idx));
    }

    return questions;
  }, [
    allQuestion,
    searchQuery,
    selectedFilter,
    showOnlyVisible,
    isQuestionVisible,
  ]);

  const buildQuestionHierarchy = useCallback(() => {
    if (!enhancedFilteredQuestions.length) return [];

    // Create a map for quick lookup
    const questionMap = new Map<
      string | number,
      ContentType & { children: ContentType[] }
    >();

    // Initialize all questions with empty children array
    enhancedFilteredQuestions.forEach((question, index) => {
      const questionId = question._id || `temp-question-${index}`;
      questionMap.set(questionId, {
        ...question,
        children: [],
      });
      // Also map by index if available
      questionMap.set(index, {
        ...question,
        children: [],
      });
    });

    // Build parent-child relationships
    const rootQuestions: Array<ContentType & { children: ContentType[] }> = [];
    const processedChildren = new Set<string | number>();

    enhancedFilteredQuestions.forEach((question, index) => {
      const questionId = question._id || `temp-question-${index}`;
      const questionNode = questionMap.get(questionId);

      if (!questionNode) return;

      // If no parent, it's a root question
      if (!question.parentcontent) {
        rootQuestions.push(questionNode);
        return;
      }

      // Find parent and add this as a child
      const parentId = question.parentcontent.qId;
      const parentIdx = question.parentcontent.qIdx;

      let parentNode: (ContentType & { children: ContentType[] }) | undefined;

      // Try to find parent by ID first
      if (parentId) {
        parentNode = questionMap.get(parentId);
      }

      // Try to find parent by index if ID lookup failed
      if (!parentNode && parentIdx !== undefined) {
        parentNode = questionMap.get(parentIdx);
      }

      if (parentNode) {
        // Check for circular reference before adding
        const wouldCreateCycle = (
          child: ContentType & { children: ContentType[] },
          targetParentId: string | number
        ): boolean => {
          // Use BFS to check if adding this child would create a cycle
          const queue: Array<ContentType & { children?: ContentType[] }> = [
            ...child.children,
          ];
          const visited = new Set<string | number>();

          while (queue.length > 0) {
            const current = queue.shift();
            if (!current) continue;

            const currentId =
              current._id ||
              `temp-${allQuestion.indexOf(current as ContentType)}`;

            if (visited.has(currentId)) continue;
            visited.add(currentId);

            if (currentId === targetParentId) {
              return true; // Cycle detected
            }

            const children = (
              current as ContentType & { children?: ContentType[] }
            ).children;
            if (Array.isArray(children) && children.length > 0) {
              queue.push(...children);
            }
          }

          return false;
        };

        const parentIdToCheck = parentNode._id || `temp-question-${parentIdx}`;

        // Only add child if it doesn't create a cycle and hasn't been processed
        if (
          !wouldCreateCycle(questionNode, parentIdToCheck) &&
          !processedChildren.has(questionId)
        ) {
          parentNode.children.push(questionNode);
          processedChildren.add(questionId);
        }
      } else {
        // Parent not found, treat as root
        if (!processedChildren.has(questionId)) {
          rootQuestions.push(questionNode);
          processedChildren.add(questionId);
        }
      }
    });

    return rootQuestions;
  }, [enhancedFilteredQuestions, allQuestion]);

  const questionHierarchy = useMemo(
    () => buildQuestionHierarchy(),
    [buildQuestionHierarchy]
  );

  const visibleQuestionsCount = useMemo(() => {
    const countVisible = (
      questions: Array<ContentType & { children: ContentType[] }>
    ): number => {
      let count = 0;
      questions.forEach((question, idx) => {
        if (isQuestionVisible(question, idx)) {
          count += 1;
          if (question.children.length > 0) {
            count += countVisible(
              question.children as Array<
                ContentType & { children: ContentType[] }
              >
            );
          }
        }
      });
      return count;
    };
    return countVisible(questionHierarchy);
  }, [questionHierarchy, isQuestionVisible]);

  return {
    expandedSections,
    isMobile,
    searchQuery,
    selectedFilter,
    showOnlyVisible,
    formState,
    filteredQuestions: allQuestion,
    questionHierarchy,
    visibleQuestionsCount,
    totalQuestionsOnPage: allQuestion.length,
    setSearchQuery,
    setSelectedFilter,
    setShowOnlyVisible,
    setExpandedSections,
    toggleSection,
    isQuestionVisible,
    generateQuestionKey,
  };
};
