import { AnimatePresence, motion } from "framer-motion";
import { Button, Image } from "@heroui/react";
import { PlusIcon } from "../../svg/GeneralIcon";
import MinusIcon from "../../../assets/minus.png";
import PlusImg from "../../../assets/add.png";
import { QuestionLoading } from "../../Loading/ContainerLoading";
import QuestionComponent from "../QuestionComponent";
import QuestionStructure from "./QuestionStructure";
import { useQuestionTab } from "./useQuestionTab";

const QuestionTab = () => {
  const {
    componentRefs,
    showStructure,
    setShowStructure,
    isPageLoading,
    questionLoading,
    fetchLoading,
    allQuestion,
    formState,
    page,
    questionColor,
    handleAddQuestion,
    handleDeleteQuestion,
    handleAddCondition,
    removeConditionedQuestion,
    handleDuplication,
    scrollToDiv,
    handlePage,
    handleDeletePage,
    handleQuestionClick,
    handleToggleVisibility,
  } = useQuestionTab();

  return (
    <div className="w-full h-fit flex flex-row">
      <AnimatePresence mode="wait">
        {showStructure && (
          <QuestionStructure
            onQuestionClick={handleQuestionClick}
            onToggleVisibility={handleToggleVisibility}
            currentPage={page}
            onClose={() => setShowStructure(false)}
          />
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col items-center gap-y-20 p-4">
        <AnimatePresence mode="wait">
          {!showStructure && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="self-start mb-4"
            >
              <Button
                variant="flat"
                onPress={() => setShowStructure(true)}
                aria-label="Show question structure sidebar"
              >
                Show Question Structure
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {fetchLoading || isPageLoading ? (
          <QuestionLoading count={3} />
        ) : (
          allQuestion.map((question, idx) => {
            const questionKey = `${question.type}${question._id ?? question.qIdx}`;
            const isChildCondition = question.parentcontent
              ? question.isVisible
              : true;
            const isLinked = (ansidx: number) =>
              question.conditional?.some((con) => con.key === ansidx) ?? false;

            return (
              isChildCondition && (
                <div
                  className="w-[90%] h-fit"
                  key={questionKey}
                  ref={(el) => {
                    componentRefs.current[questionKey] = el;
                  }}
                  id={`${page}-${question._id ?? question.qIdx}`}
                >
                  <QuestionComponent
                    idx={idx}
                    isLinked={isLinked}
                    value={question}
                    color={questionColor}
                    onDelete={() => handleDeleteQuestion(idx)}
                    onAddCondition={(answeridx) =>
                      handleAddCondition(idx, answeridx)
                    }
                    removeCondition={(answeridx, ty) =>
                      removeConditionedQuestion(answeridx, idx, ty)
                    }
                    onDuplication={() => handleDuplication(idx)}
                    onShowLinkedQuestions={handleToggleVisibility}
                    scrollToCondition={(targetIdx) =>
                      scrollToDiv({ questionIdx: targetIdx })
                    }
                  />
                </div>
              )
            );
          })
        )}

        <Button
          startContent={<PlusIcon width={"25px"} height={"25px"} />}
          className="w-[90%] h-[40px] bg-success dark:bg-lightsucess font-bold text-white dark:text-black"
          onPress={handleAddQuestion}
          isLoading={questionLoading}
          aria-label="Add new question"
        >
          New Question
        </Button>

        <div className="page-btn w-full h-fit flex flex-row items-center justify-between">
          <Button
            className="max-w-xs font-bold text-red-400 border-x-0 border-t-0 transition-transform hover:translate-x-1"
            radius="none"
            style={
              formState.totalpage === 1 || page === 1 ? { display: "none" } : {}
            }
            color="danger"
            variant="bordered"
            isLoading={isPageLoading}
            isDisabled={isPageLoading}
            aria-label="Delete current page"
            onPress={handleDeletePage}
            startContent={
              !isPageLoading && (
                <Image
                  src={MinusIcon}
                  alt="minus"
                  width={20}
                  height={20}
                  loading="eager"
                />
              )
            }
          >
            {isPageLoading ? "Deleting..." : "Delete Page"}
          </Button>
          <Button
            className="max-w-xs font-bold text-black dark:text-white border-x-0 border-t-0 transition-transform hover:translate-x-1"
            radius="none"
            color="primary"
            variant="bordered"
            isDisabled={isPageLoading}
            onPress={() => handlePage("add")}
            aria-label="Add new page"
            startContent={
              <Image
                src={PlusImg}
                alt="plus"
                width={20}
                height={20}
                loading="eager"
              />
            }
          >
            New Page
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuestionTab;
