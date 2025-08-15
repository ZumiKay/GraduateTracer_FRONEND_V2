import { useCallback, useMemo, useRef, useState, memo } from "react";
import { RootState } from "../../../redux/store";
import { useDispatch, useSelector } from "react-redux";
import {
  CheckboxQuestionType,
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
import ApiRequest, { ApiRequestReturnType } from "../../../hooks/ApiHook";
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

const QuestionTab = () => {
  const componentRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const { setParams } = useSetSearchParam();
  const [showStructure, setShowStructure] = useState(true);
  const [isPageLoading, setIsPageLoading] = useState(false);

  // Memoize selectors to prevent unnecessary re-renders
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
    const qIdx = allQuestion.length + 1;
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
  }, [allQuestion, page, formState.setting?.autosave, formState._id, dispatch]);

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
                  data: { id: questionToDelete._id, formId: formState._id },
                }),
              },
              { pending: "Deleting Question", error: "Can't Delete" }
            );

            if (!request.success) return;
          }

          dispatch(
            setallquestion((prev) =>
              prev
                .filter((_, idx) => idx !== qidx)
                .map((question) => {
                  const hasRelevantCondition = question.conditional?.some(
                    (cond) =>
                      cond.contentIdx === qidx ||
                      cond.contentId === questionToDelete._id
                  );

                  if (!hasRelevantCondition) return question;

                  return {
                    ...question,
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
          // Resume autosave after delete operation
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
      const toUpdateQuestion = allQuestion[questionIdx];
      if (!toUpdateQuestion) {
        return;
      }

      if (!toUpdateQuestion._id) {
        console.error("Cannot add condition to unsaved question");
        ErrorToast({
          title: "Save Required",
          content: "Please save the question before adding conditions to it.",
        });
        return;
      }
      if (toUpdateQuestion.parentcontent) {
        console.warn(
          "Adding condition to a question that already has a parent"
        );
      }

      //Debug
      if (import.meta.env.DEV) {
        console.log("Adding condition:", {
          questionIdx,
          anskey,
          questionId: toUpdateQuestion._id,
          hasParentContent: !!toUpdateQuestion.parentcontent,
          parentContent: toUpdateQuestion.parentcontent,
          allQuestionsCount: allQuestion.length,
        });
      }

      if (
        formState.setting?.autosave !== undefined &&
        formState.setting.autosave
      ) {
        const request = await PromiseToast(
          {
            promise: ApiRequest({
              url: "/handlecondition",
              method: "POST",
              cookie: true,
              refreshtoken: true,
              data: {
                content: { id: toUpdateQuestion._id, idx: questionIdx },
                key: anskey,
                newContent: { ...DefaultContentType, page },
                formId: formState._id,
              },
            }),
          },
          { pending: "Adding", success: "Condition Added", error: "Can't Add" }
        );

        if (!request.success || !request.data) {
          console.error("Failed to add condition:", request.error);
          return;
        }

        dispatch(setreloaddata(true));
      } else {
        const newContentId: number | string = questionIdx + 1;

        dispatch(
          setallquestion((prev) => {
            const newConditional = {
              contentIdx: newContentId,
              key: anskey,
            };

            const updatedQuestion = {
              ...toUpdateQuestion,
              conditional: [
                ...(toUpdateQuestion.conditional?.map((prevCond) => ({
                  ...prevCond,
                  contentIdx:
                    prevCond.contentIdx !== undefined &&
                    prevCond.contentIdx + 1,
                })) ?? []),
                newConditional,
              ],
            };

            const newContent = {
              ...DefaultContentType,
              qIdx: 0,
              parentcontent: {
                optIdx: anskey,
                qIdx: questionIdx,
                qId: toUpdateQuestion._id,
              },
              page,
            } as ContentType;

            const updatedList = [
              ...prev.slice(0, questionIdx + 1),
              newContent,
              ...prev.slice(questionIdx + 1),
            ];

            const finalList = updatedList.map((item, idx) =>
              item._id === toUpdateQuestion._id || idx === questionIdx
                ? updatedQuestion
                : item
            ) as Array<ContentType>;

            return finalList;
          })
        );
      }
    },
    [allQuestion, formState.setting?.autosave, formState._id, page, dispatch]
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
      } as ContentType<Array<CheckboxQuestionType>>;

      if (
        ty === "delete" &&
        Array.isArray(updatedQuestion[updatedQuestion.type as never])
      ) {
        updatedQuestion[updatedQuestion.type] = (
          updatedQuestion[updatedQuestion.type] as Array<CheckboxQuestionType>
        ).filter((i, idx) =>
          i.idx ? i.idx !== ansidx : idx !== ansidx
        ) as never;
      }

      const updatedAllQuestion = allQuestion.filter((q, idx) =>
        q._id
          ? q._id !== questionConditionContent?.contentId
          : idx !== questionConditionContent?.contentIdx
      );

      const finalQuestionList = updatedAllQuestion.map((q, idx) =>
        (q._id ? q._id === questionToUpdate._id : idx === qidx)
          ? updatedQuestion
          : q
      );

      if (formState.setting?.autosave && formState._id) {
        const isSaved = await PromiseToast({
          promise: AutoSaveQuestion({
            data: finalQuestionList,
            formId: formState._id,
            type: "save",
            page,
          }),
        });

        if (!isSaved) {
          ErrorToast({ title: "Failed", content: "Error occurred" });
          return;
        }
      }

      dispatch(setallquestion(finalQuestionList));
    },
    [allQuestion, formState.setting?.autosave, formState._id, page, dispatch]
  );

  const handleDuplication = useCallback(
    async (idx: number) => {
      const questionToBeDuplicate = allQuestion[idx];
      const contentToBeAdd = questionToBeDuplicate.conditional
        ? [
            questionToBeDuplicate,
            ...allQuestion
              .filter((fil, idx) =>
                questionToBeDuplicate.conditional?.some(
                  (cond) =>
                    cond.contentId === fil._id || cond.contentIdx === idx
                )
              )
              .map((question) => ({
                ...question,
                conditional: question.conditional?.map((cond) => ({
                  ...cond,
                  contentIdx: idx + 1,
                })),
              })),
          ].map((question) => ({ ...question, _id: undefined }))
        : { ...questionToBeDuplicate, _id: undefined };

      const updatequestions = [
        ...allQuestion.slice(0, idx + 1),
        ...(Array.isArray(contentToBeAdd) ? contentToBeAdd : [contentToBeAdd]),
        ...allQuestion.slice(idx + 1),
      ];

      if (formState.setting?.autosave && formState._id) {
        const isSaved = await PromiseToast(
          {
            promise: AutoSaveQuestion({
              data: updatequestions,
              formId: formState._id,
              type: "save",
              page,
            }),
          },
          { pending: "Copying" }
        );

        if (!isSaved) {
          ErrorToast({ title: "Failed", content: "Can't Save" });
          return;
        }
      }
      dispatch(setallquestion(updatequestions));
    },
    [allQuestion, formState.setting?.autosave, formState._id, page, dispatch]
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
        // If deleting current page or a page before current page, adjust current page
        if (deletepage && deletepage <= page) {
          updatedPage = Math.max(1, page - 1);
        } else {
          updatedPage = page > newTotalPages ? newTotalPages : page;
        }
      }

      try {
        const request = (await PromiseToast(
          {
            promise: ApiRequest({
              url: "/modifypage",
              method: "PUT",
              cookie: true,
              refreshtoken: true,
              data: {
                formId: formState._id,
                ty: type,
                deletepage,
              },
            }),
          },
          {
            pending: type === "add" ? "Adding Page" : "Deleting Page",
            success: type === "add" ? "Added" : "Deleted",
          }
        )) as ApiRequestReturnType;

        if (!request.success) {
          ErrorToast({ title: "Failed", content: "Can't Save" });
          return;
        }

        if (type === "delete" && deletepage) {
          // Immediately update the questions array to remove questions from deleted page
          const updatedQuestions = allQuestion
            .filter((q) => q.page !== deletepage)
            .map((q) => ({
              ...q,
              // Shift page numbers down for pages after the deleted page
              page: q.page && q.page > deletepage ? q.page - 1 : q.page || 1,
            }));

          // Update both current and previous question states
          dispatch(setallquestion(updatedQuestions));
          dispatch(setprevallquestion(updatedQuestions));
        }

        // Update form state with correct total page count
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
          // If user confirms, proceed without the check
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
    (question: number | string): boolean => {
      const linkedQuestion = showLinkedQuestion?.find(
        (i) => i.question === question
      );
      const currentVisibility =
        linkedQuestion?.show !== undefined ? linkedQuestion.show : true;

      if (!currentVisibility) {
        return false;
      }

      // Check if this question is a child of another question
      const questionData = allQuestion.find(
        (q) => q._id === question || q._id === question?.toString()
      );
      if (questionData?.parentcontent) {
        // Recursively check parent question visibility
        return shouldShowConditionedQuestion(questionData.parentcontent.qId);
      }

      return currentVisibility;
    },
    [showLinkedQuestion, allQuestion]
  );

  // Handle question click from structure
  const handleQuestionClick = useCallback((questionKey: string) => {
    const element = componentRefs.current[questionKey];
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  // Handle visibility toggle from structure
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
              ? shouldShowConditionedQuestion(question.parentcontent.qId)
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
                    id={question._id}
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
