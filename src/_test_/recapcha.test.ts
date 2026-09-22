import { renderHook, act } from "@testing-library/react";
import useRecaptchaButton from "../component/FormComponent/recapcha";
import ApiRequest from "../hooks/APIHook/ApiHook";

jest.mock("../hooks/APIHook/ApiHook", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockApiRequest = ApiRequest as jest.Mock;

describe("useRecaptchaButton Hook", () => {
  const originalGrecaptcha = window.grecaptcha;

  beforeEach(() => {
    jest.clearAllMocks();
    document.head.innerHTML = "";
    document.body.innerHTML = "";
    delete (window as { grecaptcha?: unknown }).grecaptcha;
  });

  afterEach(() => {
    (window as { grecaptcha?: unknown }).grecaptcha = originalGrecaptcha;
    document.head.innerHTML = "";
    document.body.innerHTML = "";
  });

  it("should inject script when autoLoad is true and siteKey is provided", () => {
    const { result } = renderHook(() =>
      useRecaptchaButton({ siteKey: "test-site-key", autoLoad: true, removeOnUnmount: false }),
    );

    const script = document.querySelector<HTMLScriptElement>('script[src*="google.com/recaptcha"]');
    expect(script).not.toBeNull();
    expect(script?.src).toContain("render=test-site-key");
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isError).toBe(false);
  });

  it("should handle missing siteKey gracefully", () => {
    const { result } = renderHook(() =>
      useRecaptchaButton({ siteKey: "", autoLoad: true, removeOnUnmount: false }),
    );

    const script = document.querySelector('script[src*="google.com/recaptcha"]');
    expect(script).toBeNull();
    expect(result.current.isError).toBe(true);
    expect(result.current.errorMessage).toContain("not configured");
  });

  it("should not inject duplicate scripts if already present in DOM", () => {
    const existing = document.createElement("script");
    existing.src = "https://www.google.com/recaptcha/api.js?render=existing-key";
    document.head.appendChild(existing);

    renderHook(() =>
      useRecaptchaButton({ siteKey: "new-key", autoLoad: true, removeOnUnmount: false }),
    );

    const scripts = document.querySelectorAll('script[src*="google.com/recaptcha"]');
    expect(scripts.length).toBe(1);
  });

  it("should update isLoaded when grecaptcha finishes loading", async () => {
    const { result } = renderHook(() =>
      useRecaptchaButton({ siteKey: "test-key", autoLoad: true, removeOnUnmount: false }),
    );

    const script = document.querySelector<HTMLScriptElement>('script[src*="google.com/recaptcha"]');
    expect(script).not.toBeNull();

    // Mock window.grecaptcha
    window.grecaptcha = {
      ready: (cb: () => void) => cb(),
      execute: jest.fn().mockResolvedValue("mock-token"),
    };

    act(() => {
      if (script?.onload) {
        (script.onload as () => void)();
      }
    });

    expect(result.current.isLoaded).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it("should execute recaptcha and return token", async () => {
    window.grecaptcha = {
      ready: (cb: () => void) => cb(),
      execute: jest.fn().mockResolvedValue("mock-token-xyz"),
    };

    const { result } = renderHook(() =>
      useRecaptchaButton({ siteKey: "test-key", autoLoad: false, removeOnUnmount: false }),
    );

    let token: string | null = null;
    await act(async () => {
      token = await result.current.executeRecaptcha("login");
    });

    expect(token).toBe("mock-token-xyz");
    expect(window.grecaptcha.execute).toHaveBeenCalledWith("test-key", { action: "login" });
  });

  it("should handleVerify successfully when backend returns success: true", async () => {
    window.grecaptcha = {
      ready: (cb: () => void) => cb(),
      execute: jest.fn().mockResolvedValue("valid-token"),
    };

    mockApiRequest.mockResolvedValueOnce({
      success: true,
      data: { score: 0.9 },
    });

    const { result } = renderHook(() =>
      useRecaptchaButton({ siteKey: "test-key", autoLoad: false, removeOnUnmount: false }),
    );

    let verified = false;
    await act(async () => {
      verified = await result.current.handleVerify("submit");
    });

    expect(verified).toBe(true);
    expect(mockApiRequest).toHaveBeenCalledWith({
      method: "POST",
      url: "/recaptchaverify",
      data: { token: "valid-token" },
    });
  });

  it("should handleVerify fail when backend returns success: false", async () => {
    window.grecaptcha = {
      ready: (cb: () => void) => cb(),
      execute: jest.fn().mockResolvedValue("bot-token"),
    };

    mockApiRequest.mockResolvedValueOnce({
      success: false,
      error: "Verification failed",
    });

    const { result } = renderHook(() =>
      useRecaptchaButton({ siteKey: "test-key", autoLoad: false, removeOnUnmount: false }),
    );

    let verified = true;
    await act(async () => {
      verified = await result.current.handleVerify();
    });

    expect(verified).toBe(false);
  });

  it("should remove all recaptcha elements on removeRecaptchaScript", () => {
    // Create dummy elements
    const script = document.createElement("script");
    script.src = "https://www.google.com/recaptcha/api.js";
    document.body.appendChild(script);

    const badge = document.createElement("div");
    badge.className = "grecaptcha-badge";
    document.body.appendChild(badge);

    const iframe = document.createElement("iframe");
    iframe.src = "https://www.google.com/recaptcha/api2/bframe";
    document.body.appendChild(iframe);

    window.grecaptcha = {
      ready: jest.fn(),
      execute: jest.fn(),
    };

    const { result } = renderHook(() =>
      useRecaptchaButton({ siteKey: "test-key", autoLoad: false, removeOnUnmount: false }),
    );

    act(() => {
      result.current.removeRecaptchaScript();
    });

    expect(document.querySelector('script[src*="google.com/recaptcha"]')).toBeNull();
    expect(document.querySelector(".grecaptcha-badge")).toBeNull();
    expect(document.querySelector('iframe[src*="google.com/recaptcha"]')).toBeNull();
    expect(window.grecaptcha).toBeUndefined();
    expect(result.current.isLoaded).toBe(false);
  });

  it("should hide and show badge properly", () => {
    const badge = document.createElement("div");
    badge.className = "grecaptcha-badge";
    document.body.appendChild(badge);

    const { result } = renderHook(() =>
      useRecaptchaButton({ siteKey: "test-key", autoLoad: false, removeOnUnmount: false }),
    );

    act(() => {
      result.current.hideBadge();
    });
    expect(badge.style.display).toBe("none");

    act(() => {
      result.current.showBadge();
    });
    expect(badge.style.display).toBe("block");
  });
});
