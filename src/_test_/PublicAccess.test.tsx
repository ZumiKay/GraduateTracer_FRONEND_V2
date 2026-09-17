import { screen, fireEvent, act } from "@testing-library/react";
import AppWrapperMock, {
  componentToBeTestType,
  mockUserSession,
} from "../__mocks__/AppWrapper.mock";
import PublicFormAccess from "../component/Response/PublicFormAccess";
import useFormInitialization from "../component/Response/hooks/useFormInitialization";
import useRespondentFormPaginaition from "../component/Response/hooks/usePaginatedFormData";
import useFormsessionAPI, { setUserSwitching, isUserSwitching } from "../hooks/useFormsessionAPI";
import { useInactivityWarning } from "../hooks/useInactivityWarning";
import { ErrorToast } from "../component/Modal/AlertModal";
import SuccessToast from "../component/Modal/AlertModal";
import queryClient from "../hooks/ReactQueryClient";

/**
 * Test Cases for PublicFormAccess
 *  [x] useFormInitialization
 *    [x] navigate to /notfound if formId missing
 *    [x] loading state during initialization
 *    [x] loading state during fetch
 *  [x] useFormSessionApi()
 *    [x] respondentLogin & success toast
 *    [x] useSessionVerification expiration modal
 *    [x] signOut & user switching
 *  [x] useRespondentFormPagination (Fetch Data)
 *    [x] validation errors ("Unable to Access Form")
 *    [x] structural content errors ("Form Configuration Error")
 *  [x] useSessionManager (sessionmanagement)
 *  [x] useInactivityWarning (inactivity alert modal)
 *
 *  [x] Error Cases
 *    [x] error when fetching data (isValidationError)
 *    [x] structural errors in contentValidation
 *    [x] error when signout fails (ErrorToast)
 *    [x] error passed from useFormsessionAPI to AuthContainer
 *  [x] Success Cases
 *    [x] authenticated user renders RespondentForm
 *    [x] switch user calls signOut.mutate and cleans session state
 *    [x] form with submitonce and isResponsed renders SubmissionSuccessView
 *    [x] normal public form without required email renders RespondentForm
 *    [x] login submission from AuthContainer switches to authenticated mode
 */

const globalFormId = "uniqueglobalFormId";

// Mocks for child components
jest.mock("../component/Response/RespondentForm", () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="respondent-form">
      <span data-testid="respondent-form-title">{props.data?.formState?.title}</span>
    </div>
  ),
}));

jest.mock("../component/Response/AuthContainer", () => ({
  __esModule: true,
  AuthContainer: (props: any) => (
    <div data-testid="auth-container">
      <span data-testid="auth-title">{props.formTitle}</span>
      {props.error && <span data-testid="auth-error">{props.error}</span>}
      <button data-testid="auth-login-btn" onClick={() => props.onLogin?.()}>
        Submit Login
      </button>
    </div>
  ),
}));

jest.mock("../component/Response/components/SubmissionSuccessView", () => ({
  __esModule: true,
  SubmissionSuccessView: (props: any) => (
    <div data-testid="submission-success-view">
      <span data-testid="submission-response-id">{props.formIsResponsed?.responseId}</span>
      <button data-testid="send-copy-btn" onClick={() => props.onSendCopy?.()}>
        Send Copy
      </button>
    </div>
  ),
}));

jest.mock("../component/InactivityWarning", () => ({
  __esModule: true,
  InactivityWarning: (props: any) =>
    props.isOpen ? (
      <div data-testid="inactivity-warning">
        <h3>Session Inactivity Warning</h3>
        <p>{props.warningMessage}</p>
        <button onClick={props.onReactivate}>Continue Session</button>
      </div>
    ) : null,
}));

jest.mock("../component/Modal/AutoLogoutModal", () => ({
  __esModule: true,
  AutoLogoutModal: (props: any) =>
    props.isOpen ? (
      <div data-testid="auto-logout-modal">
        <h2>Session Expired</h2>
        <p>{props.message}</p>
        <button onClick={props.onConfirm}>Log In Again Now</button>
      </div>
    ) : null,
}));

jest.mock("@heroui/ripple", () => ({
  __esModule: true,
  Ripple: () => null,
  useRipple: () => ({
    ripples: [],
    onClear: jest.fn(),
    onPress: jest.fn(),
  }),
}));

// Mock hooks
jest.mock("../component/Response/hooks/useFormInitialization", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    isInitialized: true,
    isInitializing: false,
    sessionVerificationLoading: false,
    sessionVerificationError: null,
    sessionData: undefined,
  })),
}));

