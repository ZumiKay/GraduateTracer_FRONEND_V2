import React, { useCallback } from "react";
import { Button, Divider, ScrollShadow } from "@heroui/react";
import { motion } from "framer-motion";
import { ContentType, QuestionType } from "../../../types/Form.types";
import { QuestionCard } from "./QuestionCard";
import { Header } from "./Header";
import { useQuestionStructure } from "./useQuestionStructure";
import { ChevronDownIcon } from "./Assets";

interface QuestionStructureProps {
  onQuestionClick: (props: {
    questionId: string | number;
    type: QuestionType;
  }) => void;
  onToggleVisibility: (questionId: string | number) => void;
  currentPage: number;
  onClose?: () => void;
}

interface StackItem {
  question: ContentType;
  index: number;
  level: number;
  parentQuestion?: ContentType;
  children?: React.JSX.Element[];
}

const QuestionStructure: React.FC<QuestionStructureProps> = ({
  onQuestionClick,
  onToggleVisibility,
  currentPage,
  onClose,
}) => {
  const {
    expandedSections,
    isMobile,
    searchQuery,
    selectedFilter,
    showOnlyVisible,
    formState,
    questionHierarchy,
    visibleQuestionsCount,
    totalQuestionsOnPage,
    setSearchQuery,
    setSelectedFilter,
    setShowOnlyVisible,
    setExpandedSections,
    toggleSection,
    generateQuestionKey,
  } = useQuestionStructure();

  const handleToggleVisibility = useCallback(
    (question: ContentType, idx: number) => {
      const questionId = question._id || idx;
      onToggleVisibility(questionId);
    },
    [onToggleVisibility],
  );

  const handleCardClick = useCallback(
    (question: ContentType) => {
      onQuestionClick({
        questionId: question._id || question.qIdx,
        type: question.type,
      });

      // On mobile devices, automatically close the drawer after selecting a question
      if (isMobile && onClose) {
        onClose();
      }
    },
    [onQuestionClick, isMobile, onClose],
  );

  const renderQuestions = useCallback(
    (rootQuestions: Array<ContentType>) => {
      const stack: StackItem[] = [
        ...rootQuestions
          .map((q, i) => ({
            question: q,
            index: i,
            level: 0,
            parentQuestion: undefined,
          }))
          .reverse(),
      ];

      const processed = new Map<string, React.JSX.Element>();

      while (stack.length > 0) {
        const item = stack[stack.length - 1];
        const { question, level, parentQuestion, index } = item;
        const questionKey = generateQuestionKey(question, index);
        const isExpanded = expandedSections[questionKey] !== false;
        const hasChildren = question.children && question.children.length > 0;
        const shouldRenderChildren = hasChildren && isExpanded;

        if (shouldRenderChildren && !processed.has(questionKey)) {
          const childs = question.children as Array<ContentType>;
          const allChildrenProcessed = childs.every((child, i) =>
            processed.has(generateQuestionKey(child, i)),
          );

          if (!allChildrenProcessed) {
            for (let i = childs.length - 1; i >= 0; i--) {
              const childItem = childs[i];
              const childKey = generateQuestionKey(childItem, i);
              if (!processed.has(childKey)) {
                stack.push({
                  question: childItem,
                  index: i,
                  level: level + 1,
                  parentQuestion: question,
                });
              }
            }
            continue;
          }
        }

        const childrenElements: React.JSX.Element[] = [];
        if (shouldRenderChildren) {
          const childs = question.children as Array<ContentType>;
          for (let i = 0; i < childs.length; i++) {
            const childItem = childs[i];
            const childKey = generateQuestionKey(childItem, i);
            const childElement = processed.get(childKey);
            if (childElement) {
              childrenElements.push(childElement);
            }
          }
        }

        const element = (
          <div key={questionKey} className="relative">
            <QuestionCard
              question={question}
              level={level}
              parentQuestion={parentQuestion}
              isExpanded={isExpanded}
              hasChildren={hasChildren}
              onQuestionClick={handleCardClick}
              onToggleVisibility={(val) =>
                handleToggleVisibility(val, question.qIdx)
              }
              onToggleExpanded={() => toggleSection(questionKey)}
            />

            {shouldRenderChildren && childrenElements.length > 0 && (
              <div className="space-y-1.5 transition-all duration-200 ease-in-out">
                {childrenElements}
              </div>
            )}

            {question.isVisible &&
              hasChildren &&
              !isExpanded &&
              question.children &&
              question.children.length > 0 && (
                <div
                  className="ml-6 sm:ml-8 my-1 py-1 px-2 text-[11px] sm:text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 rounded-md inline-block cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
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

        processed.set(questionKey, element);
        stack.pop();
      }

      return rootQuestions.map((q, i) => {
        const key = generateQuestionKey(q, i);
        return processed.get(key)!;
      });
    },
    [
      generateQuestionKey,
      expandedSections,
      handleCardClick,
      handleToggleVisibility,
      toggleSection,
    ],
  );

  return (
    <>
      {/* Mobile Backdrop Overlay - Click outside to dismiss */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 sm:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      <motion.aside
        initial={isMobile ? { x: "-100%" } : { x: -320, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={isMobile ? { x: "-100%" } : { x: -320, opacity: 0 }}
        transition={{
          type: "spring",
          stiffness: 340,
          damping: 34,
          mass: 0.8,
        }}
        className={`bg-white dark:bg-gray-800 flex flex-col transition-all duration-300 ease-in-out overflow-hidden ${
          isMobile
            ? "fixed inset-y-0 left-0 z-50 w-[85vw] max-w-[340px] h-[100dvh] shadow-2xl border-r border-gray-200 dark:border-gray-700"
            : "w-80 sticky top-20 self-start h-[calc(100vh-5rem)] border-r border-gray-200 dark:border-gray-700 shadow-none z-30"
        }`}
      >
        <Header
          currentPage={currentPage}
          totalPages={formState.totalpage}
          totalQuestions={totalQuestionsOnPage}
          visibleQuestions={visibleQuestionsCount}
          searchQuery={searchQuery}
          selectedFilter={selectedFilter}
          showOnlyVisible={showOnlyVisible}
          onSearchChange={setSearchQuery}
          onFilterChange={setSelectedFilter}
          onToggleVisibility={() => setShowOnlyVisible(!showOnlyVisible)}
          onExpandAll={() => setExpandedSections({})}
          onClose={onClose}
        />

        {/* Page progress bar indicator */}
        <div className="w-full h-1 bg-gray-100 dark:bg-gray-700 shrink-0">
          <div
            className="h-full bg-primary"
            style={{ width: `${(currentPage / formState.totalpage) * 100}%` }}
          />
        </div>

        {/* Question Tree List with safe scrolling */}
        <ScrollShadow
          className="flex-1 px-2.5 sm:px-3.5 py-3 overflow-x-hidden overscroll-contain"
          hideScrollBar={false}
          size={16}
        >
          <div className="space-y-1.5 pb-4">
            {questionHierarchy.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <div className="p-5 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/50">
                  <p className="text-sm font-medium">No questions found</p>
                  <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                    {totalQuestionsOnPage > 0
                      ? "Try changing your search or filter"
                      : "Add questions to this page to see the outline"}
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div>{renderQuestions(questionHierarchy)}</div>

                {questionHierarchy.length > 1 && (
                  <div className="mt-4 pt-2">
                    <Divider className="dark:bg-gray-700" />
                    <div className="text-center text-[11px] text-gray-500 dark:text-gray-400 py-2">
                      {questionHierarchy.length} top-level question
                      {questionHierarchy.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollShadow>

        {/* Mobile footer with result count and done button */}
        <div className="sm:hidden px-3.5 py-2.5 border-t border-gray-200 dark:border-gray-700 bg-gray-50/95 dark:bg-gray-800/95 backdrop-blur flex justify-between items-center shrink-0">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            {searchQuery
              ? `${questionHierarchy.length} result${questionHierarchy.length !== 1 ? "s" : ""}`
              : `${totalQuestionsOnPage} question${totalQuestionsOnPage !== 1 ? "s" : ""}`}
          </span>
          <Button
            size="sm"
            variant="flat"
            color="primary"
            className="h-8 text-xs font-semibold px-4"
            onPress={onClose}
          >
            Done
          </Button>
        </div>
      </motion.aside>
    </>
  );
};

export default QuestionStructure;
