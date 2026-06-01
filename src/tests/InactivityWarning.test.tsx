import { render, screen, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { InactivityWarning } from "../component/InactivityWarning";

/* ------------------------- Mock heroui components ------------------------- */

jest.mock("@heroui/react", () => ({
  Modal: ({
    children,
    isOpen,
    ...props
  }: Record<string, unknown | boolean | React.ReactNode>) =>
    isOpen ? (
      <div data-testid="modal" {...props}>
        {children as React.ReactNode}
      </div>
    ) : null,
  ModalContent: ({
    children,
  }: {
    children:
      | ((props: Record<string, unknown>) => React.ReactNode)
      | React.ReactNode;
  }) => (
    <div data-testid="modal-content">
      {typeof children === "function" ? children({}) : children}
    </div>
  ),
  ModalHeader: ({
    children,
    className,
  }: React.PropsWithChildren<{ className?: string }>) => (
    <div data-testid="modal-header" className={className}>
      {children}
    </div>
  ),
  ModalBody: ({
    children,
    className,
  }: React.PropsWithChildren<{ className?: string }>) => (
    <div data-testid="modal-body" className={className}>
      {children}
    </div>
  ),
  ModalFooter: ({
    children,
    className,
  }: React.PropsWithChildren<{ className?: string }>) => (
    <div data-testid="modal-footer" className={className}>
      {children}
    </div>
  ),
  Button: ({
    children,
    onPress,
    ...props
  }: React.PropsWithChildren<{
    onPress?: () => void;
    startContent?: unknown;
    [key: string]: unknown;
  }>) => (
    <button onClick={onPress} data-testid="continue-button" {...props}>
      {children}
    </button>
  ),
  Progress: ({
    value,
    color,
    ...props
  }: {
    value?: number;
    color?: string;
    showValueLabel?: unknown;
    [key: string]: unknown;
  }) => (
    <div
      data-testid="progress-bar"
      data-value={value}
      data-color={color}
      {...props}
    />
  ),
  Card: ({
    children,
    className,
  }: React.PropsWithChildren<{ className?: string }>) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  ),
  CardBody: ({
    children,
    className,
  }: React.PropsWithChildren<{ className?: string }>) => (
    <div data-testid="card-body" className={className}>
      {children}
    </div>
  ),
  Chip: ({
    children,
    color,
    ...props
  }: React.PropsWithChildren<{ color?: string; [key: string]: unknown }>) => (
    <span data-testid="chip" data-color={color} {...props}>
      {children}
    </span>
  ),
}));

/* ------------------------------- Mock Icons ------------------------------- */

jest.mock("@heroicons/react/24/outline", () => ({
  ExclamationTriangleIcon: () => <svg data-testid="warning-icon" />,
  ClockIcon: () => <svg data-testid="clock-icon" />,
}));

/* ---------------------------------- Tests --------------------------------- */

