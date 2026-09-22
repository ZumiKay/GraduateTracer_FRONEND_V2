import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ApiRequest from "../../hooks/APIHook/ApiHook";
import { VITE_RECAPTCHA_KEY } from "../../config/env";

declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

export interface UseRecaptchaOptions {
  siteKey?: string;
  autoLoad?: boolean;
  removeOnUnmount?: boolean;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export interface UseRecaptchaReturn {
  /**
   * Executes reCAPTCHA and verifies the resulting token with the backend (/recaptchaverify).
   * @param action Optional action name (defaults to "submit")
   * @returns Promise<boolean> indicating whether verification succeeded
   */
  handleVerify: (action?: string) => Promise<boolean>;

  /**
   * Executes reCAPTCHA and returns the raw token without verifying with the backend.
   * Useful when sending the token directly with form submission payloads.
   * @param action Optional action name (defaults to "submit")
   * @returns Promise<string | null> the token or null if execution failed
   */
  executeRecaptcha: (action?: string) => Promise<string | null>;

  /**
   * Completely tears down reCAPTCHA scripts, badges, iframes, and global window.grecaptcha object.
   */
  removeRecaptchaScript: () => void;

  /**
   * Hides the floating reCAPTCHA v3 badge without removing the script.
   */
  hideBadge: () => void;

  /**
   * Restores the visibility of the floating reCAPTCHA v3 badge.
   */
  showBadge: () => void;

  /** Whether the reCAPTCHA script is loaded and ready to execute */
  isLoaded: boolean;

  /** Whether the reCAPTCHA script is currently being downloaded/initialized */
  isLoading: boolean;

  /** Whether an error occurred during loading or execution */
  isError: boolean;

  /** Detailed error message if isError is true, otherwise null */
  errorMessage: string | null;
}

export default function useRecaptchaButton(options?: UseRecaptchaOptions): UseRecaptchaReturn {
  const siteKey = options?.siteKey !== undefined ? options.siteKey : VITE_RECAPTCHA_KEY;
  const autoLoad = options?.autoLoad ?? true;
  const removeOnUnmount = options?.removeOnUnmount ?? true;

  const [isLoaded, setIsLoaded] = useState<boolean>(() => {
    return typeof window !== "undefined" && typeof window.grecaptcha?.execute === "function";
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    return autoLoad && !!siteKey && (typeof window === "undefined" || !window.grecaptcha);
  });
  const [isError, setIsError] = useState<boolean>(!siteKey);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    !siteKey ? "reCAPTCHA site key is not configured" : null,
  );

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const hideBadge = useCallback(() => {
    if (typeof document === "undefined") return;
    const badge = document.querySelector<HTMLElement>(".grecaptcha-badge");
    if (badge) {
      badge.style.display = "none";
    }
  }, []);

  const showBadge = useCallback(() => {
    if (typeof document === "undefined") return;
    const badge = document.querySelector<HTMLElement>(".grecaptcha-badge");
    if (badge) {
      badge.style.display = "block";
    }
  }, []);

  const removeRecaptchaScript = useCallback(() => {
    if (typeof document === "undefined") return;

    // Remove the reCAPTCHA script tag(s)
    const scripts = document.querySelectorAll('script[src*="google.com/recaptcha"]');
    scripts.forEach((script) => script.remove());

    // Remove the reCAPTCHA badge and its parent container if it's an isolated wrapper
    const badge = document.querySelector(".grecaptcha-badge");
    if (badge) {
      const parent = badge.parentElement;
      if (parent && parent !== document.body && parent.children.length === 1) {
        parent.remove();
      } else {
        badge.remove();
      }
    }

    // Remove any reCAPTCHA iframes
    const iframes = document.querySelectorAll('iframe[src*="google.com/recaptcha"]');
    iframes.forEach((iframe) => iframe.remove());

    // Clean up the global grecaptcha object
    if (typeof window !== "undefined" && window.grecaptcha) {
      delete window.grecaptcha;
    }

    if (isMountedRef.current) {
      setIsLoaded(false);
      setIsLoading(false);
    }
  }, []);

  // Poll / wait until window.grecaptcha.ready is accessible
  const waitForRecaptcha = useCallback(
    async (timeoutMs = 6000): Promise<boolean> => {
      if (typeof window === "undefined") return false;

      if (window.grecaptcha?.ready && typeof window.grecaptcha.execute === "function") {
        return new Promise<boolean>((resolve) => {
          window.grecaptcha!.ready(() => resolve(true));
        });
      }

      const startTime = Date.now();
      while (Date.now() - startTime < timeoutMs) {
        if (window.grecaptcha?.ready && typeof window.grecaptcha.execute === "function") {
          return new Promise<boolean>((resolve) => {
            window.grecaptcha!.ready(() => resolve(true));
          });
        }
        await new Promise((res) => setTimeout(res, 100));
      }

      return false;
    },
    [],
  );

