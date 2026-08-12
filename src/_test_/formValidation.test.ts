//checkUnsavedQuestions

import { ContentType, QuestionType } from "../types/Form.types";
import { checkUnsavedQuestions } from "../utils/formValidation";

describe("checkUnsavedQuestion Test", () => {
  const questions: ContentType[] = [];

  beforeEach(() => {
    questions.push({
      _id: "uniqueId#1",
      qIdx: 1,
      formId: "formId#1",
      type: QuestionType.Selection,
      selection: [
        {
          idx: 0,
          content: "opt#1",
        },
        { idx: 1, content: "opt#2" },
      ],
    });
  });

  test("return true if there a no _id question", () => {
    const currentQuestion: ContentType[] = [
      {
        ...questions[0],
        _id: undefined,
      },
    ];

    const isChange = checkUnsavedQuestions(currentQuestion, []);

    expect(isChange).toBe(true);
  });
  test("return true after correctly validate current and prev question", () => {
    //Questions with nested question
    const prevQuestion: Array<ContentType> = [
      {
        ...questions[0],
        _id: "qId#1",
        selection: [{ idx: 0, content: "opt#1" }],
      },
      {
        ...questions[0],
        _id: "qId#2",
        qIdx: 2,

        type: QuestionType.RangeDate,
        rangedate: {
          start: "01-01-2027",
          end: "01-01-2028",
        },
      },
      {
        ...questions[0],
        _id: "qId#3",
        qIdx: 3,
        type: QuestionType.CheckBox,
        checkbox: [
          {
            idx: 0,
            content: "check#1",
          },
          {
            idx: 1,
            content: "check#2",
          },
        ],
      },
      //condition question
      {
        ...questions[0],
        _id: "qId#4",
        qIdx: 4,
        conditional: [{ contentId: "qId#5", contentIdx: 5 }],
        type: QuestionType.MultipleChoice,
        multiple: [{ idx: 0, content: "opt#1" }],
      },

      {
        ...questions[0],
        _id: "qId#5",
        type: QuestionType.MultipleSelection,
        qIdx: 5,
        parentcontent: { qId: "qId#4", optIdx: 0 },
        conditional: [{ contentId: "qId#6", contentIdx: 6 }],
        selection: [
          {
            content: "select#1",
            idx: 0,
          },
          {
            content: "select#2",
            idx: 1,
          },
          {
            content: "select#3",
            idx: 2,
          },
        ],
      },
      {
        ...questions[0],
        _id: "qId#6",
        qIdx: 6,
        parentcontent: { qId: "qId#5", optIdx: 0 },
        type: QuestionType.MultipleChoice,
        multiple: [{ idx: 0, content: "opt#1" }],
      },
    ];

    //Changed question
    const currentQuestion = prevQuestion.map((i) =>
      i._id === "qId#5"
        ? {
            ...i,
            selection: i.selection?.map((select) =>
              select.idx === 1 ? { idx: 1, content: "changed#1" } : select,
            ),
          }
        : i,
    );

    const isQuestionChange = checkUnsavedQuestions(
      currentQuestion,
      prevQuestion,
    );

    expect(isQuestionChange).toBe(true);
  });
});
