import { validateQuestionStructure } from "../component/FormComponent/Question/utils";
import { ContentType, QuestionType, DefaultContentType } from "../types/Form.types";
import { AddQuestionNumbering } from "../services/labelQuestionNumberingService";

describe("validateQuestionStructure & Condition Question qIdx tests", () => {
  test("valid structure passes without errors", () => {
    const questions: ContentType[] = [
      {
        ...DefaultContentType,
        _id: "q1" as never,
        qIdx: 1,
        type: QuestionType.MultipleChoice,
        multiple: [
          { idx: 0, content: "Option 1" },
          { idx: 1, content: "Option 2" },
        ],
        conditional: [{ contentIdx: 2, key: 0 }],
      },
      {
        ...DefaultContentType,
        _id: "q2" as never,
        qIdx: 2,
        type: QuestionType.Text,
        parentcontent: { qIdx: 1, optIdx: 0, qId: "q1" },
      },
    ];

    const result = validateQuestionStructure(questions);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test("detects missing qIdx (undefined or NaN)", () => {
    const questions: ContentType[] = [
      {
        ...DefaultContentType,
        qIdx: undefined as never,
        type: QuestionType.MultipleChoice,
      },
      {
        ...DefaultContentType,
        qIdx: NaN,
        type: QuestionType.Text,
      },
    ];

    const result = validateQuestionStructure(questions);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Missing qIdx found at position 0");
    expect(result.errors).toContain("Missing qIdx found at position 1");
  });

  test("detects duplicate qIdx", () => {
    const questions: ContentType[] = [
      {
        ...DefaultContentType,
        qIdx: 1,
        type: QuestionType.Text,
      },
      {
        ...DefaultContentType,
        qIdx: 1,
        type: QuestionType.Text,
      },
    ];

    const result = validateQuestionStructure(questions);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Duplicate qIdx 1 found at position 1");
  });

  test("resolves conditional contentIdx whether referencing qIdx or array index", () => {
    // Array index 0 has qIdx 10; array index 1 has qIdx 20
    const questionsWithQIdxRef: ContentType[] = [
      {
        ...DefaultContentType,
        qIdx: 10,
        type: QuestionType.MultipleChoice,
        conditional: [{ contentIdx: 20, key: 0 }], // references qIdx 20
      },
      {
        ...DefaultContentType,
        qIdx: 20,
        type: QuestionType.Text,
        parentcontent: { qIdx: 10, optIdx: 0 }, // references qIdx 10
      },
    ];

    const result1 = validateQuestionStructure(questionsWithQIdxRef);
    expect(result1.isValid).toBe(true);

    const questionsWithArrayIdxRef: ContentType[] = [
      {
        ...DefaultContentType,
        qIdx: 10,
        type: QuestionType.MultipleChoice,
        conditional: [{ contentIdx: 1, key: 0 }], // references array index 1
      },
      {
        ...DefaultContentType,
        qIdx: 20,
        type: QuestionType.Text,
        parentcontent: { qIdx: 0, optIdx: 0 }, // references array index 0
      },
    ];

    const result2 = validateQuestionStructure(questionsWithArrayIdxRef);
    expect(result2.isValid).toBe(true);
  });

  test("detects non-existent qIdx or array index in conditional", () => {
    const questions: ContentType[] = [
      {
        ...DefaultContentType,
        qIdx: 1,
        type: QuestionType.MultipleChoice,
        conditional: [{ contentIdx: 99, key: 0 }],
      },
    ];

    const result = validateQuestionStructure(questions);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain(
      "Conditional 0 references non-existent qIdx 99",
    );
  });

  test("detects non-existent qIdx or array index in parentcontent", () => {
    const questions: ContentType[] = [
      {
        ...DefaultContentType,
        qIdx: 1,
        type: QuestionType.Text,
        parentcontent: { qIdx: 99, optIdx: 0 },
      },
    ];

    const result = validateQuestionStructure(questions);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain(
      "Parent content references non-existent qIdx 99",
    );
  });

  test("adding condition question to question without qIdx does not produce missing qIdx error", () => {
    // Initial state: parent question has undefined qIdx
    const initialParent: ContentType = {
      ...DefaultContentType,
      qIdx: undefined as never,
      type: QuestionType.MultipleChoice,
      multiple: [{ idx: 0, content: "Option A" }],
    };

    const prevQuestions: ContentType[] = [initialParent];

    // Simulate handleAddCondition logic
    const questionIdx = 0;
    const anskey = 0;
    const currentTarget = prevQuestions[questionIdx];
    const targetQIdx =
      typeof currentTarget.qIdx === "number" && !isNaN(currentTarget.qIdx)
        ? currentTarget.qIdx
        : questionIdx + 1;
    const nextAvailableIdx = targetQIdx + 1;

    const newConditional = { contentIdx: nextAvailableIdx, key: anskey };
    const newChildQuestion: ContentType = {
      ...DefaultContentType,
      qIdx: nextAvailableIdx,
      parentcontent: {
        optIdx: anskey,
        qIdx: targetQIdx,
        qId: currentTarget._id,
      },
      page: 1,
      isVisible: true,
    };

    const result: ContentType[] = [
      {
        ...currentTarget,
        qIdx: targetQIdx,
        conditional: [newConditional],
      },
      newChildQuestion,
    ];

    const numbered = AddQuestionNumbering({ questions: result });

    // Validate structure
    const validation = validateQuestionStructure(numbered);
    expect(validation.isValid).toBe(true);
    expect(validation.errors).toHaveLength(0);

    // Parent should have valid qIdx
    expect(numbered[0].qIdx).toBe(1);
    expect(numbered[0].conditional?.[0].contentIdx).toBe(2);

    // Child should have valid qIdx and valid parentcontent.qIdx
    expect(numbered[1].qIdx).toBe(2);
    expect(numbered[1].parentcontent?.qIdx).toBe(1);
  });
});
