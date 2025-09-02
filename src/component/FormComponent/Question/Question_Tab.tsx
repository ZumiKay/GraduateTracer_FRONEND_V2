import { useCallback, useMemo, useRef, useState, memo } from "react";
import { RootState } from "../../../redux/store";
import { useDispatch, useSelector } from "react-redux";
import {
  ChoiceQuestionType,
  ContentType,
  DefaultContentType,
  ParentContentType,
} from "../../../types/Form.types";
import { AutoSaveQuestion } from "../../../pages/FormPage.action";
import { ErrorToast, PromiseToast } from "../../Modal/AlertModal";
import {
  setallquestion,
  setformstate,
  setpage,
  setprevallquestion,
  setreloaddata,
  setshowLinkedQuestion,
  setpauseAutoSave,
} from "../../../redux/formstore";
import ApiRequest from "../../../hooks/ApiHook";
import QuestionComponent from "../QuestionComponent";
import { Button, Image } from "@heroui/react";
import { PlusIcon } from "../../svg/GeneralIcon";
import { setopenmodal } from "../../../redux/openmodal";
import MinusIcon from "../../../assets/minus.png";
import PlusImg from "../../../assets/add.png";
import { QuestionLoading } from "../../Loading/ContainerLoading";
import { useSetSearchParam } from "../../../hooks/CustomHook";
import QuestionStructure from "./QuestionStructure";
import { checkUnsavedQuestions } from "../../../utils/formValidation";
import { ConditionContentCopy } from "../../../helperFunc";

