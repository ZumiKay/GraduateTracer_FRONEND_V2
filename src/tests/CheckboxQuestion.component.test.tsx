import { render, screen, fireEvent } from "@testing-library/react";
import { CheckboxQuestion } from "../component/Response/components/CheckboxQuestion";
import { ContentType, QuestionType } from "../types/Form.types";

// Mock the Tiptap editor to avoid heavy rendering
jest.mock("../component/FormComponent/TipTabEditor", () => {
  return {
    __esModule: true,
    default: () => <div data-testid="tiptap" />,
  };
});

describe("CheckboxQuestion component", () => {
  const question: ContentType = {
    _id: "qcb",
    formId: "f1",
    qIdx: 1,
    type: QuestionType.CheckBox,
    checkbox: [
      { idx: 0, content: "A" },
      { idx: 2, content: "B" },
      { idx: 5, content: "C" },
    ],
    title: {
      type: "doc" as never,
      content: [{ type: "paragraph", content: [{ type: "text", text: "Q" }] }],
    },
  };

  test("treats numeric-string currentResponse as checked and updates with indices", () => {
    const onUpdate = jest.fn();
    render(
      <CheckboxQuestion
        idx={0}
        question={question}
        currentResponse={["2"]}
        updateResponse={onUpdate}
      />
    );

    const checkboxes = screen.getAllByRole("checkbox");
    // The second option has idx=2, should be checked from ["2"]
    expect(checkboxes[1]).toBeChecked();

    // Click first option (idx=0) to add
    fireEvent.click(checkboxes[0]);
    expect(onUpdate).toHaveBeenCalledWith("qcb", [0, 2]);
  });
});
