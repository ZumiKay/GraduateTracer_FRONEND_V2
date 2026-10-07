import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import PreviewTab from "../component/FormComponent/Preview/PreviewTab";
import { QuestionType, ContentType } from "../types/Form.types";
import { MultipleChoiceQuestion } from "../component/Response/components/MultipleChoiceQuestion";
import { CheckboxQuestion } from "../component/Response/components/CheckboxQuestion";
import { QuestionRenderer } from "../component/Response/components/QuestionRenderer";

// Mock react-redux
const mockUser = { _id: "user123", email: "test@example.com", name: "Test User" };
jest.mock("react-redux", () => ({
  useSelector: jest.fn((selector) =>
    selector({ usersession: { user: mockUser } })
  ),
  useDispatch: () => jest.fn(),
}));

// Mock useRespondentFormPaginaition
const mockFormState = {
  _id: "form123",
  title: "Test Preview Form",
  totalpage: 1,
  type: "normal",
  contents: [
    {
      _id: "q_mc",
      questionId: "1",
      qIdx: 0,
      title: "What is your favorite fruit?",
      type: QuestionType.MultipleChoice,
      multiple: [
        { content: "Apple", idx: 0 },
        { content: "Banana", idx: 1 },
      ],
    },
  ],
};

let mockPaginationReturn = {
  formState: mockFormState,
  currentPage: 1,
  totalPages: 1,
  canGoNext: false,
  canGoPrev: false,
  error: null,
  isFetching: false,
  isSuccess: true,
  handlePage: jest.fn(),
  goToPage: jest.fn(),
};

jest.mock("../component/Response/hooks/usePaginatedFormData", () => ({
  __esModule: true,
  default: () => mockPaginationReturn,
}));

// Mock SessionContext
jest.mock("../context/SessionContext", () => ({
  __esModule: true,
  default: React.createContext({
    checkSession: async () => true,
    isChecking: false,
    lastCheckSuccess: true,
  }),
}));

// Mock StyledTiptap to avoid rendering ProseMirror in unit tests
jest.mock("../component/Response/components/StyledTiptap", () => ({
  __esModule: true,
  default: ({ value }: { value: unknown }) => (
    <div data-testid="styled-tiptap">{typeof value === "string" ? value : "Question Title"}</div>
  ),
}));

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
};

describe("PreviewTab & Choice Question Answering", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPaginationReturn = {
      formState: mockFormState,
      currentPage: 1,
      totalPages: 1,
      canGoNext: false,
      canGoPrev: false,
      error: null,
      isFetching: false,
      isSuccess: true,
      handlePage: jest.fn(),
      goToPage: jest.fn(),
    };
  });

  it("renders preview banner and form header", () => {
    renderWithProviders(<PreviewTab formId="form123" />);

    expect(screen.getAllByText(/Preview Mode/i)[0]).toBeInTheDocument();
    expect(screen.getByText("Test Preview Form")).toBeInTheDocument();
  });

  it("does not unmount or reload form when background isFetching occurs after formState is loaded", () => {
    // Initially loaded form
    const { rerender } = renderWithProviders(<PreviewTab formId="form123" />);
    expect(screen.getByText("Test Preview Form")).toBeInTheDocument();

    // Background refetch begins (isFetching becomes true, but formState remains)
    mockPaginationReturn = {
      ...mockPaginationReturn,
      isFetching: true,
    };

    const queryClient = new QueryClient();
    rerender(
      <QueryClientProvider client={queryClient}>
        <PreviewTab formId="form123" />
      </QueryClientProvider>
    );

    // Form should still be rendered, NOT replaced by full-page spinner
    expect(screen.getByText("Test Preview Form")).toBeInTheDocument();
    expect(screen.queryByLabelText("Loading form")).not.toBeInTheDocument();
  });

  it("MultipleChoiceQuestion updates response on choice click without reloading", () => {
    const updateResponse = jest.fn();
    const mcQuestion: ContentType = {
      _id: "q1",
      formId: "form123",
      questionId: "1",
      qIdx: 0,
      title: "Favorite color?",
      type: QuestionType.MultipleChoice,
      multiple: [
        { content: "Red", idx: 0 },
        { content: "Blue", idx: 1 },
      ],
    };

    const { rerender } = render(
      <MultipleChoiceQuestion
        question={mcQuestion}
        currentResponse={undefined}
        updateResponse={updateResponse}
      />
    );

    expect(screen.getByText("Question 1")).toBeInTheDocument();
    expect(screen.getByText("Red")).toBeInTheDocument();
    expect(screen.getByText("Blue")).toBeInTheDocument();

    // Click on option 0
    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(2);

    fireEvent.click(radios[0]);
    expect(updateResponse).toHaveBeenCalledWith("q1", [0]);

    // Rerender with selected response
    rerender(
      <MultipleChoiceQuestion
        question={mcQuestion}
        currentResponse={[0]}
        updateResponse={updateResponse}
      />
    );

    expect(radios[0]).toBeChecked();
    expect(radios[1]).not.toBeChecked();
  });

  it("CheckboxQuestion updates response on option click without reloading", () => {
    const updateResponse = jest.fn();
    const cbQuestion: ContentType = {
      _id: "q2",
      formId: "form123",
      questionId: "2",
      qIdx: 1,
      title: "Choose skills",
      type: QuestionType.CheckBox,
      checkbox: [
        { content: "React", idx: 0 },
        { content: "TypeScript", idx: 1 },
      ],
    };

    render(
      <CheckboxQuestion
        question={cbQuestion}
        currentResponse={[]}
        updateResponse={updateResponse}
      />
    );

    expect(screen.getByText("Question 2")).toBeInTheDocument();
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(2);

    fireEvent.click(checkboxes[0]);
    expect(updateResponse).toHaveBeenCalledWith("q2", [0]);
  });

  it("QuestionRenderer renders conditional question indicator statically without lazy suspension", () => {
    const updateResponse = jest.fn();
    const onAnswer = jest.fn();

    const parentQ: ContentType = {
      _id: "parent1",
      formId: "form123",
      questionId: "1",
      qIdx: 0,
      title: "Do you have pets?",
      type: QuestionType.MultipleChoice,
      multiple: [
        { content: "Yes", idx: 0 },
        { content: "No", idx: 1 },
      ],
    };

    const childQ: ContentType = {
      _id: "child1",
      formId: "form123",
      questionId: "2",
      qIdx: 1,
      title: "What pet do you have?",
      type: QuestionType.MultipleChoice,
      multiple: [
        { content: "Dog", idx: 0 },
        { content: "Cat", idx: 1 },
      ],
      parentcontent: {
        qId: "parent1",
        qIdx: 0,
        optIdx: 0,
        questionId: "1",
      },
    };

    render(
      <QuestionRenderer
        question={childQ}
        index={1}
        questions={[parentQ, childQ]}
        currentResponse={undefined}
        onAnswer={onAnswer}
        updateResponse={updateResponse}
      />
    );

    // Conditional indicator should be displayed statically
    expect(screen.getByText("Conditional Question")).toBeInTheDocument();
    expect(screen.getByText(/1 selects "Yes"/i)).toBeInTheDocument();
  });
});
