import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import Tiptap from "../component/FormComponent/TipTabEditor";

jest.mock("@heroui/react", () => ({
  Select: ({ items, selectedKeys, onChange, placeholder, "aria-label": ariaLabel }: any) => (
    <select
      aria-label={ariaLabel ?? placeholder}
      value={selectedKeys?.[0] ?? ""}
      onChange={onChange}
    >
      {items?.map((item: any) => (
        <option key={item.value} value={item.value}>
          {item.label}
        </option>
      ))}
    </select>
  ),
  SelectItem: ({ children, ...props }: any) => <option {...props}>{children}</option>,
  Modal: ({ children, isOpen }: any) => (isOpen ? <div>{children}</div> : null),
  ModalContent: ({ children }: any) => <div>{typeof children === "function" ? children() : children}</div>,
  ModalHeader: ({ children }: any) => <div>{children}</div>,
  ModalBody: ({ children }: any) => <div>{children}</div>,
  ModalFooter: ({ children }: any) => <div>{children}</div>,
  Button: ({ children, onPress, ...props }: any) => (
    <button onClick={onPress} {...props}>
      {children}
    </button>
  ),
  Input: (props: any) => <input {...props} />,
  Form: ({ children, onSubmit, ...props }: any) => (
    <form onSubmit={onSubmit} {...props}>
      {children}
    </form>
  ),
}));

const mathDoc = (latex: string) => ({
  type: "doc",
  content: [
    { type: "paragraph", content: [{ type: "text", text: "Before" }] },
    { type: "displayMath", attrs: { latex } },
  ],
});

const hasMathBlock = (doc: any) =>
  (doc?.content ?? []).some((n: any) => n.type === "displayMath");

const lastDoc = (fn: jest.Mock) => fn.mock.calls[fn.mock.calls.length - 1][0];

describe("TipTabEditor math block deletion", () => {
  it("deletes an empty math block when Backspace is pressed in its input", async () => {
    const onChange = jest.fn();
    render(<Tiptap value={mathDoc("")} readonly={false} onChange={onChange} />);

    const textarea = await screen.findByPlaceholderText(/Enter LaTeX/);
    fireEvent.keyDown(textarea, { key: "Backspace" });

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(hasMathBlock(lastDoc(onChange))).toBe(false);
    expect(screen.queryByPlaceholderText(/Enter LaTeX/)).not.toBeInTheDocument();
  });

  it("keeps the block when Backspace is pressed while it still has text", async () => {
    const onChange = jest.fn();
    render(<Tiptap value={mathDoc("")} readonly={false} onChange={onChange} />);

    const textarea = await screen.findByPlaceholderText(/Enter LaTeX/);
    fireEvent.change(textarea, { target: { value: "x^2" } });
    fireEvent.keyDown(textarea, { key: "Backspace" });

    expect(screen.getByPlaceholderText(/Enter LaTeX/)).toBeInTheDocument();
    expect(onChange.mock.calls.some(([doc]) => !hasMathBlock(doc))).toBe(false);
  });

  it("deletes a filled math block with the delete button", async () => {
    const onChange = jest.fn();
    render(<Tiptap value={mathDoc("x^2")} readonly={false} onChange={onChange} />);

    fireEvent.click(await screen.findByLabelText("Delete math block"));

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(hasMathBlock(lastDoc(onChange))).toBe(false);
  });

  it("does not show the delete button in readonly mode", async () => {
    const { container } = render(<Tiptap value={mathDoc("x^2")} readonly />);

    await waitFor(() =>
      expect(container.querySelector(".katex")).toBeInTheDocument(),
    );
    expect(screen.queryByLabelText("Delete math block")).not.toBeInTheDocument();
  });
});
