import { renderHook, act } from "@testing-library/react";
import { useScreenType, DEFAULT_BREAKPOINTS } from "../hooks/useScreenSize";

describe("useScreenSize / useScreenType Hook", () => {
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;

  const setViewport = (width: number, height: number) => {
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

  test("should identify compact/mini mobile screens (<= 360px)", () => {
    setViewport(360, 800);
    const { result } = renderHook(() => useScreenType());

    expect(result.current.isMiniMobile).toBe(true);
    expect(result.current.isMobile).toBe(true);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(false);
    expect(result.current.screenType).toBe("miniMobile");
    expect(result.current.width).toBe(360);
    expect(result.current.height).toBe(800);
    expect(result.current.isPortrait).toBe(true);
    expect(result.current.isLandscape).toBe(false);
  });

  test("should identify standard mobile screens (361px to 767px)", () => {
    setViewport(390, 844);
    const { result } = renderHook(() => useScreenType());

    expect(result.current.isMiniMobile).toBe(false);
    expect(result.current.isMobile).toBe(true);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(false);
    expect(result.current.screenType).toBe("mobile");
    expect(result.current.width).toBe(390);
  });

  test("should identify tablet screens (768px to 1023px)", () => {
    setViewport(768, 1024);
    const { result } = renderHook(() => useScreenType());

    expect(result.current.isMiniMobile).toBe(false);
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(true);
    expect(result.current.isDesktop).toBe(false);
    expect(result.current.screenType).toBe("tablet");
    expect(result.current.width).toBe(768);
  });

  test("should identify desktop screens (>= 1024px)", () => {
    setViewport(1440, 900);
    const { result } = renderHook(() => useScreenType());

    expect(result.current.isMiniMobile).toBe(false);
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(true);
    expect(result.current.screenType).toBe("desktop");
    expect(result.current.isLandscape).toBe(true);
    expect(result.current.isPortrait).toBe(false);
  });

  test("should update state on window resize event", () => {
    setViewport(1440, 900);
    const { result } = renderHook(() => useScreenType());
    expect(result.current.isDesktop).toBe(true);

    act(() => {
      setViewport(375, 667);
      window.dispatchEvent(new Event("resize"));
    });

    expect(result.current.isMobile).toBe(true);
    expect(result.current.isDesktop).toBe(false);
    expect(result.current.screenType).toBe("mobile");
    expect(result.current.width).toBe(375);
  });

  test("should update state on orientationchange event", () => {
    setViewport(800, 400); // Landscape phone
    const { result } = renderHook(() => useScreenType());

    expect(result.current.isLandscape).toBe(true);

    act(() => {
      setViewport(400, 800); // Rotated to portrait
      window.dispatchEvent(new Event("orientationchange"));
    });

    expect(result.current.isPortrait).toBe(true);
    expect(result.current.isLandscape).toBe(false);
  });

  test("should provide both nested and direct properties", () => {
    setViewport(1024, 768);
    const { result } = renderHook(() => useScreenType());

    // Direct access
    expect(result.current.isDesktop).toBe(true);
    // Nested backward-compatible access
    expect(result.current.screenState.isDesktop).toBe(true);
    expect(result.current.screenState.width).toBe(1024);
  });

  test("should clean up event listeners on unmount", () => {
    const removeEventListenerSpy = jest.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useScreenType());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith("resize", expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith("orientationchange", expect.any(Function));
  });

  test("should support custom breakpoints", () => {
    setViewport(600, 800);
    const { result } = renderHook(() =>
      useScreenType({ mobile: 500, tablet: 900 }),
    );

    // 600px is >= custom mobile (500) and < custom tablet (900)
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(true);
  });

  test("should export correct DEFAULT_BREAKPOINTS", () => {
    expect(DEFAULT_BREAKPOINTS).toEqual({
      miniMobile: 360,
      mobile: 768,
      tablet: 1024,
      desktop: 1440,
    });
  });
});
