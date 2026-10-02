import { Route, Routes, useLocation } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "./redux/store";
import OpenModal from "./redux/openmodal";
import { useEffect, lazy, Suspense, memo, useMemo, useState } from "react";
import { ConfirmModal } from "./component/Modal/AlertModal";
import { setUser, logout } from "./redux/user.store";
import PrivateRoute, { PublichRoute } from "./route/PrivateRoute";
import ReplaceSessionPage from "./pages/ReplaceSession";
import { useUserSession } from "./hooks/useUserSession";
import { AppLoading, PageLoading } from "./component/Loading/AppLoading";
import { AutoLogoutModal } from "./component/Modal/AutoLogoutModal";
import {
  getStoredUserSession,
  clearStoredUserSession,
  isStoredSessionExpired,
} from "./utils/userSessionStorage";
import ErrorBoundary from "./component/ErrorBoundary";
const AuthenticationPage = lazy(() => import("./pages/Authentication"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const FilledFormPage = lazy(() => import("./pages/FilledFormPage"));
const NavigationBar = lazy(() => import("./component/Navigator/Navigationbar"));
const SettingModal = lazy(() => import("./component/Modal/Setting.modal"));
const FormPage = lazy(() => import("./pages/FormPage"));
const UserResponsesPage = lazy(() => import("./pages/UserResponsesPage"));
const ViewResponsePage = lazy(() => import("./pages/ViewResponsePage"));
const PublicFormAccess = lazy(
  () => import("./component/Response/PublicFormAccess"),
);
const CookieConsent = lazy(() => import("./component/Cookie/CookieConsent"));
const Footer = lazy(() => import("./component/Cookie/Footer"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const CollaboratorConfirmPage = lazy(
  () => import("./pages/CollaboratorConfirmPage"),
);
const OwnershipConfirmPage = lazy(() => import("./pages/OwnershipConfirmPage"));

const App = memo(() => {
  const { pathname } = useLocation();
  const redux = useSelector((selector: RootState) => selector.openmodal);
  const dispatch = useDispatch();
  const isPublicRoute = useMemo(
    () =>
      pathname === "/" ||
      pathname === "/form-access" ||
      pathname.startsWith("/form-access/") ||
      pathname === "/notfound" ||
      pathname.includes("/response/session/replace"),

    [pathname],
  );

  const {
    data: sessionData,
    isFetching,
    isLoading,
  } = useUserSession({ enabled: !isPublicRoute });

  const shouldShowNavigation = useMemo(
    () =>
      pathname !== "/" &&
      pathname !== "/form-access" &&
      !pathname.startsWith("/form-access/"),
    [pathname],
  );

  const shouldShowFooter = useMemo(
    () =>
      pathname !== "/" &&
      pathname !== "/form-access" &&
      !pathname.startsWith("/form-access/") &&
      pathname !== "/privacy-policy",
    [pathname],
  );

  const [showAutoLogoutModal, setShowAutoLogoutModal] = useState(() => {
    if (typeof window === "undefined") return false;
    return !isPublicRoute && isStoredSessionExpired();
  });

  // Only show modal on route change / refresh if an existing session in frontend state has expired
  useEffect(() => {
    if (!isPublicRoute && isStoredSessionExpired()) {
      setShowAutoLogoutModal(true);
    }
  }, [isPublicRoute]);

  useEffect(() => {
    const handleSessionExpired = () => {
      if (!isPublicRoute) {
        const stored = getStoredUserSession();
        const hasSession = Boolean(
          stored?.user && (stored?.isAuthenticated || stored?.expiresAt),
        );
        if (hasSession && isStoredSessionExpired()) {
          setShowAutoLogoutModal(true);
        }
      }
    };

    window.addEventListener("app:session-expired", handleSessionExpired);
    return () => {
      window.removeEventListener("app:session-expired", handleSessionExpired);
    };
  }, [isPublicRoute]);

  const handleModalLogout = () => {
    clearStoredUserSession();
    dispatch(logout());
    setShowAutoLogoutModal(false);
    window.location.href = "/";
  };

  useEffect(() => {
    if (sessionData && !isFetching) {
      if (sessionData.isAuthenticated && sessionData.user) {
        dispatch(
          setUser({
            user: sessionData.user,
            isAuthenticated: sessionData.isAuthenticated,
            expiresAt: sessionData.expiresAt,
          }),
        );
      } else if (!isStoredSessionExpired()) {
        dispatch(
          setUser({
            user: null,
            isAuthenticated: false,
          }),
        );
      }
    }
  }, [dispatch, isFetching, sessionData]);

  if (isLoading) {
    return <AppLoading />;
  }

  return (
    <Suspense fallback={<AppLoading />}>
      <AutoLogoutModal
        isOpen={showAutoLogoutModal}
        onConfirm={handleModalLogout}
        reason="expired"
      />

      {/* Modal */}
      {redux.setting && (
        <Suspense fallback={null}>
          <SettingModal
            open={redux.setting}
            onClose={() =>
              dispatch(
                OpenModal.actions.setopenmodal({
                  state: "setting",
                  value: false,
                }),
              )
            }
          />
        </Suspense>
      )}

      {redux.confirm.open && (
        <ConfirmModal
          open={redux.confirm.open}
          onClose={() =>
            dispatch(
              OpenModal.actions.setopenmodal({
                state: "confirm",
                value: { open: false },
              }),
            )
          }
        />
      )}

      <main className="w-full min-h-screen min-h-[100dvh] h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-stretch">
        {shouldShowNavigation && (
          <ErrorBoundary>
            <Suspense
              fallback={
                <div className="h-[70px] w-full bg-gray-100 animate-pulse" />
              }
            >
              <NavigationBar />
            </Suspense>
          </ErrorBoundary>
        )}

        <ErrorBoundary>
          <Suspense fallback={<PageLoading />}>
            <Routes>
            <Route element={<PublichRoute />}>
              <Route index element={<AuthenticationPage />} />
            </Route>

            {/* Public Form Access Routes */}
            <Route path="/form-access/:formId" element={<PublicFormAccess />} />

            {/* Privacy Policy - Public Route */}
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />

            {/* Session Removal Route */}
            <Route
              path="/response/session/replace/:formId/:code"
              element={<ReplaceSessionPage />}
            />

            {/* Collaborator Confirmation Route */}
            <Route element={<PrivateRoute />}>
              <Route
                path="/collaborator/confirm"
                element={<CollaboratorConfirmPage />}
              />
            </Route>

            {/* Ownership Transfer Confirmation Route */}
            <Route element={<PrivateRoute />}>
              <Route
                path="/ownership/confirm"
                element={<OwnershipConfirmPage />}
              />
            </Route>

            <Route element={<PrivateRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/form/:id" element={<FormPage />} />
              <Route path="/my-responses" element={<UserResponsesPage />} />
              <Route path="/filled-form/:formId" element={<FilledFormPage />} />
              <Route
                path="/filled-form/:formId/:responseId"
                element={<FilledFormPage />}
              />
              <Route
                path="/response/:formId/:responseId"
                element={<ViewResponsePage />}
              />
            </Route>

            {/* Not Found  */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>

        {/* Add Footer for most pages */}
        {shouldShowFooter && (
          <Suspense fallback={null}>
            <Footer />
          </Suspense>
        )}
      </main>

      {/* Cookie Consent Banner */}
      <Suspense fallback={null}>
        <CookieConsent />
      </Suspense>
    </Suspense>
  );
});

App.displayName = "App";

export default App;
