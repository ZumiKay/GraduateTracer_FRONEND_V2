import { ContentType, QuestionType } from "../types/Form.types";
import {
  applySolutionEdit,
  getLiveSolutionWarnings,
  getSolutionIssues,
} from "../utils/solutionValidation";

const q = (overrides: Partial<ContentType>): ContentType =>
  ({ qIdx: 0, page: 1, type: QuestionType.MultipleChoice, ...overrides }) as ContentType;

describe("getLiveSolutionWarnings", () => {
  it("reports what is missing on an auto-scorable question", () => {
    expect(getLiveSolutionWarnings(q({}))[0].message).toBe("Missing score and answer key");
    expect(getLiveSolutionWarnings(q({ score: 2 }))[0].message).toBe("Missing answer key");
    expect(getLiveSolutionWarnings(q({ answer: { answer: 1 } as never }))[0].message).toBe(
      "Missing score",
    );
  });

  it("is empty once both score and answer are set", () => {
    expect(getLiveSolutionWarnings(q({ score: 2, answer: { answer: 1 } as never }))).toEqual([]);
  });

  it("treats an empty answer as missing", () => {
    expect(getLiveSolutionWarnings(q({ score: 2, answer: { answer: [] } as never }))).toHaveLength(1);
  });

  it("ignores display text and manually graded types", () => {
    expect(getLiveSolutionWarnings(q({ type: QuestionType.Text }))).toEqual([]);
    expect(getLiveSolutionWarnings(q({ type: QuestionType.Paragraph }))).toEqual([]);
  });
});

describe("getSolutionIssues", () => {
  it("drops stale server warnings but keeps server errors", () => {
    const question = q({
      score: 2,
      answer: { answer: 1 } as never,
      validationIssues: [
        { type: "warning", message: "Missing Score or Answer" },
        { type: "error", message: "Invalid answer key" },
      ],
    });
    expect(getSolutionIssues(question)).toEqual([{ type: "error", message: "Invalid answer key" }]);
  });
});

describe("applySolutionEdit", () => {
  const parent = q({ _id: "p", qIdx: 0, score: 10, conditional: [{ contentId: "c" } as never] });
  const child = q({ _id: "c", qIdx: 1, score: 5, parentcontent: { qId: "p", optIdx: 0 } });
  const bonusChild = q({
    _id: "b",
    qIdx: 2,
    score: 3,
    isBonusScore: true,
    parentcontent: { qId: "p", optIdx: 0 },
  });
  const other = q({ _id: "o", qIdx: 3, score: 4 });
  const questions = [parent, child, bonusChild, other];

  it("resets non-bonus children when the parent's score is edited", () => {
    const result = applySolutionEdit(questions, 0, { score: 20 });
    expect(result[0].score).toBe(20);
    expect(result[1].score).toBe(0);
    expect(result[2].score).toBe(3);
    expect(result[3].score).toBe(4);
  });

  it("keeps children when the parent's score is unchanged", () => {
    const result = applySolutionEdit(questions, 0, { score: 10, isBonusScore: false });
    expect(result[1].score).toBe(5);
  });

  it("keeps children when another field of the parent changes", () => {
    const result = applySolutionEdit(questions, 0, { answer: { answer: 1 } as never });
    expect(result[1].score).toBe(5);
  });

  it("clears the edited question's server errors when its answer changes", () => {
    const withError = [
      q({
        validationIssues: [
          { type: "error", message: "Invalid answer key" },
          { type: "warning", message: "w" },
        ],
      }),
    ];
    const result = applySolutionEdit(withError, 0, { answer: { answer: 2 } as never });
    expect(result[0].validationIssues).toEqual([{ type: "warning", message: "w" }]);
  });
});
