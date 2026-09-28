import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import FormPagination from "../component/FormComponent/Pagination";

const mockSetSearchParams = jest.fn();
let mockSearchParams = new URLSearchParams();

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useSearchParams: () => [mockSearchParams, mockSetSearchParams],
}));

jest.mock("@heroui/react", () => ({
  Button: ({
    children,
    onPress,
    isDisabled,
    isIconOnly,
    ...props
  }: React.PropsWithChildren<{
    onPress?: () => void;
    isDisabled?: boolean;
    isIconOnly?: boolean;
    [key: string]: unknown;
  }>) => (
    <button onClick={onPress} disabled={isDisabled} {...props}>
      {children}
    </button>
  ),
  Pagination: ({
    page,
    total,
    onChange,
    classNames,
    ...props
  }: {
    page?: number;
    total?: number;
    onChange?: (page: number) => void;
    classNames?: unknown;
    [key: string]: unknown;
  }) => (
    <div data-testid="heroui-pagination" {...props}>
      <button
        onClick={() => onChange?.((page ?? 1) - 1)}
        aria-label="mock-prev-page"
      >
        MockPrev
      </button>
      <span>
        {page} of {total}
      </span>
      <button
        onClick={() => onChange?.((page ?? 1) + 1)}
        aria-label="mock-next-page"
      >
        MockNext
      </button>
    </div>
  ),
}));

describe("FormPagination Responsive Component", () => {
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;

  const setViewport = (width: number, height: number = 800) => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: width,
    });
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: height,
    });
  };

  beforeEach(() => {
    mockSearchParams = new URLSearchParams("page=1&show=5");
    mockSetSearchParams.mockClear();

    jest.spyOn(window, "requestAnimationFrame").mockImplementation((cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });
    jest.spyOn(window, "cancelAnimationFrame").mockImplementation(jest.fn());
  });

  afterEach(() => {
    setViewport(originalInnerWidth, originalInnerHeight);
    jest.restoreAllMocks();
  });

  const renderComponent = (props: Partial<Parameters<typeof FormPagination>[0]> = {}) => {
    const defaultProps = {
      total: 5,
      onPageChange: jest.fn(),
      onLimitChange: jest.fn(),
      totalCount: 25,
      currentItems: 5,
      ...props,
    };

    const renderResult = render(<FormPagination {...defaultProps} />);

    return {
      ...renderResult,
      defaultProps,
    };
  };

  test("renders navigation container with accessible label", () => {
    renderComponent();
    const nav = screen.getByRole("navigation", { name: /pagination navigation/i });
    expect(nav).toBeInTheDocument();
  });

  test("displays item count and page summary correctly", () => {
    setViewport(1200);
    renderComponent({ total: 5, totalCount: 25, currentItems: 5 });

    // Should show "Showing 1–5 of 25 forms" across desktop and mobile layouts
    expect(screen.getAllByText(/1–5/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/25/i).length).toBeGreaterThan(0);
  });

  test("disables Previous button on first page and enables Next button", () => {
    setViewport(1200);
    renderComponent({ total: 5 });

    const prevButtons = screen.getAllByRole("button", { name: /previous page/i });
    const nextButtons = screen.getAllByRole("button", { name: /next page/i });

    // All previous buttons should be disabled on page 1
    prevButtons.forEach((btn) => {
      expect(btn).toBeDisabled();
    });

    // Next buttons should not be disabled
    nextButtons.forEach((btn) => {
      expect(btn).not.toBeDisabled();
    });
  });

  test("triggers onPageChange when Next button is pressed", () => {
    setViewport(1200);
    const onPageChange = jest.fn();
    renderComponent({ total: 5, onPageChange });

    const nextButtons = screen.getAllByRole("button", { name: /next page/i });
    fireEvent.click(nextButtons[0]);

    expect(onPageChange).toHaveBeenCalledWith(2);
    expect(mockSetSearchParams).toHaveBeenCalled();
  });

  test("triggers onPageChange when Previous button is pressed from page 2", () => {
    mockSearchParams = new URLSearchParams("page=2&show=5");
    const onPageChange = jest.fn();
    renderComponent({ total: 5, page: 2, onPageChange });

    const prevButtons = screen.getAllByRole("button", { name: /previous page/i });
    fireEvent.click(prevButtons[0]);

    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  test("changes rows per page and notifies onLimitChange", () => {
    setViewport(1200);
    const onLimitChange = jest.fn();
    renderComponent({ onLimitChange });

    const selects = screen.getAllByRole("combobox", { name: /rows per page/i });
    expect(selects.length).toBeGreaterThan(0);

    fireEvent.change(selects[0], { target: { value: "10" } });
    expect(onLimitChange).toHaveBeenCalledWith(10);
  });

  test("renders ultra-compact layout on mini-mobile screens (<= 360px)", () => {
    setViewport(350, 650);
    renderComponent({ total: 8, totalCount: 40 });

    // On mini mobile, compact text "Page 1 of 8" is rendered
    expect(screen.getAllByText(/Page 1 of 8/i).length).toBeGreaterThan(0);
  });

  test("handles empty or zero items gracefully", () => {
    renderComponent({ total: 1, totalCount: 0, currentItems: 0 });

    expect(screen.getAllByText(/no forms/i).length).toBeGreaterThan(0);
  });

  test("clamps currentPage if total changes to less than currentPage", () => {
    mockSearchParams = new URLSearchParams("page=5&show=5");
    const onPageChange = jest.fn();
    const { rerender } = render(
      <FormPagination total={5} onPageChange={onPageChange} onLimitChange={jest.fn()} />,
    );

    // Re-render with total reduced to 3
    act(() => {
      rerender(
        <FormPagination total={3} onPageChange={onPageChange} onLimitChange={jest.fn()} />,
      );
    });

    expect(onPageChange).toHaveBeenCalledWith(3);
  });
});
