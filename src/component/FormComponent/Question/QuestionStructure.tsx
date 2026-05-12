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
  children?: JSX.Element[];
}

const QuestionStructure: React.FC<QuestionStructureProps> = ({
  onQuestionClick,
  onToggleVisibility,
  currentPage,
  onClose,
}) => {
  //Build Question Structure with nested or non-nested question Hook
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

      //Update Question Card
      onToggleVisibility(questionId);
    },
    [onToggleVisibility],
  );

  //Render question method
  const renderQuestions = useCallback(
    (rootQuestions: Array<ContentType>) => {
      //Initialize the stacks
      const stack: StackItem[] = [
        ...rootQuestions
          .map((q, i) => ({
            question: q,
            index: i,
            level: 0,
            parentQuestion: undefined,
          }))
          .reverse(), //Reverse to last one first
      ];

      const processed = new Map<string, JSX.Element>();

      //Loop through stack
      while (stack.length > 0) {
        const item = stack[stack.length - 1];
        const { question, level, parentQuestion, index } = item;
        const questionKey = generateQuestionKey(question, index);
        const isExpanded = expandedSections[questionKey] !== false;
        const hasChildren = question.children && question.children.length > 0;

        //Condition question procession
        const shouldRenderChildren = hasChildren && isExpanded;

        //Process childs question
        if (shouldRenderChildren && !processed.has(questionKey)) {
          const childs = question.children as Array<ContentType>;
          const allChildrenProcessed = childs.every((child, i) =>
            processed.has(generateQuestionKey(child, i)),
          );

          if (!allChildrenProcessed) {
            // Push unprocessed children onto the stack in reverse order as stack is LIFO
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

        //Collecting child elements in order
        const childrenElements: JSX.Element[] = [];
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
              onQuestionClick={() =>
                onQuestionClick({
                  questionId: question._id || question.qIdx,
                  type: question.type,
                })
              }
              onToggleVisibility={(val) =>
                handleToggleVisibility(val, question.qIdx)
              }
              onToggleExpanded={() => toggleSection(questionKey)}
            />

            {shouldRenderChildren && childrenElements.length > 0 && (
              <div className="space-y-2 pl-2 transition-all duration-300 ease-in-out">
                {childrenElements}
              </div>
            )}

            {question.isVisible &&
              hasChildren &&
              !isExpanded &&
              question.children &&
              question.children.length > 0 && (
                <div
                  className="ml-8 my-1 py-1 px-2 text-xs text-gray-500 bg-gray-100 rounded-md inline-block cursor-pointer hover:bg-gray-200 transition-colors"
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
      onQuestionClick,
      handleToggleVisibility,
      toggleSection,
    ],
  );

  return (
    <motion.aside
      initial={{ x: -320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -320, opacity: 0 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        mass: 0.8,
      }}
      className={`w-full sm:w-80 bg-gray-50 border-r border-gray-200 dark:bg-gray-800 dark:border-gray-700 flex flex-col transition-all duration-300 ease-in-out sticky top-20 self-start overflow-hidden ${
        isMobile ? "shadow-lg h-screen" : "h-[calc(100vh-5rem)]"
      }`}
      style={{ zIndex: 40 }}
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

      <div className="w-full h-1 bg-gray-100">
        <div
          className="h-full bg-primary/80"
          style={{ width: `${(currentPage / formState.totalpage) * 100}%` }}
        />
      </div>

      <ScrollShadow
        className="flex-1 px-3 py-4 overflow-x-hidden"
        hideScrollBar={false}
        size={20}
      >
        <div className="space-y-2">
          {questionHierarchy.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-white">
              <div className="p-6 border border-dashed border-gray-300 rounded-lg bg-gray-50/50">
                <p className="text-base font-medium">
                  No questions on this page
                </p>
                <p className="text-sm mt-2 text-gray-500 dark:text-white">
                  {totalQuestionsOnPage > 0
                    ? "All questions are conditionally hidden"
                    : "Click the add button to create your first question"}
                </p>
              </div>
            </div>
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.4,
                  ease: "easeOut",
                  staggerChildren: 0.1,
                }}
              >
                {renderQuestions(questionHierarchy)}
              </motion.div>
              {questionHierarchy.length > 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                  className="mt-6 pt-2"
                >
                  <Divider />
                  <div className="text-center text-xs text-gray-500 dark:text-white py-2">
                    {questionHierarchy.length} top-level question
                    {questionHierarchy.length !== 1 ? "s" : ""}
                  </div>
                </motion.div>
              )}
            </>
          )}
        </div>
      </ScrollShadow>

      {isMobile && (
        <div className="p-3 border-t border-gray-200 bg-white/95 backdrop-blur flex justify-between items-center">
          <div className="text-xs text-gray-600">
            {searchQuery && questionHierarchy.length > 0 && (
              <span>
                {questionHierarchy.length} result
                {questionHierarchy.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
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
    </motion.aside>
  );
};

export default QuestionStructure;
