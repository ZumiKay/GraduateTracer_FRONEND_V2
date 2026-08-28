import { ConditionContentCopy } from "../helperFunc";
import { ContentType, QuestionType } from "../types/Form.types";

const mockAllContent: Array<ContentType> = [
  {
    _id: "question1",
    qIdx: 1,
    type: QuestionType.CheckBox,
    formId: "formId",
    checkbox: [
      { idx: 0, content: "0" },
      { idx: 1, content: "1" },
    ],
    conditional: [
      {
        contentIdx: 1,
        key: 1,
      },
      { contentIdx: 2, key: 0 },
    ],
  },
  {
    _id: "c1",
    qIdx: 2,
    type: QuestionType.CheckBox,
    formId: "formId",
    checkbox: [
      { idx: 0, content: "0" },
      { idx: 1, content: "1" },
    ],
    parentcontent: {
      qIdx: 0,
      optIdx: 1,
    },
  },
  {
    _id: "c2",
    qIdx: 3,
    type: QuestionType.Number,
    formId: "formId",
    parentcontent: {
      qIdx: 0,
      optIdx: 0,
    },
  },
  {
    _id: "question1",
    qIdx: 4,
    type: QuestionType.CheckBox,
    formId: "formId",
    checkbox: [
      { idx: 0, content: "0" },
      { idx: 1, content: "1" },
    ],
  },
  {
    _id: "question2",
    qIdx: 5,
    type: QuestionType.RangeNumber,
    formId: "formId",
    rangenumber: {
      start: 5,
      end: 10,
    },
  },
  {
    _id: "question3",
    qIdx: 6,
    type: QuestionType.Text,
    formId: "formId",
  },
];

// Mock data for 5-level nested conditional questions
const mockFiveNestedContent: Array<ContentType> = [
  // Level 0: Root question with conditional
  {
    _id: "root_question",
    qIdx: 1,
    type: QuestionType.MultipleChoice,
    formId: "formId",
    multiple: [
      { idx: 0, content: "Option A" },
      { idx: 1, content: "Option B" },
    ],
    conditional: [
      {
        contentIdx: 1,
        key: 0,
      },
    ],
  },
  // Level 1: First nested question
  {
    _id: "level1_question",
    qIdx: 2,
    type: QuestionType.CheckBox,
    formId: "formId",
    checkbox: [
      { idx: 0, content: "Level 1 Option A" },
      { idx: 1, content: "Level 1 Option B" },
    ],
    parentcontent: {
      qIdx: 0,
      optIdx: 0,
    },
    conditional: [
      {
        contentIdx: 2, // Points to level 2 question
        key: 1,
      },
    ],
  },
  // Level 2: Second nested question
  {
    _id: "level2_question",
    qIdx: 3,
    type: QuestionType.Selection,
    formId: "formId",
    selection: [
      { idx: 0, content: "Level 2 Option A" },
      { idx: 1, content: "Level 2 Option B" },
      { idx: 2, content: "Level 2 Option C" },
    ],
    parentcontent: {
      qIdx: 1,
      optIdx: 1,
    },
    conditional: [
      {
        contentIdx: 3, // Points to level 3 question
        key: 2,
      },
    ],
  },
  // Level 3: Third nested question
  {
    _id: "level3_question",
    qIdx: 4,
    type: QuestionType.Number,
    formId: "formId",
    parentcontent: {
      qIdx: 2,
      optIdx: 2,
    },
    conditional: [
      {
        contentIdx: 4, // Points to level 4 question
        key: 0, // For number questions, this might represent a value threshold
      },
    ],
  },
  // Level 4: Fourth nested question
  {
    _id: "level4_question",
    qIdx: 5,
    type: QuestionType.Text,
    formId: "formId",
    parentcontent: {
      qIdx: 3,
      optIdx: 0,
    },
    conditional: [
      {
        contentIdx: 5, // Points to level 5 question
        key: 0,
      },
    ],
  },
  // Level 5: Fifth and deepest nested question
  {
    _id: "level5_question",
    qIdx: 6,
    type: QuestionType.RangeNumber,
    formId: "formId",
    rangenumber: {
      start: 1,
      end: 10,
    },
    parentcontent: {
      qIdx: 4,
      optIdx: 0,
    },
  },
  // Additional questions for proper indexing
  {
    _id: "additional1",
    qIdx: 7,
    type: QuestionType.Date,
    formId: "formId",
  },
  {
    _id: "additional2",
    qIdx: 8,
    type: QuestionType.Paragraph,
    formId: "formId",
  },
];

describe("Duplicate Question", () => {
  const toBeCopyQuestion = { ...mockAllContent[0] };

  test("Question only one nested", () => {
    const result = ConditionContentCopy({
      org: toBeCopyQuestion,
      allquestion: mockAllContent,
    });

    const processedQIdx = result.map((i) => i.qIdx);

    expect(result.length).toBe(3);

    const expectedQIdx = [4, 5, 6];

    expect(processedQIdx).toStrictEqual(expectedQIdx);
  });

  test("Test Question with five nested", () => {
    const org = { ...mockFiveNestedContent[0] };

    const processDupilcate = ConditionContentCopy({
      org,
      allquestion: mockFiveNestedContent,
    });

    expect(processDupilcate.length).not.toEqual(0);

    const proceedQIdx = processDupilcate.map((i) => i.qIdx);

    expect(proceedQIdx).toStrictEqual([7, 8, 9, 10, 11, 12]);

    const expectContent = [7, 8, 9, 10, 11];

    const processedContentIdx = processDupilcate
      .map((i) => i.conditional && i.conditional[0].contentIdx)
      .filter(Boolean);

    expect(processedContentIdx).toStrictEqual(expectContent);
  });
});
