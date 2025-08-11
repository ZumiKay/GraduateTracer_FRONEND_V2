import { render, screen, fireEvent } from "@testing-library/react";
import { RangeNumberInputComponent } from "../component/FormComponent/QuestionComponentAssets";
import { RangeNumberAnswer } from "../component/FormComponent/Solution/Answer_Component";
import { RangeValue } from "@heroui/react";

describe("RangeNumber Components", () => {
  describe("RangeNumberInputComponent (Question Tab)", () => {
    it("should display current values when val prop is provided", () => {
      const mockOnChange = jest.fn();
      const testValue: RangeValue<number> = { start: 10, end: 50 };

      render(
        <RangeNumberInputComponent val={testValue} onChange={mockOnChange} />
      );

      // Check if the values are displayed
      const startInput = screen.getByLabelText("Start");
      const endInput = screen.getByLabelText("End");

      expect(startInput).toHaveValue(10);
      expect(endInput).toHaveValue(50);
    });

    it("should start with default values when no val prop is provided", () => {
      const mockOnChange = jest.fn();

      render(<RangeNumberInputComponent onChange={mockOnChange} />);

      const startInput = screen.getByLabelText("Start");
      const endInput = screen.getByLabelText("End");

      expect(startInput).toHaveValue(0);
      expect(endInput).toHaveValue(0);
    });

    it("should show validation error when end < start", () => {
      const mockOnChange = jest.fn();
      const testValue: RangeValue<number> = { start: 50, end: 10 };

      render(
        <RangeNumberInputComponent val={testValue} onChange={mockOnChange} />
      );

      expect(
        screen.getByText(
          "Invalid range: End value must be greater than or equal to start value"
        )
      ).toBeInTheDocument();
    });

    it("should call onChange when values are updated", () => {
      const mockOnChange = jest.fn();

      render(<RangeNumberInputComponent onChange={mockOnChange} />);

      const startInput = screen.getByLabelText("Start");

      fireEvent.change(startInput, { target: { value: "5" } });

      expect(mockOnChange).toHaveBeenCalledWith("start", 5);
    });
  });

  describe("RangeNumberAnswer (Respondent Form)", () => {
    it("should display question range information", () => {
      const mockOnChange = jest.fn();
      const questionRange = { start: 1, end: 100 };

      render(
        <RangeNumberAnswer value={questionRange} onChange={mockOnChange} />
      );

      expect(screen.getByText("Available Range: 1 - 100")).toBeInTheDocument();
    });

    it("should initialize with previous answer when provided", () => {
      const mockOnChange = jest.fn();
      const questionRange = { start: 1, end: 100 };
      const previousAnswer = { start: 20, end: 80 };

      render(
        <RangeNumberAnswer
          value={questionRange}
          previousAnswer={previousAnswer}
          onChange={mockOnChange}
        />
      );

      // Check if the selected values show the previous answer
      expect(screen.getByDisplayValue("20")).toBeInTheDocument();
      expect(screen.getByDisplayValue("80")).toBeInTheDocument();
    });

    it("should initialize at minimum when no previous answer", () => {
      const mockOnChange = jest.fn();
      const questionRange = { start: 10, end: 100 };

      render(
        <RangeNumberAnswer value={questionRange} onChange={mockOnChange} />
      );

      // Should start at the minimum value
      const startInputs = screen.getAllByDisplayValue("10");
      expect(startInputs.length).toBeGreaterThan(0);
    });

    it("should be disabled when readonly prop is true", () => {
      const mockOnChange = jest.fn();
      const questionRange = { start: 1, end: 100 };

      render(
        <RangeNumberAnswer
          value={questionRange}
          onChange={mockOnChange}
          readonly={true}
        />
      );

      const startInput = screen.getByLabelText("Selected Start");
      const endInput = screen.getByLabelText("Selected End");

      expect(startInput).toBeDisabled();
      expect(endInput).toBeDisabled();
    });
  });

  describe("Integration", () => {
    it("should handle range validation correctly in question tab", () => {
      const mockOnChange = jest.fn();

      render(<RangeNumberInputComponent onChange={mockOnChange} />);

      const startInput = screen.getByLabelText("Start");
      const endInput = screen.getByLabelText("End");

      // Set start to 100
      fireEvent.change(startInput, { target: { value: "100" } });
      // Set end to 50 (invalid)
      fireEvent.change(endInput, { target: { value: "50" } });

      // Should show validation error
      expect(
        screen.getByText(
          "End value must be greater than or equal to start value"
        )
      ).toBeInTheDocument();
    });

    it("should properly pass question range to respondent slider", () => {
      const mockOnChange = jest.fn();
      const questionRange = { start: 5, end: 95 };

      render(
        <RangeNumberAnswer value={questionRange} onChange={mockOnChange} />
      );

      // Should show the correct range bounds
      expect(screen.getByText("Available Range: 5 - 95")).toBeInTheDocument();
    });
  });
});
