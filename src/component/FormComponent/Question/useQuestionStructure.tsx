import { useState, useEffect, useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/store";
import { ContentType } from "../../../types/Form.types";
import {
  getQuestionTitle,
  generateQuestionKey,
  filterQuestions,
} from "./utils";

/**
 * useQuestionStructure
 * @description Build question structure on Question Tab for a quick navigation
 * @function
 * 1. Build Question Hierarchy (Parent and Childs)
 * 2. Group Questions
 * 3. Quick Filter questions
 * 4. Responsive
 * @example
 * Q1 (Child = c1 , c2 has child (D1) , c3)
 * ---> C1,C2,D1,C3
 * Q2
 * Q3
 */

export const useQuestionStructure = () => {
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({});
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [showOnlyVisible, setShowOnlyVisible] = useState(false);

  const allQuestion = useSelector(
    (root: RootState) => root.allform.allquestion,
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

  const filteredQuestions = useMemo(() => {
    if (!Array.isArray(allQuestion)) return [];

    let questions = [...allQuestion];

    //Search filter
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
    if (!filteredQuestions.length) return [];

    //Process question
    const questionMap = new Map<string | number, ContentType>();

    // Initialize all questions with empty children array for stability
    filteredQuestions.forEach((question) => {
      const questionId = question._id || question.qIdx;
      questionMap.set(questionId, {
        ...question,
        children: [],
      });
    });

    // Build parent-child relationships
    let rootQuestions: Array<ContentType> = [];
    const processedChildren = new Set<string | number>();

    filteredQuestions.forEach((question) => {
      //if it has no _id, mark as temp question
      const questionId = question._id || question.qIdx;
      const questionNode = questionMap.get(questionId);

      if (!questionNode) return;

      // If no parent, it's a root question
      if (!question.parentcontent) {
        rootQuestions.push(questionNode);
        return;
      }

      // Find parent
      const parentId = question.parentcontent.qId;
      const parentIdx = question.parentcontent.qIdx;

      let parentQuestion: ContentType | undefined;

      //Add saved parent question
      if (parentId) {
        parentQuestion = questionMap.get(parentId);
      } else if (parentIdx !== undefined) {
        parentQuestion = questionMap.get(parentIdx);
      }

      //Process parent questions
      if (parentQuestion) {
        // Verify no duplicate question in the hirerachy
        const wouldCreateCycle = (
          child: ContentType,
          targetParentId: string | number,
        ): boolean => {
          //Create queue with childs questions
          const queue: Array<ContentType> = [...(child?.children ?? [])];

          const visited = new Set<string | number>();

          while (queue.length > 0) {
            //Extract item from queue
            const current = queue.shift();

            if (!current) continue;

            const currentId = current._id || current.qIdx;

            //If alr process skip
            if (visited.has(currentId)) continue;
            visited.add(currentId);

            //Duplicate detected
            if (currentId === targetParentId) {
              return true;
            }

            //If it has childs add to queue
            const children = current.children;
            if (children && Array.isArray(children) && children.length > 0) {
              queue.push(...children);
            }
          }

          return false;
        };

        const parentIdToCheck = parentId || parentIdx;

        // Add verified child question
        if (
          parentIdToCheck &&
          !wouldCreateCycle(questionNode, parentIdToCheck) &&
          !processedChildren.has(questionId) &&
          parentQuestion.children
        ) {
          parentQuestion.children.push(questionNode);
          rootQuestions = rootQuestions.map((question) =>
            (
              question._id
                ? question._id === parentId
                : question.qIdx === parentIdx
            )
              ? { ...parentQuestion }
              : question,
          );
          processedChildren.add(questionId);
        }
      } else {
        if (!processedChildren.has(questionId)) {
          rootQuestions.push(questionNode);
          processedChildren.add(questionId);
        }
      }
    });

    return rootQuestions.map((i) => ({
      ...i,

      isChildVisibility:
        i.children && i.children.length > 0
          ? (i.isChildVisibility ?? true)
          : undefined,
    }));
  }, [filteredQuestions]);

  const questionHierarchy = useMemo(
    () => buildQuestionHierarchy(),
    [buildQuestionHierarchy],
  );

  // Initialize expandedSections
  useEffect(() => {
    const initializeExpandedSections = (
      questions: Array<ContentType>,
      sections: Record<string, boolean> = {},
    ): Record<string, boolean> => {
      questions.forEach((question, idx) => {
        const key = generateQuestionKey(question, idx);
        if (!(key in sections)) {
          sections[key] = true;
        }
        if (question.children && question.children.length > 0) {
          initializeExpandedSections(question.children, sections);
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

  //Count visible
  const visibleQuestionsCount = useMemo(() => {
    const countVisible = (questions: Array<ContentType>): number => {
      let count = 0;
      questions.forEach((question) => {
        if (question.isVisible) {
          count += 1;
          if (question.children && question.children.length > 0) {
            count += countVisible(
              question.children as Array<
                ContentType & { children: ContentType[] }
              >,
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
