import { render, screen } from "@testing-library/react";
import { DateRangePickerQuestionType } from "../component/FormComponent/Solution/Answer_Component";
import { CalendarDate } from "@internationalized/date";

// Mock the @heroui/react components
jest.mock("@heroui/react", () => ({
  DatePicker: ({
    value,
    label,
    onChange,
    isInvalid,
    errorMessage,
  }: {
    value?: unknown;
    label: string;
    onChange?: (date: unknown) => void;
    isInvalid?: boolean;
    errorMessage?: string;
  }) => (
    <div>
      <label>{label}</label>
      <input
        data-testid={`date-input-${label.toLowerCase().replace(" ", "-")}`}
        value={value ? value.toString() : ""}
        onChange={() => {
          if (onChange) {
            try {
              const date = new CalendarDate(2024, 1, 1); // Mock date
              onChange(date);
            } catch (error) {
              console.error("Mock date creation error:", error);
            }
          }
        }}
        data-invalid={isInvalid}
        aria-label={label}
        placeholder="Select date"
      />
      {isInvalid && errorMessage && (
        <span data-testid="error-message">{errorMessage}</span>
      )}
    </div>
  ),
}));

describe("DateRangePickerQuestionType", () => {
  const mockSetQuestionState = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render start and end date pickers", () => {
    render(
      <DateRangePickerQuestionType setquestionstate={mockSetQuestionState} />
    );

    expect(screen.getByTestId("date-input-start-date")).toBeInTheDocument();
    expect(screen.getByTestId("date-input-end-date")).toBeInTheDocument();
  });

  it("should display current values when questionstate is provided", () => {
    const startDate = new CalendarDate(2024, 1, 1);
    const endDate = new CalendarDate(2024, 12, 31);
    const questionstate = { start: startDate, end: endDate };

    render(
      <DateRangePickerQuestionType
        questionstate={questionstate}
        setquestionstate={mockSetQuestionState}
      />
    );

    // Component should render without errors
    expect(screen.getByTestId("date-input-start-date")).toBeInTheDocument();
    expect(screen.getByTestId("date-input-end-date")).toBeInTheDocument();
  });

  it("should handle date comparison without throwing errors", () => {
    const startDate = new CalendarDate(2024, 12, 31);
    const endDate = new CalendarDate(2024, 1, 1); // End before start
    const questionstate = { start: startDate, end: endDate };

    // This should not throw an error
    expect(() => {
      render(
        <DateRangePickerQuestionType
          questionstate={questionstate}
          setquestionstate={mockSetQuestionState}
        />
      );
    }).not.toThrow();

    // Should show validation error for invalid range
    expect(screen.getByTestId("error-message")).toBeInTheDocument();
    expect(
      screen.getByText("End date must be after or equal to start date")
    ).toBeInTheDocument();
  });

  it("should handle valid date range without errors", () => {
    const startDate = new CalendarDate(2024, 1, 1);
    const endDate = new CalendarDate(2024, 12, 31); // End after start
    const questionstate = { start: startDate, end: endDate };

    render(
      <DateRangePickerQuestionType
        questionstate={questionstate}
        setquestionstate={mockSetQuestionState}
      />
    );

    // Should not show validation error for valid range
    expect(screen.queryByTestId("error-message")).not.toBeInTheDocument();
  });

  it("should handle missing dates gracefully", () => {
    expect(() => {
      render(
        <DateRangePickerQuestionType setquestionstate={mockSetQuestionState} />
      );
    }).not.toThrow();

    // Should render both date pickers
    expect(screen.getByTestId("date-input-start-date")).toBeInTheDocument();
    expect(screen.getByTestId("date-input-end-date")).toBeInTheDocument();
  });

  it("should handle partial date values without errors", () => {
    const questionstate = {
      start: new CalendarDate(2024, 1, 1),
      end: undefined,
    } as { start: CalendarDate; end?: CalendarDate };

    expect(() => {
      render(
        <DateRangePickerQuestionType
          questionstate={questionstate as never}
          setquestionstate={mockSetQuestionState}
        />
      );
    }).not.toThrow();
  });
});
