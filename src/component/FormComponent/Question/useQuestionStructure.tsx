import { useState, useEffect, useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/store";
import { ContentType } from "../../../types/Form.types";
import {
  getQuestionTitle,
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
      questions = questions.filter((q) => q.isVisible);
    }

    return questions;
  }, [allQuestion, searchQuery, selectedFilter, showOnlyVisible]);

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

    enhancedFilteredQuestions.forEach((question, mapIdx) => {
      const questionId = question._id || `temp-question-${mapIdx}`;
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
        const wouldCreateCycle = (
          child: ContentType & { children: ContentType[] },
          targetParentId: string | number
        ): boolean => {
          const queue: Array<ContentType & { children?: ContentType[] }> = [
            ...child.children,
          ];
          const visited = new Set<string | number>();

          while (queue.length > 0) {
            const current = queue.shift();
            if (!current) continue;

            const currentId = current._id || current.qIdx;
            if (visited.has(currentId)) continue;
            visited.add(currentId);

            if (currentId === targetParentId) {
              return true;
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

        const parentIdToCheck = parentNode._id || parentIdx;

        // Only add child if it doesn't create a cycle and hasn't been processed
        if (
          parentIdToCheck &&
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

    return rootQuestions.map((i) => ({
      ...i,
      isChildVisibility:
        i.children.length > 0 ? i.isChildVisibility ?? true : undefined,
    }));
  }, [enhancedFilteredQuestions]);

  const questionHierarchy = useMemo(
    () => buildQuestionHierarchy(),
    [buildQuestionHierarchy]
  );

  // Initialize expandedSections
  useEffect(() => {
    const initializeExpandedSections = (
      questions: Array<ContentType & { children: ContentType[] }>,
      sections: Record<string, boolean> = {}
    ): Record<string, boolean> => {
      questions.forEach((question, index) => {
        const key = generateQuestionKey(question, index);
        if (!(key in sections)) {
          sections[key] = true;
        }
        if (question.children.length > 0) {
          initializeExpandedSections(
            question.children as Array<
              ContentType & { children: ContentType[] }
            >,
            sections
          );
        }
      });
      return sections;
    };

    setExpandedSections((prev) => {
      const initialized = initializeExpandedSections(questionHierarchy, {
        ...prev,
      });
      return initialized;
    });
  }, [questionHierarchy]);

  //Count visible recursively
  const visibleQuestionsCount = useMemo(() => {
    const countVisible = (
      questions: Array<ContentType & { children: ContentType[] }>
    ): number => {
      let count = 0;
      questions.forEach((question) => {
        if (question.isVisible) {
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
  }, [questionHierarchy]);

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
    generateQuestionKey,
  };
};
