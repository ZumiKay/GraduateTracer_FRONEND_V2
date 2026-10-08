import { useEffect, useState } from "react";

type ScreenType = "miniMobile" | "mobile" | "tablet" | "desktop";

interface ScreenStateType {
  isMiniMobile: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenType: ScreenType;
  width: number;
  height: number;
  isPortrait: boolean;
  isLandscape: boolean;
}

export interface ScreenBreakpoints {
  miniMobile: number;
  mobile: number;
  tablet: number;
  desktop: number;
}

/**
 * Standard responsive breakpoints (in pixels):
 * - miniMobile: <= 360px (compact / small budget phones)
 * - mobile: < 768px (all smartphones)
 * - tablet: >= 768px && < 1024px (tablets / iPads)
 * - desktop: >= 1024px (laptops and desktops)
 */
export const DEFAULT_BREAKPOINTS: ScreenBreakpoints = {
  miniMobile: 360,
  mobile: 768,
  tablet: 1024,
  desktop: 1440,
};

const calculateScreenState = (
  breakpoints: ScreenBreakpoints = DEFAULT_BREAKPOINTS,
): ScreenStateType => {
  if (typeof window === "undefined") {
    return {
      isMiniMobile: false,
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      screenType: "desktop",
      width: 1440,
      height: 900,
      isPortrait: false,
      isLandscape: true,
    };
  }

  const width = window.innerWidth;
  const height = window.innerHeight;

  const isMiniMobile = width <= breakpoints.miniMobile;
  const isMobile = width < breakpoints.mobile;
  const isTablet = width >= breakpoints.mobile && width < breakpoints.tablet;
  const isDesktop = width >= breakpoints.tablet;

  const screenType: ScreenType = isMiniMobile
    ? "miniMobile"
    : isMobile
      ? "mobile"
      : isTablet
        ? "tablet"
        : "desktop";

  return {
    isMiniMobile,
    isMobile,
    isTablet,
    isDesktop,
    screenType,
    width,
    height,
    isPortrait: height >= width,
    isLandscape: width > height,
  };
};

export interface UseScreenSizeReturn extends ScreenStateType {
  screenState: ScreenStateType;
}

export const useScreenType = (
  customBreakpoints?: Partial<ScreenBreakpoints>,
): UseScreenSizeReturn => {
  const breakpoints = customBreakpoints
    ? { ...DEFAULT_BREAKPOINTS, ...customBreakpoints }
    : DEFAULT_BREAKPOINTS;

  const [screenState, setScreenState] = useState<ScreenStateType>(() =>
    calculateScreenState(breakpoints),
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    //Ensure the animation is smooth
    let rafId: number | null = null;

    const handleResize = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }

      rafId = requestAnimationFrame(() => {
        setScreenState((prev) => {
          const next = calculateScreenState(breakpoints);
          if (
            prev.width === next.width &&
            prev.height === next.height &&
            prev.screenType === next.screenType
          ) {
            return prev;
          }
          return next;
        });
      });
    };

    // Synchronize immediately on mount
    handleResize();

    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("orientationchange", handleResize, { passive: true });

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, [breakpoints.miniMobile, breakpoints.mobile, breakpoints.tablet, breakpoints.desktop]);

  return {
    screenState,
    ...screenState,
  };
};