const QuestionTab = () => {
  const componentRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const { setParams } = useSetSearchParam();
  const [showStructure, setShowStructure] = useState(true);
  const [isPageLoading, setIsPageLoading] = useState(false);

  const formState = useSelector((root: RootState) => root.allform.formstate);
  const page = useSelector((root: RootState) => root.allform.page);
  const fetchLoading = useSelector(
    (root: RootState) => root.allform.fetchloading
  );
  const allQuestion = useSelector(
    (root: RootState) => root.allform.allquestion
  );
  const prevAllQuestion = useSelector(
    (root: RootState) => root.allform.prevAllQuestion
  );
  const showLinkedQuestion = useSelector(
    (root: RootState) => root.allform.showLinkedQuestions
  );

  const dispatch = useDispatch();

  const hasUnsavedQuestions = useCallback(() => {
    return checkUnsavedQuestions(allQuestion, prevAllQuestion, page);
  }, [allQuestion, prevAllQuestion, page]);

  const showSaveConfirmation = useCallback(
    (onConfirm: () => void) => {
      dispatch(
        setopenmodal({
          state: "confirm",
          value: {
            open: true,

            data: {
              question:
                "You have unsaved questions. Please save them before proceeding.",
              onAgree: onConfirm,
              btn: {
                agree: "Proceed",
                disagree: "No",
              },
            },
          },
        })
      );
    },
    [dispatch]
  );

  const handleAddQuestion = useCallback(async () => {
    const qIdx = (formState?.lastqIdx ?? 0) + (allQuestion.length + 1);
    const updatedQuestions: Array<ContentType> = [
      ...(allQuestion ?? []),
      {
        ...DefaultContentType,
        qIdx,
        page,
      },
    ];

    if (formState.setting?.autosave) {
      const createReq = AutoSaveQuestion({
        data: updatedQuestions,
        formId: formState._id ?? "",
        type: "save",
        page,
      });
      const process = await PromiseToast(
        { promise: createReq },
        { pending: "Creating", error: "Can't Create" }
      );
      if (!process.success || !process.data) return;
      const savedData = process.data as Array<string>;
      dispatch(
        setallquestion((prev) => [
          ...prev,
          {
            ...DefaultContentType,
            _id: savedData[0],
            page,
            qIdx,
          },
        ])
      );
    } else {
      dispatch(setallquestion(updatedQuestions));
    }
  }, [
    formState.lastqIdx,
    formState.setting?.autosave,
    formState._id,
    allQuestion,
    page,
    dispatch,
  ]);

  const handleDeleteQuestion = useCallback(
    async (qidx: number) => {
      const questionToDelete = allQuestion[qidx];
      if (!questionToDelete) return;

      // Pause autosave during delete operation
      dispatch(setpauseAutoSave(true));

      const deleteRequest = async () => {
        try {
          if (formState.setting?.autosave && questionToDelete._id) {
            const request = await PromiseToast(
              {
                promise: ApiRequest({
                  url: "/deletecontent",
                  method: "DELETE",
                  cookie: true,
                  refreshtoken: true,
                  data: {
                    id: questionToDelete._id,
                    formId: formState._id,
                  },
                }),
              },
              { pending: "Deleting Question", error: "Can't Delete" }
            );

            if (!request.success) return;
          }

          //Delete conditions
          const idxToBeDelete = questionToDelete.conditional?.map(
            (i) => i.contentIdx
          );

          dispatch(
            setallquestion((prev) =>
              prev
                .filter(
                  (_, idx) => idx !== qidx && !idxToBeDelete?.includes(idx)
                )
                .map((question) => {
                  const updatedqIdx =
                    question.qIdx > questionToDelete.qIdx
                      ? question.qIdx - 1 - (idxToBeDelete?.length ?? 0)
                      : question.qIdx;

                  return {
                    ...question,
                    qIdx: updatedqIdx,
                    conditional: question?.conditional
                      ?.filter((condition) =>
                        questionToDelete._id
                          ? condition.contentId !== questionToDelete._id
                          : condition.contentIdx !== qidx
                      )
                      .map((condition) => ({
                        ...condition,
                        contentIdx:
                          condition.contentIdx !== undefined &&
                          condition.contentIdx > qidx
                            ? condition.contentIdx - 1
                            : condition.contentIdx,
                      })),
                  };
                })
            )
          );
        } finally {
          dispatch(setpauseAutoSave(false));
        }
      };

      const hasConditionals =
        questionToDelete.conditional &&
        questionToDelete.conditional?.length > 0;

      if (hasConditionals) {
        dispatch(
          setopenmodal({
            state: "confirm",
            value: { open: true, data: { onAgree: deleteRequest } },
          })
        );
      } else {
        await deleteRequest();
      }
    },
    [allQuestion, formState.setting?.autosave, formState._id, dispatch]
  );

  const handleAddCondition = useCallback(
    async (questionIdx: number, anskey: number): Promise<void> => {
      if (questionIdx < 0 || questionIdx >= allQuestion.length) {
        console.warn("Invalid question index for condition:", questionIdx);
        return;
      }

      const targetQuestion = allQuestion[questionIdx];
      if (!targetQuestion) {
        console.warn("Question not found at index:", questionIdx);
        return;
      }

      dispatch(setpauseAutoSave(true));

      try {
        dispatch(
          setallquestion((prevQuestions) => {
            const existingConditionals = targetQuestion.conditional || [];
            const nextAvailableIdx = targetQuestion.qIdx + 1;

            const maxExistingConditionIdx =
              existingConditionals.length > 0
                ? Math.max(
                    ...(existingConditionals
                      .map(
                        (condQues) =>
                          condQues.contentIdx &&
                          prevQuestions[condQues.contentIdx].qIdx
                      )
                      .filter(Boolean) as number[])
                  )
                : targetQuestion.qIdx;

            const newChildQIdx = Math.max(
              maxExistingConditionIdx,
              nextAvailableIdx
            );

            const newConditional = {
              contentIdx: questionIdx + 1,
              key: anskey,
            };

            const newChildQuestion: ContentType = {
              ...DefaultContentType,
              qIdx: newChildQIdx,
              parentcontent: {
                optIdx: anskey,
                qIdx: questionIdx,
                qId: targetQuestion._id,
              },
              page,
            };

            const result: ContentType[] = [];
            let insertionDone = false;

            for (let i = 0; i < prevQuestions.length; i++) {
              const currentQuestion = prevQuestions[i];

              if (i === questionIdx) {
                // Update target question with new conditional
                result.push({
                  ...currentQuestion,
                  conditional: [
                    ...existingConditionals.map((cond) => ({
                      ...cond,
                      contentIdx:
                        cond.contentIdx !== undefined &&
                        cond.contentIdx >= newChildQIdx
                          ? cond.contentIdx + 1
                          : cond.contentIdx,
                    })),
                    newConditional,
                  ],
                });

                result.push(newChildQuestion);
                insertionDone = true;
              } else {
                const needsUpdate = currentQuestion.qIdx >= newChildQIdx;

                if (needsUpdate) {
                  result.push({
                    ...currentQuestion,
                    qIdx: currentQuestion.qIdx + 1,
                    conditional: currentQuestion.conditional?.map((cond) => ({
                      ...cond,
                      contentIdx:
                        cond.contentIdx !== undefined &&
                        cond.contentIdx >= newChildQIdx
                          ? cond.contentIdx + 1
                          : cond.contentIdx,
                    })),
                    parentcontent:
                      currentQuestion.parentcontent &&
                      currentQuestion.parentcontent.qIdx !== undefined
                        ? {
                            ...currentQuestion.parentcontent,
                            qIdx:
                              currentQuestion.parentcontent.qIdx >= questionIdx
                                ? currentQuestion.parentcontent.qIdx + 1
                                : currentQuestion.parentcontent.qIdx,
                          }
                        : currentQuestion.parentcontent,
                  });
                } else {
                  result.push(currentQuestion);
                }
              }
            }

            if (!insertionDone) {
              result.push(newChildQuestion);
            }

            return result;
          })
        );
      } catch (error) {
        console.error("Error in handleAddCondition:", error);
        ErrorToast({
          title: "Failed to Add Condition",
          content: "An error occurred while adding the condition",
        });
      } finally {
        dispatch(setpauseAutoSave(false));
      }
    },
    [allQuestion, page, dispatch]
  );

  const removeConditionedQuestion = useCallback(
    async (
      ansidx: number,
      qidx: number,
      ty: "unlink" | "delete"
    ): Promise<void> => {
      const questionToUpdate = allQuestion[qidx];
      if (!questionToUpdate) return;

      const questionConditionContent = questionToUpdate.conditional?.find(
        (con) => con.key === ansidx
      );

      const updatedQuestion = {
        ...questionToUpdate,
        conditional: questionToUpdate.conditional
          ?.filter(
            (con) =>
              con.contentId !== questionConditionContent?.contentId ||
              con.contentIdx !== questionConditionContent?.contentIdx
          )
          .map((cond) => {
            return {
              ...cond,
              contentIdx:
                cond.contentIdx !== undefined &&
                questionConditionContent?.contentIdx !== undefined &&
                cond.contentIdx > questionConditionContent?.contentIdx
                  ? cond.contentIdx - 1
                  : cond.contentIdx,
            };
          }),
      } as ContentType<Array<ChoiceQuestionType>>;

      if (
        ty === "delete" &&
        Array.isArray(updatedQuestion[updatedQuestion.type as never])
      ) {
        updatedQuestion[updatedQuestion.type] = (
          updatedQuestion[updatedQuestion.type] as Array<ChoiceQuestionType>
        ).filter((i, idx) =>
          i.idx ? i.idx !== ansidx : idx !== ansidx
        ) as never;
      }

      const updatedAllQuestion = allQuestion.filter((q, idx) =>
        q._id
          ? q._id !== questionConditionContent?.contentId
          : idx !== questionConditionContent?.contentIdx
      );

      const finalQuestionList = updatedAllQuestion.map((q, idx) => {
        if (q._id ? q._id === questionToUpdate._id : idx === qidx)
          return updatedQuestion;
        if (
          questionConditionContent?.contentIdx &&
          idx > questionConditionContent?.contentIdx
        ) {
          return { ...q, qIdx: q.qIdx - 1 };
        }
        return q;
      });

      dispatch(setallquestion(finalQuestionList));
    },
    [allQuestion, dispatch]
  );

  // Helper function to validate question structure
  const validateQuestionStructure = useCallback(
    (questions: Array<ContentType>) => {
      const errors: string[] = [];
      const qIdxSet = new Set<number>();

      questions.forEach((question, index) => {
        // Check for duplicate qIdx values
        if (qIdxSet.has(question.qIdx)) {
          errors.push(
            `Duplicate qIdx ${question.qIdx} found at position ${index}`
          );
        }
        qIdxSet.add(question.qIdx);

        if (question.conditional) {
          question.conditional.forEach((cond, condIndex) => {
            if (cond.contentIdx !== undefined) {
              const referencedQuestion = questions.find(
                (q) => q.qIdx === cond.contentIdx
              );
              if (!referencedQuestion) {
                errors.push(
                  `Question ${index}: Conditional ${condIndex} references non-existent qIdx ${cond.contentIdx}`
                );
              }
            }
          });
        }

        if (
          question.parentcontent &&
          question.parentcontent.qIdx !== undefined
        ) {
          const parentQuestion = questions.find(
            (q) => q.qIdx === question.parentcontent!.qIdx
          );
          if (!parentQuestion) {
            errors.push(
              `Question ${index}: Parent content references non-existent qIdx ${question.parentcontent.qIdx}`
            );
          }
        }
      });

      return {
        isValid: errors.length === 0,
        errors,
      };
    },
    []
  );

  const handleDuplication = useCallback(
    async (idx: number) => {
      // Validate input
      if (idx < 0 || idx >= allQuestion.length) {
        ErrorToast({
          title: "Error",
          content: "Invalid question index for duplication",
        });
        return;
      }

      const questionToDuplicate = allQuestion[idx];
      if (!questionToDuplicate) {
        ErrorToast({
          title: "Error",
          content: "Question to duplicate not found",
        });
        return;
      }

      try {
        let duplicatedContent: Array<ContentType> = [];

        // Handle conditional questions
        if (
          questionToDuplicate.conditional &&
          questionToDuplicate.conditional.length > 0
        ) {
          const conditionalContent = ConditionContentCopy({
            org: questionToDuplicate,
            allquestion: allQuestion,
          });

          if (conditionalContent.length > 0) {
            duplicatedContent = conditionalContent;
          } else {
            duplicatedContent = [
              {
                ...questionToDuplicate,
                _id: undefined,
                qIdx: questionToDuplicate.qIdx + 1,
              },
            ];
          }
        } else {
          duplicatedContent = [
            {
              ...questionToDuplicate,
              _id: undefined,
              qIdx: questionToDuplicate.qIdx + 1,
              parentcontent: questionToDuplicate.parentcontent
                ? {
                    ...questionToDuplicate.parentcontent,
                    qId: undefined,
                  }
                : undefined,
            },
          ];
        }

        // Calculate the offset needed for subsequent questions
        const duplicatedCount = duplicatedContent.length;

        // Update subsequent questions' indices and references
        const updateQuestionIndices = (
          question: ContentType,
          offset: number
        ): ContentType => ({
          ...question,
          qIdx: question.qIdx + offset,
          conditional: question.conditional?.map((cond, condIdx) => ({
            ...cond,
            contentIdx: condIdx + offset + 1, //Assign New MapIdx
          })),
        });

        // Build the new questions array
        const updatedQuestions: Array<ContentType> = [
          // Questions before the duplicated question (unchanged)
          ...allQuestion.slice(0, idx + 1),
          // The duplicated content
          ...duplicatedContent,
          // Questions after the duplicated question (with updated indices)
          ...allQuestion
            .slice(idx + 1)
            .map((question) =>
              updateQuestionIndices(question, duplicatedCount)
            ),
        ];

        // Validate the new structure before applying
        const validation = validateQuestionStructure(updatedQuestions);
        if (!validation.isValid) {
          console.warn(
            "Question structure validation failed:",
            validation.errors
          );
          ErrorToast({
            title: "Duplication Failed",
            content: "Invalid question structure detected",
          });
          return;
        }

        dispatch(setallquestion(updatedQuestions));

        console.log(
          `Successfully duplicated ${duplicatedCount} question${
            duplicatedCount > 1 ? "s" : ""
          }`
        );
      } catch (error) {
        console.error("Error during duplication:", error);
        ErrorToast({
          title: "Duplication Failed",
          content: "An error occurred while duplicating the question",
        });
      }
    },
    [allQuestion, dispatch, validateQuestionStructure]
  );

  const checkIsLinkedForQuestionOption = useCallback(
    (ansidx: number, qidx: number) =>
      allQuestion[qidx] && allQuestion[qidx].conditional
        ? allQuestion[qidx].conditional.some((con) => con.key === ansidx)
        : false,
    [allQuestion]
  );

  const checkConditionedContent = useCallback(
    (id: string | number, parentcontent?: ParentContentType) => {
      if (parentcontent) {
        return {
          key: id,
          qIdx: parentcontent.qIdx as number,
          ansIdx: parentcontent.optIdx as number,
          parentQIdx:
            parentcontent.qIdx && allQuestion[parentcontent.qIdx].qIdx,
        };
      }

      const qIdx = allQuestion.findIndex((question) =>
        question.conditional?.some(
          (con) => con.contentId === id || con.contentIdx === id
        )
      );

      if (qIdx === -1) {
        return { key: "", qIdx: -1, ansIdx: 0 };
      }

      const key = `${allQuestion[qIdx].type}${qIdx}`;
      const ansIdx =
        allQuestion[qIdx].conditional?.find(
          (con) => con.contentId === id || con.contentIdx === id
        )?.key ?? 0;

      return { key, qIdx, ansIdx };
    },
    [allQuestion]
  );

  const scrollToDiv = useCallback((key: string) => {
    const element = componentRefs.current[key];
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const handlePageInternal = useCallback(
    async (type: "add" | "delete", deletepage?: number) => {
      // Set loading state for delete operations
      if (type === "delete") {
        setIsPageLoading(true);
      }

      let updatedPage = 0;
      let newTotalPages = formState.totalpage;

      if (type === "add") {
        newTotalPages = formState.totalpage + 1;
        updatedPage = newTotalPages;
      } else {
        newTotalPages = Math.max(1, formState.totalpage - 1);
        updatedPage = newTotalPages;
        if (deletepage && deletepage <= page) {
          updatedPage = Math.max(1, page - 1);
        } else {
          updatedPage = page > newTotalPages ? newTotalPages : page;
        }
      }

      try {
        setIsPageLoading(true);
        const request = await ApiRequest({
          url: "/modifypage",
          method: "PUT",
          cookie: true,
          refreshtoken: true,
          data: {
            formId: formState._id,
            ty: type,
            deletepage,
          },
        });
        setIsPageLoading(false);

        if (!request.success) {
          ErrorToast({
            title: "Failed",
            content: request.error ?? "Error Occured",
          });
          return;
        }

        if (type === "delete" && deletepage) {
          const updatedQuestions = allQuestion
            .filter((q) => q.page !== deletepage)
            .map((q) => ({
              ...q,
              page: q.page && q.page > deletepage ? q.page - 1 : q.page || 1,
            }));

          dispatch(setallquestion(updatedQuestions));
          dispatch(setprevallquestion(updatedQuestions));
        }

        dispatch(setformstate({ ...formState, totalpage: newTotalPages }));

        // Update current page and URL
        dispatch(setpage(updatedPage));
        setParams({ page: updatedPage.toString() });

        if (type === "delete") dispatch(setreloaddata(true));
      } finally {
        // Clear loading state
        if (type === "delete") {
          setIsPageLoading(false);
        }
      }
    },
    [formState, setParams, dispatch, allQuestion, page]
  );

  const handlePage = useCallback(
    async (type: "add" | "delete", deletepage?: number) => {
      // Check for unsaved questions before proceeding
      if (hasUnsavedQuestions()) {
        showSaveConfirmation(() => {
          handlePageInternal(type, deletepage);
        });
        return;
      }

      handlePageInternal(type, deletepage);
    },
    [hasUnsavedQuestions, showSaveConfirmation, handlePageInternal]
  );

  const questionColor = useMemo(
    () => formState.setting?.qcolor as string,
    [formState.setting?.qcolor]
  );

  const shouldShowConditionedQuestion = useCallback(
    (questionData: ContentType): boolean => {
      // First check if this question has a parent
      if (questionData.parentcontent) {
        const parentQuestionIndex = questionData.parentcontent.qIdx;
        if (
          parentQuestionIndex !== undefined &&
          allQuestion[parentQuestionIndex]
        ) {
          const parentQuestion = allQuestion[parentQuestionIndex];

          // Check if parent is visible
          const parentLinkedQuestion = showLinkedQuestion?.find(
            (i) =>
              i.question ===
              (parentQuestion._id ?? `temp-question-${parentQuestionIndex}`)
          );
          const parentVisibility =
            parentLinkedQuestion?.show !== undefined
              ? parentLinkedQuestion.show
              : true;

          if (!parentVisibility) {
            return false;
          }

          return shouldShowConditionedQuestion(parentQuestion);
        }
      }

      // If no parent  is visible, check this question's own visibility
      const questionId =
        questionData._id ??
        `temp-question-${allQuestion.indexOf(questionData)}`;
      const linkedQuestion = showLinkedQuestion?.find(
        (i) => i.question === questionId
      );
      const currentVisibility =
        linkedQuestion?.show !== undefined ? linkedQuestion.show : true;

      return currentVisibility;
    },
    [showLinkedQuestion, allQuestion]
  );

  const handleQuestionClick = useCallback((questionKey: string) => {
    const element = componentRefs.current[questionKey];
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const handleToggleVisibility = useCallback(
    (questionId: string | number) => {
      const currentState = showLinkedQuestion ?? [];
      const existingIndex = currentState.findIndex(
        (item) => item.question === questionId
      );

      const newState = [...currentState];
      const currentVisibility =
        existingIndex !== -1 ? currentState[existingIndex].show : true;
      const newVisibility = !currentVisibility;

      if (existingIndex !== -1) {
        newState[existingIndex] = {
          ...newState[existingIndex],
          show: newVisibility,
        };
      } else {
        newState.push({ question: questionId, show: newVisibility });
      }

      dispatch(setshowLinkedQuestion(newState as never));
    },
    [showLinkedQuestion, dispatch]
  );

  return (
    <div className="w-full h-fit flex flex-row">
      {/* Question Structure Sidebar */}
      {showStructure && (
        <QuestionStructure
          onQuestionClick={handleQuestionClick}
          onToggleVisibility={handleToggleVisibility}
          currentPage={page}
          onClose={() => setShowStructure(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center gap-y-20 p-4">
        {/* Toggle Structure Button */}
        {!showStructure && (
          <Button
            className="self-start mb-4"
            variant="flat"
            onPress={() => setShowStructure(true)}
            aria-label="Show question structure sidebar"
          >
            Show Question Structure
          </Button>
        )}

        {fetchLoading || isPageLoading ? (
          <QuestionLoading count={3} />
        ) : (
          allQuestion.map((question, idx) => {
            const questionKey = `${question.type}${question._id ?? idx}`;
            const isChildCondition = question.parentcontent
              ? shouldShowConditionedQuestion(question)
              : true;

            return (
              isChildCondition && (
                <div
                  className="w-[90%] h-fit"
                  key={questionKey}
                  ref={(el) => {
                    componentRefs.current[questionKey] = el;
                  }}
                >
                  <QuestionComponent
                    idx={idx}
                    isLinked={(ansidx) =>
                      checkIsLinkedForQuestionOption(ansidx, idx)
                    }
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
                    scrollToCondition={scrollToDiv}
                    isConditioned={() =>
                      checkConditionedContent(
                        question._id ?? idx,
                        question.parentcontent
                      ) as never
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
            onPress={() => {
              dispatch(
                setopenmodal({
                  state: "confirm",
                  value: {
                    open: true,
                    data: {
                      onAgree: () => handlePage("delete", page),
                    },
                  },
                })
              );
            }}
            startContent={
              !isPageLoading && (
                <Image
                  src={MinusIcon}
                  alt="minus"
                  width={20}
                  height={20}
                  loading="lazy"
                />
              )
            }
          >
            {isPageLoading ? "Deleting..." : "Delete Page"}
          </Button>
          <Button
            className="max-w-xs font-bold text-black border-x-0 border-t-0 transition-transform hover:translate-x-1"
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
                loading="lazy"
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

export default memo(QuestionTab);
