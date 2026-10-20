import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

// Public site key (safe to ship). Can be overridden per environment.
const TURNSTILE_SITEKEY =
  import.meta.env.VITE_TURNSTILE_SITEKEY || "0x4AAAAAAFdchG-5x5O_Zn7J";

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

interface TurnstileRenderOptions {
  sitekey: string;
  action?: string;
  theme?: "auto" | "light" | "dark";
  size?: "normal" | "flexible" | "compact";
  callback?: (token: string) => void;
  "expired-callback"?: () => void;
  "error-callback"?: (errorCode: string) => void;
}

interface TurnstileApi {
  render: (el: HTMLElement, options: TurnstileRenderOptions) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<TurnstileApi> | null = null;

// Load Cloudflare's script once for the whole app
const loadTurnstile = (): Promise<TurnstileApi> => {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () =>
      window.turnstile ? resolve(window.turnstile) : reject(new Error("Turnstile missing"));
    script.onerror = () => {
      scriptPromise = null; // allow a retry on the next mount
      reject(new Error("Failed to load Turnstile"));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
};

export interface TurnstileHandle {
  /** Get a fresh challenge. Tokens are single-use, so call this after every submit. */
  reset: () => void;
}

interface TurnstileProps {
  /** Must match the action the backend expects for this form */
  action: string;
  /** Called with a token when solved, and with null when it expires or fails */
  onToken: (token: string | null) => void;
  /** Called with Cloudflare's error code when the widget fails */
  onError?: (errorCode: string) => void;
  className?: string;
}

const Turnstile = forwardRef<TurnstileHandle, TurnstileProps>(
  ({ action, onToken, onError, className = "" }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    // Keep the latest callback without re-rendering the widget
    const onTokenRef = useRef(onToken);
    onTokenRef.current = onToken;
    const onErrorRef = useRef(onError);
    onErrorRef.current = onError;

    useImperativeHandle(ref, () => ({
      reset: () => {
        onTokenRef.current(null);
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.reset(widgetIdRef.current);
        }
      },
    }));

    useEffect(() => {
      let cancelled = false;

      loadTurnstile()
        .then((turnstile) => {
          const el = containerRef.current;
          if (cancelled || !el) return;
          widgetIdRef.current = turnstile.render(el, {
            sitekey: TURNSTILE_SITEKEY,
            action,
            theme: "auto",
            // "flexible" fills the form width but needs 300px; very narrow
            // phones get the compact layout instead of overflowing
            size: el.clientWidth > 0 && el.clientWidth < 300 ? "compact" : "flexible",
            callback: (token) => onTokenRef.current(token),
            "expired-callback": () => onTokenRef.current(null),
            // Codes are listed at developers.cloudflare.com/turnstile/troubleshooting/client-side-errors/error-codes/
            "error-callback": (errorCode) => {
              console.warn(`[Turnstile] Widget error ${errorCode} (action: ${action})`);
              onTokenRef.current(null);
              onErrorRef.current?.(errorCode);
            },
          });
        })
        .catch((error) => {
          console.error("[Turnstile]", error);
          onErrorRef.current?.("script-load-failed");
        });

      return () => {
        cancelled = true;
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.remove(widgetIdRef.current);
        }
        widgetIdRef.current = null;
        onTokenRef.current(null);
      };
    }, [action]);

    return <div ref={containerRef} className={`w-full min-h-[65px] flex justify-center ${className}`} />;
  },
);

Turnstile.displayName = "Turnstile";

export default Turnstile;
