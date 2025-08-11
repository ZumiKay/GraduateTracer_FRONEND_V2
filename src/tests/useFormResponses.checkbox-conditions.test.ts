import { renderHook, act } from "@testing-library/react";
import { useFormResponses } from "../component/Response/hooks/useFormResponses";
import { ContentType, QuestionType } from "../types/Form.types";

const mkMultiple = (formId = "f1"): ContentType => ({
  _id: "q1",
  formId,
  type: QuestionType.MultipleChoice,
  multiple: [
    { idx: 0, content: "A" },
    { idx: 1, content: "B" },
    { idx: 2, content: "C" },
  ],
});

const mkCheckbox = (formId = "f1"): ContentType => ({
  _id: "q2",
  formId,
  type: QuestionType.CheckBox,
  checkbox: [
    { idx: 0, content: "CA" },
    { idx: 1, content: "CB" },
    { idx: 2, content: "CC" },
  ],
});

describe("useFormResponses checkbox/multiple conditional logic", () => {
  test("shows child when parent multiple choice matches expected option index", () => {
    const parent = mkMultiple();
    const child: ContentType = {
      _id: "child1",
      formId: "f1",
      type: QuestionType.Text,
      parentcontent: { qId: parent._id!, optIdx: 1 },
    };

    const questions = [parent, child];
    const { result } = renderHook(() => useFormResponses(questions));

    act(() => {
      result.current.initializeResponses();
    });

    // initially hidden (no response yet)
    expect(
      result.current.checkIfQuestionShouldShow(child, result.current.responses)
    ).toBe(false);

    // select option index 1
    act(() => {
      result.current.updateResponse(parent._id!, 1);
    });

    expect(
      result.current.checkIfQuestionShouldShow(child, result.current.responses)
    ).toBe(true);
  });

  test("shows child when checkbox parent has any selected index matching expected optIdx (multi select)", () => {
    const parent = mkCheckbox();
    const childIdx1: ContentType = {
      _id: "child2",
      formId: "f1",
      type: QuestionType.Text,
      parentcontent: { qId: parent._id!, optIdx: 0 },
    };
    const childIdx2: ContentType = {
      _id: "child3",
      formId: "f1",
      type: QuestionType.Text,
      parentcontent: { qId: parent._id!, optIdx: 2 },
    };

    const questions = [parent, childIdx1, childIdx2];
    const { result } = renderHook(() => useFormResponses(questions));

    act(() => {
      result.current.initializeResponses();
    });

    // Select multiple options [0, 2]
    act(() => {
      result.current.updateResponse(parent._id!, [0, 2]);
    });

    expect(
      result.current.checkIfQuestionShouldShow(
        childIdx1,
        result.current.responses
      )
    ).toBe(true);
    expect(
      result.current.checkIfQuestionShouldShow(
        childIdx2,
        result.current.responses
      )
    ).toBe(true);
  });

  test("supports content-based matching for checkbox parent when expected optIdx is a string content", () => {
    const parent = mkCheckbox();
    const childContent: ContentType = {
      _id: "child4",
      formId: "f1",
      type: QuestionType.Text,
      parentcontent: { qId: parent._id!, optIdx: "CB" as unknown as number },
    } as ContentType;

    const questions = [parent, childContent];
    const { result } = renderHook(() => useFormResponses(questions));

    act(() => {
      result.current.initializeResponses();
    });

    // simulate legacy responses storing content strings
    act(() => {
      result.current.updateResponse(parent._id!, ["CB"]);
    });

    expect(
      result.current.checkIfQuestionShouldShow(
        childContent,
        result.current.responses
      )
    ).toBe(true);
  });
});