jest.mock("../component/Response/hooks/usePaginatedFormData", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    isFetching: false,
    isSuccess: true,
    formState: null,
    error: null,
    isValidationError: false,
  })),
}));

jest.mock("../hooks/useFormsessionAPI", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    respondentLogin: { mutate: jest.fn(), isPending: false },
    useSessionVerification: jest.fn(() => jest.fn()),
    signOut: { mutate: jest.fn(), isPending: false },
    error: null,
  })),
  setUserSwitching: jest.fn(),
  isUserSwitching: jest.fn(() => false),
}));

jest.mock("../hooks/useSessionManager", () => ({
  __esModule: true,
  useSessionManager: jest.fn(() => ({
    userInactive: false,
    showWarning: false,
    isSessionActive: true,
    isPageVisible: true,
    warningMessage: "",
    timeUntilAutoSignout: 60000,
    showInactivityAlert: false,
    debugInfo: {},
    handleReactivateSession: jest.fn(),
  })),
}));

jest.mock("../hooks/useInactivityWarning", () => ({
  __esModule: true,
  useInactivityWarning: jest.fn(() => ({
    showWarning: false,
    handleContinueSession: jest.fn(),
    timeUntilAutoSignout: 60000,
    warningMessage: "",
  })),
}));

describe("PublicFormAccess Testing", () => {
  //Save originallocaltion for revert
  const originalLocation = window.location;

  beforeAll(() => {
    delete (window as any).location;
    window.location = {
      ...originalLocation,
      reload: jest.fn(),
    } as any;
  });

  afterAll(() => {
    window.location = originalLocation;
  });

  beforeEach(() => {
    jest.clearAllMocks();

    (useFormInitialization as jest.Mock).mockReturnValue({
      isInitialized: true,
      isInitializing: false,
      sessionVerificationLoading: false,
      sessionVerificationError: null,
      sessionData: undefined,
    });

    (useRespondentFormPaginaition as jest.Mock).mockReturnValue({
      isFetching: false,
      isSuccess: true,
      formState: null,
      error: null,
      isValidationError: false,
    });

    (useFormsessionAPI as jest.Mock).mockReturnValue({
      respondentLogin: { mutate: jest.fn(), isPending: false },
      useSessionVerification: jest.fn(() => jest.fn()),
      signOut: { mutate: jest.fn(), isPending: false },
      error: null,
    });

    //Dashboard's loggedIn User switch account
    (isUserSwitching as unknown as jest.Mock).mockReturnValue(false);

    (useInactivityWarning as jest.Mock).mockReturnValue({
      showWarning: false,
      handleContinueSession: jest.fn(),
      timeUntilAutoSignout: 60000,
      warningMessage: "",
    });
  });

  const renderComponent = (options?: {
    initialEntries?: string[];
    initialReduxState?: Record<string, unknown>;
  }) => {
    const componentToBeTest: componentToBeTestType = {
      path: "/form-access/:formId",
      component: <PublicFormAccess />,
    };

    return AppWrapperMock({
      componentToBeTest: [componentToBeTest],
      initialEntries: options?.initialEntries || [`/form-access/${globalFormId}`],
      initialReduxState: options?.initialReduxState,
    });
  };

  describe("Loading & Initialization", () => {
    test("Should navigate to /notfound if formId is undefined", async () => {
      const componentToBeTest: componentToBeTestType = {
        path: "/form-access",
        component: <PublicFormAccess />,
      };

      AppWrapperMock({
        componentToBeTest: [componentToBeTest],
        initialEntries: ["/form-access"],
      });

      expect(await screen.findByTestId("notfound")).toBeInTheDocument();
    });

    test("Should show loading message if form is not finished initializing", () => {
      (useFormInitialization as jest.Mock).mockReturnValue({
        isInitialized: false,
        isInitializing: true,
      });

      renderComponent();
      expect(screen.getByText("Initializing form...")).toBeInTheDocument();
    });

    test("Should show loading form data message while form is fetching data", () => {
      (useFormInitialization as jest.Mock).mockReturnValue({
        isInitialized: true,
        isInitializing: false,
      });
      (useRespondentFormPaginaition as jest.Mock).mockReturnValue({
        isFetching: true,
        isSuccess: false,
        formState: null,
        error: null,
        isValidationError: false,
      });

      renderComponent();
      expect(screen.getByText("Loading form data...")).toBeInTheDocument();
    });
  });

  describe("Error Cases", () => {
    test("Should show error page with generic message when fetch data has validation error", async () => {
      (useRespondentFormPaginaition as jest.Mock).mockReturnValue({
        isFetching: false,
        isSuccess: false,
        formState: null,
        error: new Error("Unable to access this form due to invalid configuration"),
        isValidationError: true,
      });

      renderComponent();

      expect(
        await screen.findByText("Unable to Access Form", {}, { timeout: 2000 }),
      ).toBeInTheDocument();
      expect(
        screen.getAllByText("Unable to access this form due to invalid configuration")[0],
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Go Back/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Reload Page/i })).toBeInTheDocument();
    });

    test("Should show error page with configuration issues when form content has structural validation errors", async () => {
      (useRespondentFormPaginaition as jest.Mock).mockReturnValue({
        isFetching: false,
        isSuccess: false,
        formState: {
          contentValidation: {
            isValid: false,
            errors: [
              {
                page: 1,
                qIdx: 0,
                message: { message: "Choice cannot be empty" },
              },
              {
                page: 2,
                qIdx: 3,
                message: { message: "Question title is required" },
              },
            ],
          },
        },
        error: new Error("Structural validation failed"),
        isValidationError: true,
      });

      renderComponent();

      expect(
        await screen.findByText("Form Configuration Error", {}, { timeout: 2000 }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "This form contains structural errors or missing configurations that prevent it from being displayed.",
        ),
      ).toBeInTheDocument();
      expect(screen.getByText("Validation Issues Detected")).toBeInTheDocument();
      expect(screen.getByText("2 Issues")).toBeInTheDocument();
      expect(screen.getByText("Page 1")).toBeInTheDocument();
      expect(screen.getByText("Q0")).toBeInTheDocument();
      expect(screen.getByText("Choice cannot be empty")).toBeInTheDocument();
      expect(screen.getByText("Page 2")).toBeInTheDocument();
      expect(screen.getByText("Q3")).toBeInTheDocument();
      expect(screen.getByText("Question title is required")).toBeInTheDocument();
    });

    test("Should trigger reload when clicking Reload Page button on error page", async () => {
      (useRespondentFormPaginaition as jest.Mock).mockReturnValue({
        isFetching: false,
        isSuccess: false,
        formState: null,
        error: new Error("Error loading form"),
        isValidationError: true,
      });

      renderComponent();

      const reloadButton = await screen.findByRole(
        "button",
        { name: /Reload Page/i },
        { timeout: 2000 },
      );
      fireEvent.click(reloadButton);

      expect(window.location.reload).toHaveBeenCalled();
    });

    test("Should show ErrorToast and set user switching to false when signOut fails during switch user", async () => {
      const mockSignOutMutate = jest.fn((_formId, options) => {
        options?.onError?.(new Error("Network disconnect"));
      });

      (useFormsessionAPI as jest.Mock).mockReturnValue({
        respondentLogin: { mutate: jest.fn(), isPending: false },
        useSessionVerification: jest.fn(() => jest.fn()),
        signOut: { mutate: mockSignOutMutate, isPending: false },
        error: null,
      });

      (useRespondentFormPaginaition as jest.Mock).mockReturnValue({
        isFetching: false,
        isSuccess: true,
        formState: {
          title: "Active Form",
          isAuthenticated: true,
          setting: { email: true },
        },
        error: null,
        isValidationError: false,
      });

      renderComponent();

      const switchButton = await screen.findByRole(
        "button",
        { name: /Switch user/i },
        { timeout: 2000 },
      );

      fireEvent.click(switchButton);

      expect(setUserSwitching).toHaveBeenCalledWith(true);
      expect(mockSignOutMutate).toHaveBeenCalledWith(
        globalFormId,
        expect.objectContaining({
          onSuccess: expect.any(Function),
          onError: expect.any(Function),
        }),
      );
      expect(setUserSwitching).toHaveBeenCalledWith(false);
      expect(ErrorToast).toHaveBeenCalledWith({
        toastid: "switchusererror",
        title: "Error",
        content: "Can't logout. Please try again.",
      });
    });

    test("Should pass error from useFormsessionAPI to AuthContainer when unauthenticated", async () => {
      (useFormsessionAPI as jest.Mock).mockReturnValue({
        respondentLogin: { mutate: jest.fn(), isPending: false },
        useSessionVerification: jest.fn(() => jest.fn()),
        signOut: { mutate: jest.fn(), isPending: false },
        error: "Invalid session or credentials",
      });

      (useRespondentFormPaginaition as jest.Mock).mockReturnValue({
        isFetching: false,
        isSuccess: true,
        formState: {
          title: "Login Required Survey",
          isAuthenticated: false,
          setting: { email: true },
        },
        error: null,
        isValidationError: false,
      });

      renderComponent();

      expect(
        await screen.findByTestId("auth-container", {}, { timeout: 2000 }),
      ).toBeInTheDocument();
      expect(screen.getByTestId("auth-error")).toHaveTextContent("Invalid session or credentials");
      expect(screen.getByTestId("auth-title")).toHaveTextContent("Login Required Survey");
    });
  });

  describe("Success Cases", () => {
    test("Should render RespondentForm and Switch user button when user is authenticated with email setting", async () => {
      (useRespondentFormPaginaition as jest.Mock).mockReturnValue({
        isFetching: false,
        isSuccess: true,
        formState: {
          title: "Graduate Tracer 2026",
          isAuthenticated: true,
          setting: { email: true },
        },
        error: null,
        isValidationError: false,
      });

      renderComponent();

      expect(
        await screen.findByTestId("respondent-form", {}, { timeout: 2000 }),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Switch user/i })).toBeInTheDocument();
      expect(screen.getByTestId("respondent-form-title")).toHaveTextContent("Graduate Tracer 2026");
    });

    test("Should render RespondentForm without switch user button for normal public form (setting.email: false)", async () => {
      (useRespondentFormPaginaition as jest.Mock).mockReturnValue({
        isFetching: false,
        isSuccess: true,
        formState: {
          title: "Open Public Form",
          isAuthenticated: false,
          setting: { email: false },
        },
        error: null,
        isValidationError: false,
      });

      renderComponent();

      expect(
        await screen.findByTestId("respondent-form", {}, { timeout: 2000 }),
      ).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /Switch user/i })).not.toBeInTheDocument();
    });

    test("Should render SubmissionSuccessView when form is submitonce and user has already responded", async () => {
      (useRespondentFormPaginaition as jest.Mock).mockReturnValue({
        isFetching: false,
        isSuccess: true,
        formState: {
          title: "Single Response Survey",
          isAuthenticated: true,
          setting: { submitonce: true, email: true },
          isResponsed: {
            responseId: "resp-xyz-789",
            respondentEmail: "graduate@example.com",
          },
        },
        error: null,
        isValidationError: false,
      });

      renderComponent();

      expect(
        await screen.findByTestId("submission-success-view", {}, { timeout: 2000 }),
      ).toBeInTheDocument();
      expect(screen.getByTestId("submission-response-id")).toHaveTextContent("resp-xyz-789");
      expect(screen.queryByTestId("respondent-form")).not.toBeInTheDocument();
    });

    test("Should allow user to trigger sendResponseCopy from SubmissionSuccessView", async () => {
      (useRespondentFormPaginaition as jest.Mock).mockReturnValue({
        isFetching: false,
        isSuccess: true,
        formState: {
          title: "Single Response Survey",
          isAuthenticated: true,
          setting: { submitonce: true, email: true },
          isResponsed: {
            responseId: "resp-xyz-789",
            respondentEmail: "graduate@example.com",
          },
        },
        error: null,
        isValidationError: false,
      });

      renderComponent();

      const sendCopyBtn = await screen.findByTestId("send-copy-btn", {}, { timeout: 2000 });
      expect(sendCopyBtn).toBeInTheDocument();
      fireEvent.click(sendCopyBtn);
    });

    test("Should render AuthContainer when user is not authenticated and form requires email login", async () => {
      (useRespondentFormPaginaition as jest.Mock).mockReturnValue({
        isFetching: false,
        isSuccess: true,
        formState: {
          title: "Member Only Survey",
          isAuthenticated: false,
          setting: { email: true },
        },
        error: null,
        isValidationError: false,
      });

      renderComponent();

      expect(
        await screen.findByTestId("auth-container", {}, { timeout: 2000 }),
      ).toBeInTheDocument();
      expect(screen.getByTestId("auth-title")).toHaveTextContent("Member Only Survey");
      expect(screen.queryByTestId("respondent-form")).not.toBeInTheDocument();
    });

    test("Should successfully handle switch user: invoke signOut.mutate, remove queries, and transition state", async () => {
      const removeQueriesSpy = jest.spyOn(queryClient, "removeQueries");
      const mockSignOutMutate = jest.fn((_formId, options) => {
        options?.onSuccess?.();
      });

      (useFormsessionAPI as jest.Mock).mockReturnValue({
        respondentLogin: { mutate: jest.fn(), isPending: false },
        useSessionVerification: jest.fn(() => jest.fn()),
        signOut: { mutate: mockSignOutMutate, isPending: false },
        error: null,
      });

      (useRespondentFormPaginaition as jest.Mock).mockReturnValue({
        isFetching: false,
        isSuccess: true,
        formState: {
          title: "Active Form",
          isAuthenticated: true,
          setting: { email: true },
        },
        error: null,
        isValidationError: false,
      });

      renderComponent({
        initialReduxState: { usersession: mockUserSession },
      });

      const switchButton = await screen.findByRole(
        "button",
        { name: /Switch user/i },
        { timeout: 2000 },
      );

      fireEvent.click(switchButton);

      expect(setUserSwitching).toHaveBeenCalledWith(true);
      expect(mockSignOutMutate).toHaveBeenCalledWith(
        globalFormId,
        expect.objectContaining({
          onSuccess: expect.any(Function),
          onError: expect.any(Function),
        }),
      );
      expect(removeQueriesSpy).toHaveBeenCalledWith({
        queryKey: ["respondent-form", globalFormId],
      });
      expect(setUserSwitching).toHaveBeenCalledWith(false);
    });

    test("Should handle login submission from AuthContainer and display success toast", async () => {
      const mockLoginMutate = jest.fn((_variables, options) => {
        options?.onSuccess?.({
          data: { expiresAt: "2026-12-31T23:59:59.000Z" },
        });
      });

      (useFormsessionAPI as jest.Mock).mockReturnValue({
        respondentLogin: { mutate: mockLoginMutate, isPending: false },
        useSessionVerification: jest.fn(() => jest.fn()),
        signOut: { mutate: jest.fn(), isPending: false },
        error: null,
      });

      (useRespondentFormPaginaition as jest.Mock).mockReturnValue({
        isFetching: false,
        isSuccess: true,
        formState: {
          title: "Protected Survey",
          isAuthenticated: false,
          setting: { email: true },
        },
        error: null,
        isValidationError: false,
      });

      renderComponent();

      const loginBtn = await screen.findByTestId("auth-login-btn", {}, { timeout: 2000 });
      fireEvent.click(loginBtn);

      expect(mockLoginMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          formId: globalFormId,
        }),
        expect.objectContaining({
          onSuccess: expect.any(Function),
        }),
      );

      expect(SuccessToast).toHaveBeenCalledWith({
        toastid: "Respondent LoggedIn",
        title: "Success",
        content: "Logged in",
      });
    });

    test("Should show InactivityWarning modal when inactivity warning triggers and hide Switch user button", async () => {
      (useInactivityWarning as jest.Mock).mockReturnValue({
        showWarning: true,
        handleContinueSession: jest.fn(),
        timeUntilAutoSignout: 30000,
        warningMessage: "You have been inactive for a while.",
      });

      (useRespondentFormPaginaition as jest.Mock).mockReturnValue({
        isFetching: false,
        isSuccess: true,
        formState: {
          title: "Survey Title",
          isAuthenticated: true,
          setting: { email: true },
        },
        error: null,
        isValidationError: false,
      });

      renderComponent();

      expect(
        await screen.findByText("Session Inactivity Warning", {}, { timeout: 2000 }),
      ).toBeInTheDocument();
      expect(screen.getByText("You have been inactive for a while.")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /Switch user/i })).not.toBeInTheDocument();
    });

    test("Should show AutoLogoutModal when session expires via useSessionVerification callback", async () => {
      let triggerSessionExpired: () => void = () => {};

      (useFormsessionAPI as jest.Mock).mockReturnValue({
        respondentLogin: { mutate: jest.fn(), isPending: false },
        useSessionVerification: jest.fn((_formId, onExpired) => {
          triggerSessionExpired = onExpired;
          return jest.fn();
        }),
        signOut: { mutate: jest.fn(), isPending: false },
        error: null,
      });

      (useRespondentFormPaginaition as jest.Mock).mockReturnValue({
        isFetching: false,
        isSuccess: true,
        formState: {
          title: "Survey Title",
          isAuthenticated: true,
          setting: { email: true },
        },
        error: null,
        isValidationError: false,
      });

      renderComponent();

      expect(
        await screen.findByTestId("respondent-form", {}, { timeout: 2000 }),
      ).toBeInTheDocument();

      act(() => {
        triggerSessionExpired();
      });

      expect(await screen.findByText("Session Expired")).toBeInTheDocument();
      expect(screen.getByText(/Your session for "this form" has expired/i)).toBeInTheDocument();

      const loginAgainBtn = screen.getByRole("button", {
        name: /Log In Again Now/i,
      });
      fireEvent.click(loginAgainBtn);
      expect(window.location.reload).toHaveBeenCalled();
    });
  });
});
