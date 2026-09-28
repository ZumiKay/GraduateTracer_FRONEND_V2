import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import QuestionComponent from "../component/FormComponent/QuestionComponent";
import { QuestionType, ContentType } from "../types/Form.types";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import formstore from "../redux/formstore";
import OpenModal from "../redux/openmodal";

jest.mock("../component/FormComponent/TipTabEditor", () => {
  return function MockTiptap({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    return (
      <div data-testid="mock-tiptap">
        <input
          data-testid="mock-tiptap-input"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
  };
});

jest.mock("@heroui/react", () => ({
  Switch: ({ children, isSelected, onValueChange, ...props }: any) => (
    <label data-testid="mock-switch">
      <input
        type="checkbox"
        checked={!!isSelected}
        onChange={(e) => onValueChange?.(e.target.checked)}
        {...props}
      />
      {children}
    </label>
  ),
  Tooltip: ({ children }: any) => <>{children}</>,
  Button: ({ children, onPress, ...props }: any) => (
    <button onClick={onPress} {...props}>
      {children}
    </button>
  ),
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
  Dropdown: ({ children }: any) => <div>{children}</div>,
  DropdownTrigger: ({ children }: any) => <>{children}</>,
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownItem: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Input: ({ endContent: _e, classNames: _c, ...props }: any) => <input {...props} />,
  NumberInput: ({ endContent: _e, classNames: _c, ...props }: any) => <input type="number" {...props} />,
  Modal: ({ children, isOpen, onClose }: any) =>
    isOpen ? (
      <div role="dialog">
        {typeof children === "function"
          ? children(onClose)
          : Array.isArray(children)
          ? children.map((c: any) => (typeof c === "function" ? c(onClose) : c))
          : children}
      </div>
    ) : null,
  ModalContent: ({ children, onClose }: any) => (
    <div>{typeof children === "function" ? children(onClose ?? (() => {})) : children}</div>
  ),
  ModalHeader: ({ children }: any) => <div>{children}</div>,
  ModalBody: ({ children }: any) => <div>{children}</div>,
  ModalFooter: ({ children }: any) => <div>{children}</div>,
}));

describe("QuestionComponent Responsiveness & Floating Mobile Controls", () => {
  let store: any;

  const defaultQuestion: ContentType = {
    _id: "q-1",
    qIdx: 0,
    formId: "form-1",
    questionId: "1",
    title: "What is your current occupation?",
    type: QuestionType.MultipleChoice,
    require: true,
    multiple: [
      { idx: 0, content: "Employed Full-time" },
      { idx: 1, content: "Self-employed" },
    ],
    conditional: [],
    parentcontent: { qIdx: -1, questionId: "-1", optIdx: -1 },
    score: 0,
    point: 0,
  };

  beforeEach(() => {
    store = configureStore({
      reducer: {
        allform: formstore.reducer,
        openmodal: OpenModal.reducer,
      } as any,
      preloadedState: {
        allform: {
          allquestion: [defaultQuestion],
          formstate: {
            title: "Test Form",
            description: "",
            page: 1,
            totalpage: 1,
            setting: {
              qcolor: "#4f46e5",
              autosave: false,
            },
          },
        },
      } as any,
    });
  });

  const renderComponent = (props: Partial<React.ComponentProps<typeof QuestionComponent>> = {}) => {
    const defaultProps = {
      idx: 0,
      value: defaultQuestion,
      color: "#4f46e5",
      isLinked: () => false,
      onDelete: jest.fn(),
      onDuplication: jest.fn(),
      ...props,
    };

    return {
      ...render(
        <Provider store={store}>
          <QuestionComponent {...defaultProps} />
        </Provider>
      ),
      props: defaultProps,
    };
  };

  it("renders the question badge with Q1", () => {
    renderComponent();
    expect(screen.getAllByText("Q1").length).toBeGreaterThan(0);
  });

  it("renders both desktop controls (hidden on mobile) and mobile floating container (hidden on desktop)", () => {
    const { container } = renderComponent();

    // Mobile floating container must exist with md:hidden and sticky bottom
    const mobileFloating = container.querySelector(".mobile_floating_container");
    expect(mobileFloating).toBeInTheDocument();
    expect(mobileFloating).toHaveClass("md:hidden");
    expect(mobileFloating).toHaveClass("sticky");

    // Desktop action buttons must exist with hidden md:flex
    const desktopActions = container.querySelector(".detail_section");
    expect(desktopActions).toBeInTheDocument();
    expect(desktopActions).toHaveClass("hidden");
    expect(desktopActions).toHaveClass("md:flex");
  });

  it("renders mobile controls with type selection, action buttons, and required switch", () => {
    renderComponent();

    // Mobile controls header
    expect(screen.getByText("Toolbar & Type")).toBeInTheDocument();

    // Action buttons inside mobile container
    expect(screen.getByLabelText("Duplicate Question")).toBeInTheDocument();
    expect(screen.getByLabelText("Delete Question")).toBeInTheDocument();

    // Mobile question type selection
    expect(screen.getByLabelText("Select Question Type (Mobile)")).toBeInTheDocument();
  });

  it("toggles the mobile floating container between collapsed and expanded states", () => {
    renderComponent();

    // Initially expanded - find Hide button
    const toggleBtn = screen.getByRole("button", { name: /collapse controls/i });
    expect(toggleBtn).toBeInTheDocument();
    expect(screen.getByText("Hide")).toBeInTheDocument();

    // Click Hide to collapse
    fireEvent.click(toggleBtn);
    expect(screen.getByText("Show")).toBeInTheDocument();

    // In collapsed state, should show summary bar with Edit button
    const editBtn = screen.getByRole("button", { name: /edit/i });
    expect(editBtn).toBeInTheDocument();

    // Click Edit to expand back
    fireEvent.click(editBtn);
    expect(screen.getByText("Hide")).toBeInTheDocument();
    expect(screen.getByLabelText("Select Question Type (Mobile)")).toBeInTheDocument();
  });

  it("calls onDuplication and onDelete when mobile toolbar action buttons are clicked", () => {
    const onDelete = jest.fn();
    const onDuplication = jest.fn();

    renderComponent({ onDelete, onDuplication });

    const duplicateBtn = screen.getByLabelText("Duplicate Question");
    fireEvent.click(duplicateBtn);
    expect(onDuplication).toHaveBeenCalledTimes(1);

    const deleteBtn = screen.getByLabelText("Delete Question");
    fireEvent.click(deleteBtn);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("opens the question type selection modal on mobile device when tapped", () => {
    renderComponent();

    // The modal should initially not be open
    expect(screen.queryByText("Select Question Type")).not.toBeInTheDocument();

    // Click mobile question type trigger button
    const typeBtn = screen.getByLabelText("Select Question Type (Mobile)");
    fireEvent.click(typeBtn);

    // Modal should now be open
    expect(screen.getByText("Select Question Type")).toBeInTheDocument();
    expect(screen.getByText("Choose how respondents will answer this question")).toBeInTheDocument();

    // Options should be displayed with their labels and descriptions
    expect(screen.getByLabelText("Select Multiple Choice")).toBeInTheDocument();
    expect(screen.getByLabelText("Select CheckBox")).toBeInTheDocument();
    expect(screen.getByLabelText("Select Number")).toBeInTheDocument();
    expect(screen.getByLabelText("Select Date")).toBeInTheDocument();
    expect(screen.getByLabelText("Select Short Answer")).toBeInTheDocument();
  });

  it("opens question type modal from the mobile header trigger and selects a new type", () => {
    renderComponent();

    const changeBtn = screen.getByLabelText("Change Question Type");
    fireEvent.click(changeBtn);

    expect(screen.getByText("Select Question Type")).toBeInTheDocument();

    // Select Number type
    const numberOption = screen.getByLabelText("Select Number");
    fireEvent.click(numberOption);

    // Modal should close after selection
    expect(screen.queryByText("Select Question Type")).not.toBeInTheDocument();
  });
});
