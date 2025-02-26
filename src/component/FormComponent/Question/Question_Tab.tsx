import { useRef } from "react";
import { RootState } from "../../../redux/store";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router";
import {
  CheckboxQuestionType,
  ContentType,
  DefaultContentType,
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
import { Button, Image, Pagination, Skeleton } from "@nextui-org/react";
import { PlusIcon } from "../../svg/GeneralIcon";
import { setopenmodal } from "../../../redux/openmodal";
import MinusIcon from "../../../assets/minus.png";
import PlusImg from "../../../assets/add.png";

const QuestionTab = () => {
  //scroll ref
  const componentRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const { formstate, page, fetchloading } = useSelector(
    (root: RootState) => root.allform
  );
  const [searchParam, setsearchParam] = useSearchParams();

  const dispatch = useDispatch();
  const allquestion = useSelector(
    (root: RootState) => root.allform.allquestion
  );

  const handleAddQuestion = async () => {
    const updatedQuestions = [
      ...allquestion,
      {
        ...DefaultContentType,
        idx: allquestion.length > 0 ? allquestion.length - 1 : 0,
        page,
      },
    ];
    if (formstate.setting?.autosave) {
      const createReq = AutoSaveQuestion({
        data: updatedQuestions,
        formId: formstate._id ?? "",
        type: "save",
        page,
      });
      const process = await PromiseToast(
        { promise: createReq },
        { pending: "Creating", error: "Can't Create" }
      );
      if (!process.success || !process.data || !process.data.insertedId) return;
      dispatch(
        setallquestion((prev) => [
          ...prev,
          {
            ...DefaultContentType,
            idx: prev.length,
            _id: process.data?.insertedId[0],
            page,
          },
        ])
      );
    } else dispatch(setallquestion(updatedQuestions));
  };

  const handleDeleteQuestion = async (qidx: number) => {
    const questionToDelete = allquestion[qidx];

    const deleteRequest = async () => {
      if (formstate.setting?.autosave && questionToDelete._id) {
        const request = await PromiseToast(
          {
            promise: ApiRequest({
              url: "/deletecontent",
              method: "DELETE",
              cookie: true,
              refreshtoken: true,
              data: { id: questionToDelete._id, formId: formstate._id },
            }),
          },
          { pending: "Deleting Question", error: "Can't Delete" }
        );

        if (!request.success) return;
      }

      // Update the allquestion state
      dispatch(
        setallquestion((prev) => {
          return prev
            .filter((_, idx) => idx !== qidx) // Remove the question at qidx
            .map((question, newIdx) => {
              // Update conditionals: remove references to qidx and adjust higher indices
              const updatedConditional = question.conditional
                ?.filter((cond) => cond.contentId !== qidx)
                .map((cond) =>
                  cond.contentId && cond.contentId > qidx
                    ? { ...cond, contentId: cond.contentId - 1 }
                    : cond
                );

              return {
                ...question,
                idx: newIdx, // Reassign idx based on new position
                conditional: updatedConditional,
              };
            });
        })
      );
    };

    // Prompt confirmation if the question has conditionals, otherwise delete immediately
    if (
      questionToDelete.conditional &&
      questionToDelete.conditional.length > 0
    ) {
      dispatch(
        setopenmodal({
          state: "confirm",
          value: { open: true, data: { onAgree: deleteRequest } },
        })
      );
    } else {
      await deleteRequest();
    }
  };

  const handleAddCondition = async (
    questionIdx: number,
    anskey: number
  ): Promise<void> => {
    const toUpdateQuestion = allquestion[questionIdx];
    if (!toUpdateQuestion) return;

    // Calculate new content ID as the next available index

    const newContentId = questionIdx + 1;

    // Handle autosave API call if enabled
    if (formstate.setting?.autosave) {
      const request = await PromiseToast(
        {
          promise: ApiRequest({
            url: "/handlecondition",
            method: "POST",
            cookie: true,
            refreshtoken: true,
            data: {
              contentId: toUpdateQuestion._id,
              key: anskey,
              newContent: { ...DefaultContentType, idx: newContentId, page },
              formId: formstate._id,
            },
          }),
        },
        { pending: "Adding", success: "Condition Added", error: "Can't Add" }
      );

      if (!request.success) return;
    }

    // Update state with new conditions
    dispatch(
      setallquestion((prev) => {
        // Create the new conditional
        const newConditional = { contentId: newContentId, key: anskey };

        // Update the question at questionIdx by adding the new conditional
        const updatedQuestion = {
          ...prev[questionIdx],
          conditional: [
            newConditional,
            ...(prev[questionIdx].conditional?.map((cond) => ({
              ...cond,
              contentId: cond.contentId ? cond.contentId + 1 : undefined,
            })) ?? []),
          ],
        };

        // Create the new content to insert after the updated question
        const newContent = {
          ...DefaultContentType,
          page,
          idx: newContentId,
        };

        // Insert the new content right after the updated question
        const updatedList = [
          ...prev.slice(0, questionIdx + 1),
          newContent,
          ...prev.slice(questionIdx + 1),
        ];

        // Adjust idx for all items to match their new positions
        const finalList = updatedList.map((item, idx) =>
          idx === questionIdx
            ? updatedQuestion
            : {
                ...item,
                idx: idx,
              }
        );

        return finalList;
      })
    );
  };

  const removeConditionedQuestion = async (
    ansidx: number,
    qidx: number,
    ty: "unlink" | "delete"
  ): Promise<void> => {
    // Find the question to update
    const questionToUpdate = allquestion[qidx];
    if (!questionToUpdate) return;

    // Determine the contentId to remove based on the answer index
    const toRemoveContentId = questionToUpdate.conditional?.find(
      (con) => con.key === ansidx
    )?.contentId;

    // Update the question at qidx
    const updatedQuestion = {
      ...questionToUpdate,
      conditional: questionToUpdate.conditional
        ?.filter((con) => con.contentId !== toRemoveContentId)
        .map((cond) => {
          return {
            ...cond,
            contentId:
              cond.contentId && toRemoveContentId
                ? cond.contentId > toRemoveContentId
                  ? cond.contentId - 1
                  : cond.contentId
                : undefined,
          };
        }),
    } as ContentType<Array<CheckboxQuestionType>>;

    if (
      ty === "delete" &&
      Array.isArray(updatedQuestion[updatedQuestion.type as never])
    ) {
      updatedQuestion[updatedQuestion.type] = (
        updatedQuestion[updatedQuestion.type] as Array<CheckboxQuestionType>
      ).filter((i) => i.idx !== ansidx) as never;
    }

    // Remove the conditioned question if it exists and reassign indices
    const updatedAllQuestion = allquestion
      .filter((q) => q._id !== toRemoveContentId && q.idx !== toRemoveContentId)
      .map((q, idx) => ({ ...q, idx })); // Reassign idx based on new positions

    // Replace the question at qidx with the updated version
    const finalQuestionList = updatedAllQuestion.map((q) =>
      q.idx === qidx ? updatedQuestion : q
    );

    // Handle autosave if enabled
    if (formstate.setting?.autosave && formstate._id) {
      const isSaved = await PromiseToast({
        promise: AutoSaveQuestion({
          data: finalQuestionList,
          formId: formstate._id,
          type: "save",
          page,
        }),
      });

      if (!isSaved) {
        ErrorToast({ title: "Failed", content: "Error occurred" });
        return;
      }
    }

    // Update the state
    dispatch(setallquestion(finalQuestionList));
  };

  const handleDuplication = async (idx: number) => {
    ///make a copy of the question base on idx
    const updatequestions = [
      ...allquestion.slice(0, idx + 1),
      { ...allquestion[idx], _id: undefined },
      ...allquestion.slice(idx + 1).map((i) => ({ ...i, idx: i.idx + 1 })),
    ];

    if (formstate.setting?.autosave && formstate._id) {
      const isSaved = await PromiseToast(
        {
          promise: AutoSaveQuestion({
            data: updatequestions,
            formId: formstate._id,
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
  };

  const checkIsLinkedForQuestionOption = (ansidx: number, qidx: number) =>
    allquestion[qidx] && allquestion[qidx].conditional
      ? allquestion[qidx].conditional.some((con) => con.key === ansidx)
      : false;
  const checkConditionedContent = (id: string | number) => {
    const qIdx = allquestion.findIndex(
      (i) => i.conditional && i.conditional.some((con) => con.contentId === id)
    );
    const key = `${allquestion[qIdx]?.type}${qIdx}`;
    const ansIdx =
      allquestion[qIdx]?.conditional?.find((con) => con.contentId === id)
        ?.key ?? 0;
    return { key, qIdx, ansIdx };
  };

  const scrollToDiv = (key: string) => {
    const element = componentRefs.current[key];

    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handlePage = async (type: "add" | "delete", deletepage?: number) => {
    let updatedPage = 0;
    const updateSearchParam = (newPage: number) => {
      dispatch(setpage(newPage));
      dispatch(setformstate({ ...formstate, totalpage: newPage }));
      setsearchParam((prev) => ({ ...prev, page: newPage }));
    };

    if (type === "add") {
      //Add new page
      updatedPage = formstate.totalpage + 1;
      updateSearchParam(updatedPage);
    } else {
      updatedPage = formstate.totalpage;

      updateSearchParam(updatedPage <= 1 ? 1 : updatedPage - 1);
    }
    //Save Page

    const request = (await PromiseToast(
      {
        promise: ApiRequest({
          url: "/modifypage",
          method: "PUT",
          cookie: true,
          refreshtoken: true,
          data: {
            formId: formstate._id,
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
  };

  return (
    <div
      style={{ color: formstate.setting?.text }}
      className="w-full h-fit flex flex-col items-center gap-y-20"
    >
      {fetchloading ? (
        <Skeleton className="w-[80%] h-[300px] rounded-md" />
      ) : (
        allquestion
          .filter((i) => i.page === page)
          .map((question) => (
            <div
              className="w-[80%] h-fit"
              key={`${question.type}${question.idx}`}
              ref={(el) =>
                (componentRefs.current[`${question.type}${question.idx}`] = el)
              }
            >
              <QuestionComponent
                idx={question.idx}
                id={question._id}
                isLinked={(ansidx) =>
                  checkIsLinkedForQuestionOption(ansidx, question.idx)
                }
                value={question}
                color={formstate.setting?.qcolor as string}
                onDelete={() => {
                  handleDeleteQuestion(question.idx);
                }}
                onAddCondition={(answeridx) =>
                  handleAddCondition(question.idx, answeridx)
                }
                removeCondition={(answeridx, ty) => {
                  removeConditionedQuestion(answeridx, question.idx, ty);
                }}
                onDuplication={() => handleDuplication(question.idx)}
                scrollToCondition={(val) => {
                  scrollToDiv(val);
                }}
                isConditioned={() => checkConditionedContent(question.idx)}
              />
            </div>
          ))
      )}
      <Button
        startContent={<PlusIcon width={"25px"} height={"25px"} />}
        className="w-[90%] h-[40px] bg-success dark:bg-lightsucess font-bold text-white dark:text-black"
        onPress={() => {
          handleAddQuestion();
        }}
      >
        New Question
      </Button>
      {formstate.totalpage > 1 ? (
        <Pagination
          loop
          showControls
          color="primary"
          initialPage={1}
          total={formstate.totalpage ?? 0}
          page={page}
          onChange={(val) => {
            setsearchParam({ ...searchParam, page: val.toString() });
            dispatch(setpage(val) as never);
            dispatch(setreloaddata(true));
          }}
        />
      ) : (
        ""
      )}
      <div className="page-btn w-full h-fit flex flex-row items-center justify-between">
        <Button
          className="max-w-xs font-bold text-red-400 border-x-0 border-t-0 transition-transform hover:translate-x-1"
          radius="none"
          style={
            formstate.totalpage === 1 || page === 1 ? { display: "none" } : {}
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
                    onAgree: () => {
                      handlePage("delete", page);
                    },
                  },
                },
              })
            );
          }}
          startContent={
            <Image
              src={MinusIcon}
              alt="plus"
              width={20}
              height={20}
              loading="lazy"
            />
          }
        >
          Delete Page
        </Button>
        <Button
          className="max-w-xs font-bold text-black border-x-0  border-t-0 transition-transform hover:translate-x-1"
          radius="none"
          color="primary"
          variant="bordered"
          onPress={() => {
            handlePage("add");
          }}
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

      <Button color="danger" onPress={() => console.log({ allquestion })}>
        Test State
      </Button>
    </div>
  );
};

export default QuestionTab;
