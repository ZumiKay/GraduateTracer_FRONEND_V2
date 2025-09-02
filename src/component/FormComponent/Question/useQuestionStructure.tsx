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
    const hierarchy: Array<ContentType & { children: ContentType[] }> = [];

    //Recursive Build Children
    const buildChildren = (
      parentId: string | number,
      parentMapIdx?: number
    ): Array<ContentType & { children: ContentType[] }> => {
      //Get only question with parentContent
      const children = enhancedFilteredQuestions.filter(
        (q) =>
          q.parentcontent &&
          ((q.parentcontent.qId &&
            parentId &&
            q.parentcontent.qId.toString() === parentId.toString()) ||
            (q.parentcontent.qIdx !== undefined &&
              parentMapIdx !== undefined &&
              q.parentcontent.qIdx === parentMapIdx))
      );

      return children.map((child, index) => {
        // Find the map index of this child
        const childMapIdx = enhancedFilteredQuestions.findIndex((q) =>
          q._id ? q._id === child._id : q === child
        );

        return {
          ...child,
          children: buildChildren(
            child._id || `temp-child-${parentId}-${index}`,
            childMapIdx >= 0 ? childMapIdx : undefined
          ),
        };
      });
    };

    enhancedFilteredQuestions.forEach((question, index) => {
      if (!question.parentcontent) {
        hierarchy.push({
          ...question,
          children: buildChildren(
            question._id || `temp-parent-${index}`,
            index
          ),
        });
      }
    });

    return hierarchy;
  }, [enhancedFilteredQuestions]);

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