  useEffect(() => {
    if (!autoLoad) return;

    if (!siteKey) {
      setIsError(true);
      setIsLoading(false);
      setErrorMessage("reCAPTCHA site key is not configured");
      return;
    }

    // Check if script already exists in the document
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src*="google.com/recaptcha"]',
    );

    if (existingScript) {
      if (window.grecaptcha?.ready && typeof window.grecaptcha.execute === "function") {
        window.grecaptcha.ready(() => {
          if (!isMountedRef.current) return;
          setIsLoaded(true);
          setIsLoading(false);
          setIsError(false);
          setErrorMessage(null);
          options?.onLoad?.();
        });
      } else {
        const handleLoad = () => {
          window.grecaptcha?.ready(() => {
            if (!isMountedRef.current) return;
            setIsLoaded(true);
            setIsLoading(false);
            setIsError(false);
            setErrorMessage(null);
            options?.onLoad?.();
          });
        };
        const handleError = () => {
          if (!isMountedRef.current) return;
          setIsError(true);
          setIsLoading(false);
          setErrorMessage("Failed to load Google reCAPTCHA script");
          options?.onError?.(new Error("Failed to load Google reCAPTCHA script"));
        };

        existingScript.addEventListener("load", handleLoad, { once: true });
        existingScript.addEventListener("error", handleError, { once: true });
      }
      return;
    }

    // Inject reCAPTCHA v3 script
    setIsLoading(true);
    const script = document.createElement("script");
    script.id = "google-recaptcha-v3";
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      window.grecaptcha?.ready(() => {
        if (!isMountedRef.current) return;
        setIsLoaded(true);
        setIsLoading(false);
        setIsError(false);
        setErrorMessage(null);
        options?.onLoad?.();
      });
    };

    script.onerror = () => {
      if (!isMountedRef.current) return;
      setIsError(true);
      setIsLoading(false);
      setErrorMessage("Failed to load Google reCAPTCHA script");
      options?.onError?.(new Error("Failed to load Google reCAPTCHA script"));
    };

    document.head.appendChild(script);

    return () => {
      if (removeOnUnmount) {
        removeRecaptchaScript();
      }
    };
  }, [siteKey, autoLoad, removeOnUnmount, removeRecaptchaScript, options]);

  const executeRecaptcha = useCallback(
    async (action = "submit"): Promise<string | null> => {
      if (!siteKey) {
        console.error("[reCAPTCHA] Site key is missing.");
        setIsError(true);
        setErrorMessage("reCAPTCHA site key is missing.");
        return null;
      }

      const isReady = await waitForRecaptcha();
      if (!isReady || !window.grecaptcha?.execute) {
        console.error("[reCAPTCHA] Service not loaded or timed out.");
        setIsError(true);
        setErrorMessage("reCAPTCHA service is not available.");
        return null;
      }

      try {
        return await new Promise<string>((resolve, reject) => {
          window.grecaptcha!.ready(async () => {
            try {
              const token = await window.grecaptcha!.execute(siteKey, { action });
              resolve(token);
            } catch (err) {
              reject(err);
            }
          });
        });
      } catch (error) {
        console.error("[reCAPTCHA] Execution failed:", error);
        setIsError(true);
        setErrorMessage(error instanceof Error ? error.message : "Execution failed");
        return null;
      }
    },
    [siteKey, waitForRecaptcha],
  );

  const handleVerify = useCallback(
    async (action = "submit"): Promise<boolean> => {
      try {
        const token = await executeRecaptcha(action);
        if (!token) return false;

        const verify = await ApiRequest({
          method: "POST",
          url: "/recaptchaverify",
          data: { token },
        });

        return !!verify.success;
      } catch (error) {
        console.error("[reCAPTCHA] Verification request failed:", error);
        return false;
      }
    },
    [executeRecaptcha],
  );

  return useMemo(
    () => ({
      handleVerify,
      executeRecaptcha,
      removeRecaptchaScript,
      hideBadge,
      showBadge,
      isLoaded,
      isLoading,
      isError,
      errorMessage,
    }),
    [
      handleVerify,
      executeRecaptcha,
      removeRecaptchaScript,
      hideBadge,
      showBadge,
      isLoaded,
      isLoading,
      isError,
      errorMessage,
    ],
  );
}