describe("InactivityWarning Component", () => {
  const defaultProps = {
    isOpen: true,
    onReactivate: jest.fn(),
    timeUntilAutoSignout: 60000, // 1 minute
  };

  //Reset Mocks
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  //Simulate browser timer
  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  //Make sure it render all required
  describe("Rendering", () => {
    it("should not render the modal when isOpen is false", () => {
      render(<InactivityWarning {...defaultProps} isOpen={false} />);

      expect(screen.queryByTestId("modal")).not.toBeInTheDocument();
    });

    it("should display the correct header text", () => {
      render(<InactivityWarning {...defaultProps} />);

      expect(
        screen.getByText("Session Inactivity Warning"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Your session will expire soon"),
      ).toBeInTheDocument();
    });

    it("should display the default warning message when no custom message is provided", () => {
      render(<InactivityWarning {...defaultProps} />);

      expect(
        screen.getByText(
          /You've been inactive for 30 minutes. Your session will automatically expire unless you continue working./i,
        ),
      ).toBeInTheDocument();
    });

    it("should display custom warning message when provided", () => {
      const customMessage = "Custom inactivity warning message";
      render(
        <InactivityWarning {...defaultProps} warningMessage={customMessage} />,
      );

      expect(screen.getByText(customMessage)).toBeInTheDocument();
      expect(
        screen.queryByText(/You've been inactive for 30 minutes/i),
      ).not.toBeInTheDocument();
    });

    it("should render Continue Session button", () => {
      render(<InactivityWarning {...defaultProps} />);

      expect(screen.getByTestId("continue-button")).toBeInTheDocument();
      expect(
        screen.getByText(/Continue Session/i, { selector: "button" }),
      ).toBeInTheDocument();
    });

    it("should render progress bar", () => {
      render(<InactivityWarning {...defaultProps} />);

      expect(screen.getByTestId("progress-bar")).toBeInTheDocument();
    });
  });

  describe("Timer Functionality", () => {
    it("should display initial time correctly (1 minute)", () => {
      render(
        <InactivityWarning {...defaultProps} timeUntilAutoSignout={60000} />,
      );

      expect(screen.getByText("1:00")).toBeInTheDocument();
    });

    it("should countdown the timer every second", async () => {
      render(
        <InactivityWarning {...defaultProps} timeUntilAutoSignout={60000} />,
      );

      expect(screen.getByText("1:00")).toBeInTheDocument();

      //Simulate timer to advance by 1000ms === 1s
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByText("0:59")).toBeInTheDocument();
      });

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByText("0:58")).toBeInTheDocument();
      });
    });

    it("should not go below zero", async () => {
      render(
        <InactivityWarning {...defaultProps} timeUntilAutoSignout={1000} />,
      );

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(screen.getByText("0:00")).toBeInTheDocument();
      });
    });

    it("should reset timer when modal reopens", async () => {
      const { rerender } = render(
        <InactivityWarning {...defaultProps} timeUntilAutoSignout={60000} />,
      );

      // Advance timer
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      await waitFor(() => {
        expect(screen.getByText("0:55")).toBeInTheDocument();
      });

      // Close and reopen modal
      rerender(<InactivityWarning {...defaultProps} isOpen={false} />);
      rerender(
        <InactivityWarning
          {...defaultProps}
          isOpen={true}
          timeUntilAutoSignout={60000}
        />,
      );

      // Timer should reset
      await waitFor(() => {
        expect(screen.getByText("1:00")).toBeInTheDocument();
      });
    });

    it("should format seconds with leading zero", () => {
      render(
        <InactivityWarning {...defaultProps} timeUntilAutoSignout={65000} />,
      );

      expect(screen.getByText("1:05")).toBeInTheDocument();
    });

    it("should stop countdown when modal is closed", async () => {
      const { rerender } = render(
        <InactivityWarning {...defaultProps} timeUntilAutoSignout={60000} />,
      );

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      await waitFor(() => {
        expect(screen.getByText("0:55")).toBeInTheDocument();
      });

      // Close modal
      rerender(<InactivityWarning {...defaultProps} isOpen={false} />);

      // Advance time more
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      // Timer should not have continued
      rerender(
        <InactivityWarning
          {...defaultProps}
          isOpen={true}
          timeUntilAutoSignout={60000}
        />,
      );

      // Should show reset time, not continued countdown
      await waitFor(() => {
        expect(screen.getByText("1:00")).toBeInTheDocument();
      });
    });
  });

  describe("Progress Bar", () => {
    it("should update progress as time decreases", async () => {
      render(
        <InactivityWarning {...defaultProps} timeUntilAutoSignout={60000} />,
      );

      act(() => {
        jest.advanceTimersByTime(30000); // 50% time elapsed
      });

      await waitFor(() => {
        const progressBar = screen.getByTestId("progress-bar");
        const value = parseFloat(progressBar.getAttribute("data-value") || "0");
        expect(value).toBeCloseTo(50, 0);
      });
    });

    it("should show success color when progress > 50%", () => {
      render(
        <InactivityWarning {...defaultProps} timeUntilAutoSignout={60000} />,
      );

      const progressBar = screen.getByTestId("progress-bar");
      expect(progressBar).toHaveAttribute("data-color", "success");
    });

    it("should show warning color when progress is between 25-50%", async () => {
      render(
        <InactivityWarning {...defaultProps} timeUntilAutoSignout={60000} />,
      );

      act(() => {
        jest.advanceTimersByTime(40000); // ~33% remaining
      });

      await waitFor(() => {
        const progressBar = screen.getByTestId("progress-bar");
        expect(progressBar).toHaveAttribute("data-color", "warning");
      });
    });

    it("should show danger color when progress < 25%", async () => {
      render(
        <InactivityWarning {...defaultProps} timeUntilAutoSignout={60000} />,
      );

      act(() => {
        jest.advanceTimersByTime(50000); // ~16% remaining
      });

      await waitFor(() => {
        const progressBar = screen.getByTestId("progress-bar");
        expect(progressBar).toHaveAttribute("data-color", "danger");
      });
    });

    it("should display percentage remaining text", () => {
      render(<InactivityWarning {...defaultProps} />);

      expect(screen.getByText(/100% remaining/i)).toBeInTheDocument();
    });
  });

  describe("User Interaction", () => {
    it("should call onReactivate when Continue Session button is clicked", () => {
      const mockOnReactivate = jest.fn();
      render(
        <InactivityWarning {...defaultProps} onReactivate={mockOnReactivate} />,
      );

      const button = screen.getByTestId("continue-button");
      button.click();

      expect(mockOnReactivate).toHaveBeenCalledTimes(1);
    });
  });

  describe("Edge Cases", () => {
    it("should handle null timeUntilAutoSignout", () => {
      render(
        <InactivityWarning {...defaultProps} timeUntilAutoSignout={null} />,
      );

      expect(screen.getByTestId("modal")).toBeInTheDocument();
      expect(screen.getByText("0:00")).toBeInTheDocument();
    });

    it("should handle undefined timeUntilAutoSignout", () => {
      render(
        <InactivityWarning
          {...defaultProps}
          timeUntilAutoSignout={undefined}
        />,
      );

      expect(screen.getByTestId("modal")).toBeInTheDocument();
      expect(screen.getByText("0:00")).toBeInTheDocument();
    });

    it("should handle very large time values", () => {
      render(
        <InactivityWarning {...defaultProps} timeUntilAutoSignout={3600000} />,
      ); // 1 hour

      expect(screen.getByText("60:00")).toBeInTheDocument();
    });
  });
});
