import { render, screen, fireEvent } from "@testing-library/react";
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

const sampleDoc = {
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text: "Sample text" }] }],
};

describe("TipTabEditor Floating Formatting Tools Container", () => {
  it("renders the floating toolbar on mobile/tablet and in-flow on desktop", () => {
    const { container } = render(
      <Tiptap value={sampleDoc} readonly={false} onChange={jest.fn()} />
    );

    const toolbar = container.querySelector(".tiptap_floating_toolbar");
    expect(toolbar).toBeInTheDocument();

    // Verify mobile/tablet right-side floating classes (< lg)
    expect(toolbar?.className).toContain("max-lg:sticky");
    expect(toolbar?.className).toContain("max-lg:bottom-3");
    expect(toolbar?.className).toContain("max-lg:self-end");
    expect(toolbar?.className).toContain("max-lg:ml-auto");
    expect(toolbar?.className).toContain("max-lg:z-30");
    expect(toolbar?.className).toContain("max-lg:bg-white/95");
    expect(toolbar?.className).toContain("max-lg:backdrop-blur-md");
    expect(toolbar?.className).toContain("max-lg:shadow-2xl");

    // Verify desktop in-flow classes (>= lg)
    expect(toolbar?.className).toContain("lg:relative");
    expect(toolbar?.className).toContain("lg:bottom-auto");
    expect(toolbar?.className).toContain("lg:right-auto");
    expect(toolbar?.className).toContain("lg:self-auto");
    expect(toolbar?.className).toContain("lg:bg-transparent");
  });

  it("renders formatting tool buttons (Bold, Italic, Code, Link, Lists, Math, Help)", () => {
    render(<Tiptap value={sampleDoc} readonly={false} onChange={jest.fn()} />);

    // Header label on mobile/tablet
    expect(screen.getByText("Format Tools")).toBeInTheDocument();

    // Formatting tools
    expect(screen.getByTitle(/Bold/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Italic/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Inline Code/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Insert Link/i)).toBeInTheDocument();
    expect(screen.getByTitle(/List \(Bullet \/ Numbered\)/i)).toBeInTheDocument();
    expect(screen.getByTitle("Alphabetical list (a, b, c…)")).toBeInTheDocument();
    expect(screen.getByTitle("Alphabetical list (A, B, C…)")).toBeInTheDocument();
    expect(screen.getByTitle(/Insert math block/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Editor Help/i)).toBeInTheDocument();
  });

  it("collapses and expands formatting tools container on mobile/tablet", () => {
    render(<Tiptap value={sampleDoc} readonly={false} onChange={jest.fn()} />);

    const toggleBtn = screen.getByRole("button", { name: /collapse formatting tools/i });
    expect(toggleBtn).toBeInTheDocument();
    expect(screen.getByText("Hide")).toBeInTheDocument();

    // Click Hide to collapse
    fireEvent.click(toggleBtn);
    expect(screen.getByText("Expand")).toBeInTheDocument();

    // Click Expand to open back
    const expandBtn = screen.getByRole("button", { name: /^expand$/i });
    fireEvent.click(expandBtn);
    expect(screen.getByText("Hide")).toBeInTheDocument();
    expect(screen.getByTitle(/Bold/i)).toBeInTheDocument();
  });

  it("provides touch-friendly ergonomic buttons and right-side dock styling", () => {
    const { container } = render(
      <Tiptap value={sampleDoc} readonly={false} onChange={jest.fn()} />
    );

    const toolbar = container.querySelector(".tiptap_floating_toolbar");
    expect(toolbar?.className).toContain("max-lg:w-[280px]");
    expect(toolbar?.className).toContain("sm:max-lg:w-[320px]");

    // Verify touch sizing on buttons
    const boldBtn = screen.getByTitle(/Bold/i);
    expect(boldBtn.className).toContain("h-10");
    expect(boldBtn.className).toContain("active:scale-95");
    expect(boldBtn.className).toContain("rounded-xl");
    expect(boldBtn.className).toContain("lg:w-[32px]");
    expect(boldBtn.className).toContain("lg:h-[32px]");

    // Verify Help button spans 2 columns on mobile/tablet to complete the 5-col grid
    const helpBtn = screen.getByTitle(/Editor Help/i);
    expect(helpBtn.className).toContain("max-lg:col-span-2");
    expect(helpBtn.className).toContain("h-10");
  });

  it("triggers formatting actions when tool buttons are tapped", () => {
    render(<Tiptap value={sampleDoc} readonly={false} onChange={jest.fn()} />);

    // Click Bold, Italic, Code
    fireEvent.click(screen.getByTitle(/Bold/i));
    fireEvent.click(screen.getByTitle(/Italic/i));
    fireEvent.click(screen.getByTitle(/Inline Code/i));

    // Click Lists
    fireEvent.click(screen.getByTitle(/List \(Bullet \/ Numbered\)/i));
    fireEvent.click(screen.getByTitle("Alphabetical list (a, b, c…)"));
    fireEvent.click(screen.getByTitle("Alphabetical list (A, B, C…)"));

    // Click Math
    fireEvent.click(screen.getByTitle(/Insert math block/i));

    // Click Link and Help to open their respective modals
    fireEvent.click(screen.getByTitle(/Insert Link/i));
    fireEvent.click(screen.getByTitle(/Editor Help/i));
  });

  it("does not render the floating toolbar when readonly is true", () => {
    const { container } = render(
      <Tiptap value={sampleDoc} readonly={true} />
    );

    const toolbar = container.querySelector(".tiptap_floating_toolbar");
    expect(toolbar).not.toBeInTheDocument();
  });
});
