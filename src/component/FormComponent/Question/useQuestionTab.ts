import { useCallback, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../redux/store";
import {
  ChoiceQuestionType,
  ContentType,
  DefaultContentType,
  QuestionType,
} from "../../../types/Form.types";
import { ErrorToast } from "../../Modal/AlertModal";
import {
  setallquestion,
  setformstate,
  setpage,
  setpauseAutoSave,
  setprevallquestion,
  setreloaddata,
} from "../../../redux/formstore";
import ApiRequest from "../../../hooks/APIHook/ApiHook";
import { setopenmodal } from "../../../redux/openmodal";
import { checkUnsavedQuestions } from "../../../utils/formValidation";
import { ConditionContentCopy } from "../../../helperFunc";
import { DeleteAndShift } from "./Question_Tab_Helper";
import { AddQuestionNumbering } from "../../../services/labelQuestionNumberingService";
import { isConditonExist } from "../../../utils/questionMutataions";
import useImprovedAutoSave from "../../../hooks/useImprovedAutoSave";
import { useSetSearchParam } from "../../../hooks/CustomHook";
import { validateQuestionStructure } from "./utils";
import { emitAutoSaveEvent } from "../../../services/autoSaveEventBus";

/**Question Tab state management hook
 * @method with the highlight:
 * - handleAddQuestion
 * - handleDeleteQuestion
 * - handleAddCondition
 * - removeConditionQuestion
 * - handlePage
 * - handleDeletePage
 * - handlePageInternal
 * - handleDuplication
 * - scrollToDiv
 */

export const useQuestionTab = () => {
  const componentRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const { setParams } = useSetSearchParam();
  const [showStructure, setShowStructure] = useState(true);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [questionLoading, setQuestionLoading] = useState(false);

  const dispatch = useDispatch();
  const formState = useSelector((root: RootState) => root.allform.formstate);
  const page = useSelector((root: RootState) => root.allform.page);
  const fetchLoading = useSelector(
    (root: RootState) => root.allform.fetchloading,
  );
  const allQuestion = useSelector(
    (root: RootState) => root.allform.allquestion,
  );
  const prevAllQuestion = useSelector(
    (root: RootState) => root.allform.prevAllQuestion,
  );
  const { manualSave } = useImprovedAutoSave();

  const hasUnsavedQuestions = useMemo(
    () => checkUnsavedQuestions(allQuestion, prevAllQuestion, page),
    [allQuestion, prevAllQuestion, page],
  );

  const questionColor = useMemo(
    () => formState.setting?.qcolor as string,
    [formState.setting?.qcolor],
  );

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
              btn: { agree: "Proceed", disagree: "No" },
            },
          },
        }),
      );
    },
    [dispatch],
  );

  const handleAddQuestion = useCallback(async () => {
    const qIdx = (formState?.lastQuestionIdx ?? 0) + (allQuestion.length + 1);
    const updatedQuestions: Array<ContentType> = AddQuestionNumbering({
      questions: [
        ...(allQuestion ?? []),
        { ...DefaultContentType, qIdx, page },
      ],
      lastIdx: formState.lastQuestionIdx,
    });

    if (formState.setting?.autosave) {
      setQuestionLoading(true);
      const process = await manualSave({ customQuestions: updatedQuestions });
      setQuestionLoading(false);
      if (!process) {
        ErrorToast({
          toastid: "Question Creation",
          title: "Error",
          content: "Can't create a question",
        });
      }
    }
    dispatch(setallquestion(updatedQuestions));
  }, [
    formState.lastQuestionIdx,
    formState.setting?.autosave,
    allQuestion,
    page,
    manualSave,
    dispatch,
  ]);

  const handleDeleteQuestion = useCallback(
    async (qidx: number) => {
      const questionToDelete = allQuestion[qidx];
      if (!questionToDelete || !formState._id) return;

      const hasConditionals =
        questionToDelete.conditional &&
        questionToDelete.conditional.length > 0 &&
        isConditonExist({
          conditions: questionToDelete.conditional,
          allquestion: allQuestion,
        });

      if (hasConditionals && questionToDelete._id) {
        dispatch(
          setopenmodal({
            state: "confirm",
            value: {
              open: true,
              data: {
                question: "All related conditioned question will be delete!",
                onAgree: async () => {
                  const updatedQuestions = DeleteAndShift({
                    allquestion: allQuestion,
                    targetQuestion: questionToDelete.qIdx,
                    targetQuestionIdx: qidx,
                    lastIdx: formState.lastQuestionIdx,
                  });
                  if (formState.setting?.autosave) {
                    const isSave = await manualSave({
                      customQuestions: updatedQuestions,
                    });
                    if (!isSave) {
                      ErrorToast({
                        toastid: "Delete question",
                        title: "Error",
                        content: "Can't Delete Question",
                      });
                      return;
                    }
                  } else {
                    dispatch(setallquestion(updatedQuestions));
                  }
                },
              },
            },
          }),
        );
        return;
      }

      const updatedQuestions = DeleteAndShift({
        allquestion: allQuestion,
        targetQuestion: questionToDelete.qIdx,
        targetQuestionIdx: qidx,
        lastIdx: formState.lastQuestionIdx,
      });

      dispatch(setallquestion(updatedQuestions));

      if (formState.setting?.autosave) {
        emitAutoSaveEvent({ tab: "question" });
      }
    },
    [
      allQuestion,
      formState._id,
      formState.lastQuestionIdx,
      formState.setting?.autosave,
      dispatch,
      manualSave,
    ],
  );

  const handleAddCondition = useCallback(
    async (questionIdx: number, anskey: number): Promise<void> => {
      if (questionIdx < 0 || questionIdx >= allQuestion.length) {
        return;
      }

      const targetQuestion = allQuestion[questionIdx];
      if (!targetQuestion) {
        return;
      }

      let dataToBeSave: Array<ContentType> = [];

      try {
        dispatch(
          setallquestion((prevQuestions) => {
            const existingConditionals = targetQuestion.conditional || [];
            const nextAvailableIdx = targetQuestion.qIdx + 1;

            const newConditional = { contentIdx: questionIdx + 1, key: anskey };
            const newChildQuestion: ContentType = {
              ...DefaultContentType,
              qIdx: nextAvailableIdx,
              parentcontent: {
                optIdx: anskey,
                qIdx: targetQuestion.qIdx,
                qId: targetQuestion._id,
              },
              page,
              isVisible: true,
            };

            const result: ContentType[] = [];
            let insertionDone = false;

            for (let i = 0; i < prevQuestions.length; i++) {
              const currentQuestion = prevQuestions[i];
              if (i === questionIdx) {
                result.push({
                  ...currentQuestion,
                  conditional: [
                    ...existingConditionals.map((cond) => ({
                      ...cond,
                      contentIdx:
                        cond.contentIdx !== undefined &&
                        cond.contentIdx >= questionIdx + 1
                          ? cond.contentIdx + 1
                          : cond.contentIdx,
                    })),
                    newConditional,
                  ],
                });
                result.push(newChildQuestion);
                insertionDone = true;
              } else {
                const needsUpdate = currentQuestion.qIdx >= nextAvailableIdx;
                if (needsUpdate) {
                  result.push({
                    ...currentQuestion,
                    qIdx: currentQuestion.qIdx + 1,
                    conditional: currentQuestion.conditional?.map((cond) => ({
                      ...cond,
                      contentIdx:
                        cond.contentIdx !== undefined &&
                        cond.contentIdx >= nextAvailableIdx
                          ? cond.contentIdx + 1
                          : cond.contentIdx,
                    })),
                    parentcontent:
                      currentQuestion.parentcontent?.qIdx !== undefined
                        ? {
                            ...currentQuestion.parentcontent,
                            qIdx:
                              currentQuestion.parentcontent.qIdx >
                              targetQuestion.qIdx
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

            if (!insertionDone) result.push(newChildQuestion);

            dataToBeSave = AddQuestionNumbering({
              questions: result,
              lastIdx: formState.lastQuestionIdx,
            });
            return dataToBeSave;
          }),
        );

        if (formState.setting?.autosave && dataToBeSave) {
          //Autosave trigger
          emitAutoSaveEvent({
            tab: "question",
          });
        }
      } catch (error) {
        console.error("Error in handleAddCondition:", error);
        ErrorToast({
          title: "Failed to Add Condition",
          content: "An error occurred while adding the condition",
        });
      }
    },
    [
      allQuestion,
      dispatch,
      formState.setting?.autosave,
      formState.lastQuestionIdx,
      page,
    ],
  );

  const removeConditionedQuestion = useCallback(
    async (
      ansidx: number,
      qidx: number,
      ty: "unlink" | "delete",
    ): Promise<void> => {
      const questionToUpdate = allQuestion[qidx];
      if (!questionToUpdate) return;

      const questionConditionContent = questionToUpdate.conditional?.find(
        (con) => con.key === ansidx,
      );

      const updatedQuestion = {
        ...questionToUpdate,
        conditional: questionToUpdate.conditional
          ?.filter(
            (con) =>
              con.contentId !== questionConditionContent?.contentId ||
              con.contentIdx !== questionConditionContent?.contentIdx,
          )
          .map((cond) => {
            const updatedCond = {
              ...cond,
              contentIdx:
                cond.contentIdx !== undefined &&
                questionConditionContent?.contentIdx !== undefined &&
                cond.contentIdx > questionConditionContent.contentIdx
                  ? cond.contentIdx - 1
                  : cond.contentIdx,
            };
            if (
              ty === "delete" &&
              cond.key !== undefined &&
              cond.key > ansidx
            ) {
              updatedCond.key = cond.key - 1;
            }
            return updatedCond;
          }),
      } as ContentType<Array<ChoiceQuestionType>>;

      if (
        ty === "delete" &&
        Array.isArray(updatedQuestion[updatedQuestion.type as never])
      ) {
        updatedQuestion[updatedQuestion.type] = (
          updatedQuestion[updatedQuestion.type] as Array<ChoiceQuestionType>
        )
          .filter((i, idx) =>
            i.idx !== undefined ? i.idx !== ansidx : idx !== ansidx,
          )
          .map((option, newIdx) => ({ ...option, idx: newIdx })) as never;
      }

      const updatedAllQuestion = allQuestion.filter((q, idx) =>
        q._id
          ? q._id !== questionConditionContent?.contentId
          : idx !== questionConditionContent?.contentIdx,
      );

      const finalQuestionList = updatedAllQuestion.map((q, idx) => {
        if (q._id ? q._id === questionToUpdate._id : idx === qidx)
          return updatedQuestion;
        if (
          questionConditionContent?.contentIdx &&
          idx > questionConditionContent.contentIdx
        ) {
          return { ...q, qIdx: q.qIdx - 1 };
        }
        return q;
      });

      emitAutoSaveEvent({ tab: "question" });

      dispatch(setallquestion(finalQuestionList));
    },
    [allQuestion, dispatch],
  );

  const handleDuplication = useCallback(
    async (idx: number) => {
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
        let duplicatedContent: Array<ContentType>;

        if (
          questionToDuplicate.conditional &&
          questionToDuplicate.conditional.length > 0
        ) {
          const conditionalContent = ConditionContentCopy({
            org: questionToDuplicate,
            allquestion: allQuestion,
          });
          duplicatedContent =
            conditionalContent.length > 0
              ? conditionalContent
              : [
                  {
                    ...questionToDuplicate,
                    _id: undefined,
                    qIdx: questionToDuplicate.qIdx + 1,
                  },
                ];
        } else {
          duplicatedContent = [
            {
              ...questionToDuplicate,
              _id: undefined,
              qIdx: questionToDuplicate.qIdx + 1,
              parentcontent: questionToDuplicate.parentcontent
                ? { ...questionToDuplicate.parentcontent, qId: undefined }
                : undefined,
            },
          ];
        }

        const duplicatedCount = duplicatedContent.length;
        const shiftQuestion = (
          question: ContentType,
          offset: number,
        ): ContentType => ({
          ...question,
          qIdx: question.qIdx + offset,
          conditional: question.conditional?.map((cond, condIdx) => ({
            ...cond,
            contentIdx: condIdx + offset + 1,
          })),
        });

        const updatedQuestions: Array<ContentType> = [
          ...allQuestion.slice(0, idx + 1),
          ...duplicatedContent,
          ...allQuestion
            .slice(idx + 1)
            .map((q) => shiftQuestion(q, duplicatedCount)),
        ];

        const validation = validateQuestionStructure(updatedQuestions);
        if (!validation.isValid) {
          console.warn(
            "Question structure validation failed:",
            validation.errors,
          );
          ErrorToast({
            title: "Duplication Failed",
            content: "Invalid question structure detected",
          });
          return;
        }

        if (formState.setting?.autosave) {
          emitAutoSaveEvent({ tab: "question" });
        }

        dispatch(setallquestion(updatedQuestions));
      } catch (error) {
        console.error("Error during duplication:", error);
        ErrorToast({
          title: "Duplication Failed",
          content: "An error occurred while duplicating the question",
        });
      }
    },
    [allQuestion, dispatch, formState.setting?.autosave],
  );

  const scrollToDiv = useCallback(
    ({ questionIdx }: { questionIdx: number }) => {
      const targetQuestion = allQuestion[questionIdx];
      if (!targetQuestion) {
        ErrorToast({
          toastid: "Unique ScrollToDiv",
          title: "Error",
          content: "Can't Find Question",
        });
        return;
      }
      const key = `${targetQuestion.type}${targetQuestion._id ?? questionIdx}`;
      componentRefs.current[key]?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    },
    [allQuestion],
  );

  const handlePageInternal = useCallback(
    async (type: "add" | "delete", deletepage?: number) => {
      let newTotalPages = formState.totalpage;
      let updatedPage: number;

      if (type === "add") {
        newTotalPages = formState.totalpage + 1;
        updatedPage = newTotalPages;
      } else {
        newTotalPages = Math.max(1, formState.totalpage - 1);
        updatedPage =
          deletepage && deletepage <= page
            ? Math.max(1, page - 1)
            : page > newTotalPages
              ? newTotalPages
              : page;
      }

      //Pause AutoSave to prevent conflict
      dispatch(setpauseAutoSave(true));

      try {
        setIsPageLoading(true);
        const request = await ApiRequest({
          url: "/modifypage",
          method: "PUT",
          cookie: true,
          data: { formId: formState._id, ty: type, deletepage },
        });
        dispatch(setpauseAutoSave(false));

        if (!request.success) {
          ErrorToast({
            title: "Failed",
            content: request.error ?? "Error Occured",
          });
          return;
        }

        //Instantly delete questions along side the deleted page
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
        dispatch(setpage(updatedPage));
        setParams({ page: updatedPage.toString() });

        if (type === "delete") dispatch(setreloaddata(true));
      } finally {
        setIsPageLoading(false);
      }
    },
    [formState, setParams, dispatch, allQuestion, page],
  );

  const handlePage = useCallback(
    async (type: "add" | "delete", deletepage?: number) => {
      if (!formState.setting?.autosave && hasUnsavedQuestions) {
        showSaveConfirmation(() => handlePageInternal(type, deletepage));
        return;
      }
      handlePageInternal(type, deletepage);
    },
    [
      formState.setting?.autosave,
      handlePageInternal,
      hasUnsavedQuestions,
      showSaveConfirmation,
    ],
  );

  const handleDeletePage = useCallback(() => {
    dispatch(
      setopenmodal({
        state: "confirm",
        value: {
          open: true,
          data: { onAgree: () => handlePageInternal("delete", page) },
        },
      }),
    );
  }, [dispatch, handlePageInternal, page]);

  const handleQuestionClick = useCallback(
    ({
      type,
      questionId,
    }: {
      type: QuestionType;
      questionId: string | number;
    }) => {
      componentRefs.current[`${type}${questionId}`]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    },
    [],
  );

  const handleToggleVisibility = useCallback(
    (questionId: string | number) => {
      const existingIndex = allQuestion.findIndex(
        (item, idx) => item._id === questionId || idx === questionId,
      );

      if (existingIndex === -1) {
        ErrorToast({
          toastid: "NoQuestion",
          title: "Error",
          content: "Unexpected Error",
        });
        return;
      }

      const rootQuestion = allQuestion[existingIndex];
      const childIds = new Set(
        rootQuestion.conditional?.map((i) => i.contentId || i.contentIdx),
      );

      dispatch(
        setallquestion(
          allQuestion.map((q, idx) => {
            if (idx === existingIndex)
              return { ...q, isChildVisibility: !q.isChildVisibility };
            if (childIds.has(q._id ?? idx))
              return { ...q, isVisible: !q.isVisible };
            return q;
          }),
        ),
      );
    },
    [allQuestion, dispatch],
  );

  return {
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
  };
};
