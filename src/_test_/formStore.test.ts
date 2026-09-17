import formstore, {
  setallquestion,
  syncQuestionsAfterSave,
} from "../redux/formstore";
import { QuestionType } from "../types/Form.types";
import type { ContentType } from "../types/Form.types";

const reducer = formstore.reducer;

const defaultState = () => reducer(undefined, { type: "" });

const makeQuestion = (overrides: Partial<ContentType> = {}): ContentType => ({
  qIdx: 0,
  type: QuestionType.ShortAnswer,
  formId: "form-1",
  page: 1,
  ...overrides,
});

describe("setallquestion reducer", () => {
  describe("when tab = 'question' (default — no tab param)", () => {
    beforeEach(() => {
      Object.defineProperty(window, "location", {
        value: { search: "" },
        writable: true,
      });
    });

    test("sets allquestion from a plain array and runs validation", () => {
      const questions = [makeQuestion({ _id: "q1", qIdx: 0 })];
      const nextState = reducer(defaultState(), setallquestion(questions));

      expect(nextState.allquestion).toHaveLength(1);
      expect(nextState.allquestion[0].qIdx).toBe(0);
    });

    test("sets allquestion using a function updater", () => {
      const initial = defaultState();
      const existing = [makeQuestion({ _id: "q1", qIdx: 0 })];
      const seeded = reducer(initial, setallquestion(existing));

      const appended = makeQuestion({ _id: "q2", qIdx: 1 });
      const nextState = reducer(
        seeded,
        setallquestion((prev) => [...prev, appended]),
      );

      expect(nextState.allquestion).toHaveLength(2);
      expect(nextState.allquestion[1]._id).toBe("q2");
    });
  });

  describe("when tab != 'question'", () => {
    beforeEach(() => {
      Object.defineProperty(window, "location", {
        value: { search: "?tab=scoring" },
        writable: true,
      });
    });

    test("sets allquestion directly WITHOUT overwriting existing validationIssues", () => {
      const questionWithIssues = makeQuestion({
        _id: "q1",
        validationIssues: [
          { type: "error", message: "existing issue" } as never,
        ],
      });

      const nextState = reducer(
        defaultState(),
        setallquestion([questionWithIssues]),
      );

      // Validation does NOT run on non-question tabs → issues stay intact
      expect(nextState.allquestion[0].validationIssues).toEqual([
        { type: "error", message: "existing issue" },
      ]);
    });

    test("handles function updater when tab != question", () => {
      const base = makeQuestion({ _id: "q1", qIdx: 0 });
      const seeded = reducer(defaultState(), setallquestion([base]));

      const updated = reducer(
        seeded,
        setallquestion((prev) => prev.filter((q) => q._id !== "q1")),
      );

      expect(updated.allquestion).toHaveLength(0);
    });
  });
});

describe("syncQuestionsAfterSave reducer", () => {
  test("syncs prevAllQuestion to allquestion when savedData is empty", () => {
    const q = makeQuestion({ _id: "q1", qIdx: 0 });
    const state = { ...defaultState(), allquestion: [q], prevAllQuestion: [] };

    const nextState = reducer(state, syncQuestionsAfterSave({ savedData: [] }));

    expect(nextState.prevAllQuestion).toEqual([q]);
    expect(nextState.allquestion).toEqual([q]); // unchanged
  });

  test("only syncs prevAllQuestion when all questions already have _id", () => {
    const q1 = makeQuestion({ _id: "existing-id-1", qIdx: 0 });
    const q2 = makeQuestion({ _id: "existing-id-2", qIdx: 1 });
    const savedData = [
      { ...q1, _id: "existing-id-1" },
      { ...q2, _id: "existing-id-2" },
    ];

    const state = {
      ...defaultState(),
      allquestion: [q1, q2],
      prevAllQuestion: [],
    };

    const nextState = reducer(state, syncQuestionsAfterSave({ savedData }));

    expect(nextState.prevAllQuestion).toEqual([q1, q2]);
    expect(nextState.allquestion).toEqual([q1, q2]); // unchanged
  });

  test("merges _id from savedData into questions that had no _id", () => {
    const newQuestion = makeQuestion({ qIdx: 2, page: 1 }); // no _id
    const savedVersion = { ...newQuestion, _id: "brand-new-id" };

    const state = {
      ...defaultState(),
      allquestion: [newQuestion],
      prevAllQuestion: [],
    };

    const nextState = reducer(
      state,
      syncQuestionsAfterSave({ savedData: [savedVersion] }),
    );

    expect(nextState.allquestion[0]._id).toBe("brand-new-id");
    expect(nextState.prevAllQuestion[0]._id).toBe("brand-new-id");
  });

  test("preserves all other fields when merging _id", () => {
    const newQuestion = makeQuestion({ qIdx: 3, page: 1, score: 10 }); // no _id
    const savedVersion = { ...newQuestion, _id: "saved-id" };

    const state = {
      ...defaultState(),
      allquestion: [newQuestion],
      prevAllQuestion: [],
    };

    const nextState = reducer(
      state,
      syncQuestionsAfterSave({ savedData: [savedVersion] }),
    );

    expect(nextState.allquestion[0].score).toBe(10);
    expect(nextState.allquestion[0]._id).toBe("saved-id");
  });

  test("does not assign _id when qIdx/page do not match any savedData entry", () => {
    const newQuestion = makeQuestion({ qIdx: 99, page: 5 }); // no _id, no match
    const savedVersion = makeQuestion({ qIdx: 0, page: 1, _id: "irrelevant" });

    const state = {
      ...defaultState(),
      allquestion: [newQuestion],
      prevAllQuestion: [],
    };

    const nextState = reducer(
      state,
      syncQuestionsAfterSave({ savedData: [savedVersion] }),
    );

    // No match → no new IDs → only prevAllQuestion synced, _id stays undefined
    expect(nextState.allquestion[0]._id).toBeUndefined();
    expect(nextState.prevAllQuestion[0]._id).toBeUndefined();
  });

  test("some questions have _id, some don't", () => {
    const withId = makeQuestion({ _id: "old-id", qIdx: 0, page: 1 });
    const withoutId = makeQuestion({ qIdx: 1, page: 1 }); // no _id

    const savedData = [withId, { ...withoutId, _id: "new-id-for-q1" }];

    const state = {
      ...defaultState(),
      allquestion: [withId, withoutId],
      prevAllQuestion: [],
    };

    const nextState = reducer(state, syncQuestionsAfterSave({ savedData }));

    const merged = nextState.allquestion;
    expect(merged[0]._id).toBe("old-id"); // unchanged
    expect(merged[1]._id).toBe("new-id-for-q1"); // merged
    expect(nextState.prevAllQuestion).toEqual(merged);
  });
});
