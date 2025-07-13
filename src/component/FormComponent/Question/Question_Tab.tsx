import { useCallback, useMemo, useRef } from "react";
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
  setreloaddata,
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

const QuestionTab = () => {
  const componentRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const { setParams } = useSetSearchParam();

  // Memoize selectors to prevent unnecessary re-renders
  const formState = useSelector((root: RootState) => root.allform.formstate);
  const page = useSelector((root: RootState) => root.allform.page);
  const fetchLoading = useSelector(
    (root: RootState) => root.allform.fetchloading
  );
  const allQuestion = useSelector(
    (root: RootState) => root.allform.allquestion
  );

  const dispatch = useDispatch();

  // Memoize filtered questions to avoid recalculating on every render
  const filteredQuestions = useMemo(
    () => allQuestion.filter((i) => i.page === page),
    [allQuestion, page]
  );

  const handleAddQuestion = useCallback(async () => {
    const updatedQuestions = [
      ...allQuestion,
      {
        ...DefaultContentType,
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

      const deleteRequest = async () => {
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
      if (!toUpdateQuestion) return;

      let newContentId: number | string =
        toUpdateQuestion._id ?? questionIdx + 1;

      if (formState.setting?.autosave) {
        const request = await PromiseToast(
          {
            promise: ApiRequest({
              url: "/handlecondition",
              method: "POST",
              cookie: true,
              refreshtoken: true,
              data: {
                content: { id: toUpdateQuestion._id },
                key: anskey,
                newContent: { ...DefaultContentType, page },
                formId: formState._id,
              },
            }),
          },
          { pending: "Adding", success: "Condition Added", error: "Can't Add" }
        );

        if (!request.success || request.data) return;
        newContentId = request.data as string;
      }

      dispatch(
        setallquestion((prev) => {
          const newConditional = {
            ...(typeof newContentId === "string"
              ? { contentId: newContentId }
              : { contentIdx: newContentId }),
            key: anskey,
          };

          const updatedQuestion = {
            ...toUpdateQuestion,
            conditional: [
              ...(toUpdateQuestion.conditional?.map((prevCond) => ({
                ...prevCond,
                contentIdx:
                  prevCond.contentIdx !== undefined && prevCond.contentIdx + 1,
              })) ?? []),
              newConditional,
            ],
          };

          const newContent = {
            ...DefaultContentType,
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
            idx === questionIdx ? updatedQuestion : item
          ) as Array<ContentType>;

          return finalList;
        })
      );
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
    console.log({ key });
    const element = componentRefs.current[key];
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const handlePage = useCallback(
    async (type: "add" | "delete", deletepage?: number) => {
      if (type === "add") {
        if (
          allQuestion.some(
            (question) => question.page === page && !question._id
          )
        ) {
          dispatch(
            setopenmodal({
              state: "confirm",
              value: {
                open: true,
                data: {
                  question: "Please save question",
                },
              },
            })
          );
          return;
        }
      }

      let updatedPage = 0;
      const updateSearchParam = (newPage: number) => {
        dispatch(setpage(newPage));
        dispatch(setformstate({ ...formState, totalpage: newPage }));
        setParams({ page: newPage.toString() });
      };

      if (type === "add") {
        updatedPage = formState.totalpage + 1;
        updateSearchParam(updatedPage);
      } else {
        updatedPage = formState.totalpage;
        updateSearchParam(updatedPage <= 1 ? 1 : updatedPage - 1);
      }

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
        { pending: "Adding Page", success: "Added" }
      )) as ApiRequestReturnType;

      if (!request.success) {
        ErrorToast({ title: "Failed", content: "Can't Save" });
        return;
      }
      if (type === "delete") dispatch(setreloaddata(true));
      dispatch(setpage(updatedPage));
    },
    [allQuestion, page, formState, setParams, dispatch]
  );

  // Memoize the question color
  const questionColor = useMemo(
    () => formState.setting?.qcolor as string,
    [formState.setting?.qcolor]
  );

  return (
    <div className="w-full h-fit flex flex-col items-center gap-y-20">
      {fetchLoading ? (
        <QuestionLoading count={3} />
      ) : (
        filteredQuestions.map((question, idx) => {
          const questionKey = `${question.type}${question._id ?? idx}`;
          return (
            <div
              className="w-[80%] h-fit"
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
          );
        })
      )}
      <Button
        startContent={<PlusIcon width={"25px"} height={"25px"} />}
        className="w-[90%] h-[40px] bg-success dark:bg-lightsucess font-bold text-white dark:text-black"
        onPress={handleAddQuestion}
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
            <Image
              src={MinusIcon}
              alt="minus"
              width={20}
              height={20}
              loading="lazy"
            />
          }
        >
          Delete Page
        </Button>
        <Button
          className="max-w-xs font-bold text-black border-x-0 border-t-0 transition-transform hover:translate-x-1"
          radius="none"
          color="primary"
          variant="bordered"
          onPress={() => handlePage("add")}
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
  );
};

export default QuestionTab;
