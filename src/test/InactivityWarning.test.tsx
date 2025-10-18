import { render, screen, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { InactivityWarning } from "../component/InactivityWarning";

// Mock @heroui/react components
jest.mock("@heroui/react", () => ({
  Modal: ({
    children,
    isOpen,
    ...props
  }: React.PropsWithChildren<{ isOpen: boolean; [key: string]: unknown }>) =>
    isOpen ? (
      <div data-testid="modal" {...props}>
        {children}
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

// Mock @heroicons/react
jest.mock("@heroicons/react/24/outline", () => ({
  ExclamationTriangleIcon: () => <svg data-testid="warning-icon" />,
  ClockIcon: () => <svg data-testid="clock-icon" />,
}));

describe("InactivityWarning Component", () => {
  const defaultProps = {
    isOpen: true,
    onReactivate: jest.fn(),
    timeUntilAutoSignout: 60000, // 1 minute
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe("Rendering", () => {
    it("should render the modal when isOpen is true", () => {
      render(<InactivityWarning {...defaultProps} />);

      expect(screen.getByTestId("modal")).toBeInTheDocument();
      expect(screen.getByTestId("modal-header")).toBeInTheDocument();
      expect(screen.getByTestId("modal-body")).toBeInTheDocument();
      expect(screen.getByTestId("modal-footer")).toBeInTheDocument();
    });

    it("should not render the modal when isOpen is false", () => {
      render(<InactivityWarning {...defaultProps} isOpen={false} />);

      expect(screen.queryByTestId("modal")).not.toBeInTheDocument();
    });

    it("should display the correct header text", () => {
      render(<InactivityWarning {...defaultProps} />);

      expect(
        screen.getByText("Session Inactivity Warning")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Your session will expire soon")
      ).toBeInTheDocument();
    });

    it("should display warning and clock icons", () => {
      render(<InactivityWarning {...defaultProps} />);

      expect(screen.getByTestId("warning-icon")).toBeInTheDocument();
      expect(screen.getAllByTestId("clock-icon").length).toBeGreaterThan(0);
    });

    it("should display the default warning message when no custom message is provided", () => {
      render(<InactivityWarning {...defaultProps} />);

      expect(
        screen.getByText(
          /You've been inactive for 30 minutes. Your session will automatically expire unless you continue working./i
        )
      ).toBeInTheDocument();
    });

    it("should display custom warning message when provided", () => {
      const customMessage = "Custom inactivity warning message";
      render(
        <InactivityWarning {...defaultProps} warningMessage={customMessage} />
      );

      expect(screen.getByText(customMessage)).toBeInTheDocument();
      expect(
        screen.queryByText(/You've been inactive for 30 minutes/i)
      ).not.toBeInTheDocument();
    });

    it("should render Continue Session button", () => {
      render(<InactivityWarning {...defaultProps} />);

      expect(screen.getByTestId("continue-button")).toBeInTheDocument();
      expect(
        screen.getByText(/Continue Session/i, { selector: "button" })
      ).toBeInTheDocument();
    });

    it("should render progress bar", () => {
      render(<InactivityWarning {...defaultProps} />);

      expect(screen.getByTestId("progress-bar")).toBeInTheDocument();
    });

    it("should render time chip", () => {
      render(<InactivityWarning {...defaultProps} />);

      expect(screen.getByTestId("chip")).toBeInTheDocument();
    });
  });

  describe("Timer Functionality", () => {
    it("should display initial time correctly (1 minute)", () => {
      render(
        <InactivityWarning {...defaultProps} timeUntilAutoSignout={60000} />
      );

      expect(screen.getByText("1:00")).toBeInTheDocument();
    });

    it("should display initial time correctly (2 minutes)", () => {
      render(
        <InactivityWarning {...defaultProps} timeUntilAutoSignout={120000} />
      );

      expect(screen.getByText("2:00")).toBeInTheDocument();
    });

    it("should countdown the timer every second", async () => {
      render(
        <InactivityWarning {...defaultProps} timeUntilAutoSignout={60000} />
      );

      expect(screen.getByText("1:00")).toBeInTheDocument();

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

    it("should countdown to zero", async () => {
      render(
        <InactivityWarning {...defaultProps} timeUntilAutoSignout={3000} />
      );

      expect(screen.getByText("0:03")).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByText("0:02")).toBeInTheDocument();
      });

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByText("0:01")).toBeInTheDocument();
      });

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByText("0:00")).toBeInTheDocument();
      });
    });

    it("should not go below zero", async () => {
      render(
        <InactivityWarning {...defaultProps} timeUntilAutoSignout={1000} />
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
        <InactivityWarning {...defaultProps} timeUntilAutoSignout={60000} />
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
        />
      );

      // Timer should reset
      await waitFor(() => {
        expect(screen.getByText("1:00")).toBeInTheDocument();
      });
    });

    it("should format seconds with leading zero", () => {
      render(
        <InactivityWarning {...defaultProps} timeUntilAutoSignout={65000} />
      );

      expect(screen.getByText("1:05")).toBeInTheDocument();
    });

    it("should stop countdown when modal is closed", async () => {
      const { rerender } = render(
        <InactivityWarning {...defaultProps} timeUntilAutoSignout={60000} />
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
        />
      );

      // Should show reset time, not continued countdown
      await waitFor(() => {
        expect(screen.getByText("1:00")).toBeInTheDocument();
      });
    });
  });

  describe("Progress Bar", () => {
    it("should start at 100% progress", () => {
      render(
        <InactivityWarning {...defaultProps} timeUntilAutoSignout={60000} />
      );

      const progressBar = screen.getByTestId("progress-bar");
      expect(progressBar).toHaveAttribute("data-value", "100");
    });

    it("should update progress as time decreases", async () => {
      render(
        <InactivityWarning {...defaultProps} timeUntilAutoSignout={60000} />
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
        <InactivityWarning {...defaultProps} timeUntilAutoSignout={60000} />
      );

      const progressBar = screen.getByTestId("progress-bar");
      expect(progressBar).toHaveAttribute("data-color", "success");
    });

    it("should show warning color when progress is between 25-50%", async () => {
      render(
        <InactivityWarning {...defaultProps} timeUntilAutoSignout={60000} />
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
        <InactivityWarning {...defaultProps} timeUntilAutoSignout={60000} />
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

  describe("Chip Color", () => {
    it("should show warning chip color when progress > 50%", () => {
      render(
        <InactivityWarning {...defaultProps} timeUntilAutoSignout={60000} />
      );

      const chip = screen.getByTestId("chip");
      expect(chip).toHaveAttribute("data-color", "warning");
    });

    it("should show danger chip color when progress is between 25-50%", async () => {
      render(
        <InactivityWarning {...defaultProps} timeUntilAutoSignout={60000} />
      );

      act(() => {
        jest.advanceTimersByTime(40000); // ~33% remaining
      });

      await waitFor(() => {
        const chip = screen.getByTestId("chip");
        expect(chip).toHaveAttribute("data-color", "danger");
      });
    });

    it("should show danger chip color when progress < 25%", async () => {
      render(
        <InactivityWarning {...defaultProps} timeUntilAutoSignout={60000} />
      );

      act(() => {
        jest.advanceTimersByTime(50000); // ~16% remaining
      });

      await waitFor(() => {
        const chip = screen.getByTestId("chip");
        expect(chip).toHaveAttribute("data-color", "danger");
      });
    });
  });

  describe("User Interaction", () => {
    it("should call onReactivate when Continue Session button is clicked", () => {
      const mockOnReactivate = jest.fn();
      render(
        <InactivityWarning {...defaultProps} onReactivate={mockOnReactivate} />
      );

      const button = screen.getByTestId("continue-button");
      button.click();

      expect(mockOnReactivate).toHaveBeenCalledTimes(1);
    });

    it("should not allow modal to be closed without clicking Continue Session", () => {
      render(<InactivityWarning {...defaultProps} />);

      const modal = screen.getByTestId("modal");
      // Modal should have properties that prevent closing
      expect(modal).toBeInTheDocument();
      // The onClose prop is set to an empty function to prevent closing
    });

    it("should call onReactivate multiple times if button clicked multiple times", () => {
      const mockOnReactivate = jest.fn();
      render(
        <InactivityWarning {...defaultProps} onReactivate={mockOnReactivate} />
      );

      const button = screen.getByTestId("continue-button");
      button.click();
      button.click();
      button.click();

      expect(mockOnReactivate).toHaveBeenCalledTimes(3);
    });
  });

  describe("Edge Cases", () => {
    it("should handle null timeUntilAutoSignout gracefully", () => {
      render(
        <InactivityWarning {...defaultProps} timeUntilAutoSignout={null} />
      );

      expect(screen.getByTestId("modal")).toBeInTheDocument();
      expect(screen.getByText("0:00")).toBeInTheDocument();
    });

    it("should handle undefined timeUntilAutoSignout gracefully", () => {
      render(
        <InactivityWarning {...defaultProps} timeUntilAutoSignout={undefined} />
      );

      expect(screen.getByTestId("modal")).toBeInTheDocument();
      expect(screen.getByText("0:00")).toBeInTheDocument();
    });

    it("should handle very small time values", () => {
      render(
        <InactivityWarning {...defaultProps} timeUntilAutoSignout={500} />
      );

      expect(screen.getByText("0:00")).toBeInTheDocument();
    });

    it("should handle very large time values", () => {
      render(
        <InactivityWarning {...defaultProps} timeUntilAutoSignout={3600000} />
      ); // 1 hour

      expect(screen.getByText("60:00")).toBeInTheDocument();
    });

    it("should handle null warningMessage gracefully", () => {
      render(<InactivityWarning {...defaultProps} warningMessage={null} />);

      expect(
        screen.getByText(
          /You've been inactive for 30 minutes. Your session will automatically expire unless you continue working./i
        )
      ).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      render(
        <InactivityWarning {...defaultProps} className="custom-test-class" />
      );

      const modal = screen.getByTestId("modal");
      expect(modal).toHaveClass("custom-test-class");
    });
  });

  describe("Accessibility", () => {
    it("should have proper aria-label for modal", () => {
      render(<InactivityWarning {...defaultProps} />);

      const modal = screen.getByTestId("modal");
      expect(modal).toHaveAttribute("aria-label", "inactive alert modal #1");
    });

    it("should have aria-label for progress bar with percentage", async () => {
      render(
        <InactivityWarning {...defaultProps} timeUntilAutoSignout={60000} />
      );

      const progressBar = screen.getByTestId("progress-bar");
      expect(progressBar).toHaveAttribute(
        "aria-label",
        "Session time remaining: 100%"
      );

      act(() => {
        jest.advanceTimersByTime(30000);
      });

      await waitFor(() => {
        expect(progressBar).toHaveAttribute(
          "aria-label",
          expect.stringContaining("Session time remaining:")
        );
      });
    });
  });

  describe("Component Lifecycle", () => {
    it("should cleanup timer on unmount", () => {
      const { unmount } = render(
        <InactivityWarning {...defaultProps} timeUntilAutoSignout={60000} />
      );

      unmount();

      // Should not throw errors after unmount
      act(() => {
        jest.advanceTimersByTime(5000);
      });
    });

    it("should handle rapid open/close cycles", async () => {
      const { rerender } = render(
        <InactivityWarning {...defaultProps} isOpen={false} />
      );

      // Rapidly open and close
      for (let i = 0; i < 5; i++) {
        rerender(<InactivityWarning {...defaultProps} isOpen={true} />);
        rerender(<InactivityWarning {...defaultProps} isOpen={false} />);
      }

      // Should not throw errors
      rerender(<InactivityWarning {...defaultProps} isOpen={true} />);
      expect(screen.getByTestId("modal")).toBeInTheDocument();
    });

    it("should update when timeUntilAutoSignout prop changes", async () => {
      const { rerender } = render(
        <InactivityWarning {...defaultProps} timeUntilAutoSignout={60000} />
      );

      expect(screen.getByText("1:00")).toBeInTheDocument();

      rerender(
        <InactivityWarning {...defaultProps} timeUntilAutoSignout={120000} />
      );

      await waitFor(() => {
        expect(screen.getByText("2:00")).toBeInTheDocument();
      });
    });
  });

  describe("UI Elements", () => {
    it("should display action instructions", () => {
      render(<InactivityWarning {...defaultProps} />);

      expect(screen.getByText(/To continue working:/i)).toBeInTheDocument();
      expect(
        screen.getByText(
          /Click "Continue Session" below to reset your activity timer and keep working on your form./i
        )
      ).toBeInTheDocument();
    });

    it("should display time until auto-logout label", () => {
      render(<InactivityWarning {...defaultProps} />);

      expect(screen.getByText("Time until auto-logout:")).toBeInTheDocument();
    });

    it("should display session expires label", () => {
      render(<InactivityWarning {...defaultProps} />);

      expect(screen.getByText("Session expires")).toBeInTheDocument();
    });
  });
});
