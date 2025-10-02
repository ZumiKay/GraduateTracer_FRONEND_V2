import { Route, Routes, useLocation } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "./redux/store";
import OpenModal from "./redux/openmodal";
import { useEffect, lazy, Suspense, memo, useMemo } from "react";
import { ConfirmModal } from "./component/Modal/AlertModal";
import { AsyncGetUser } from "./redux/user.store";
import PrivateRoute, { PublichRoute } from "./route/PrivateRoute";

const AuthenticationPage = lazy(() => import("./pages/Authentication"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const FilledFormPage = lazy(() => import("./pages/FilledFormPage"));
const NavigationBar = lazy(() => import("./component/nav/Navigationbar"));
const SettingModal = lazy(() => import("./component/Modal/Setting.modal"));
const FormPage = lazy(() => import("./pages/FormPage"));
const UserResponsesPage = lazy(() => import("./pages/UserResponsesPage"));
const PublicFormAccess = lazy(
  () => import("./component/Response/PublicFormAccess")
);
const CookieConsent = lazy(() => import("./component/Cookie/CookieConsent"));
const Footer = lazy(() => import("./component/Cookie/Footer"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const LoadingSpinner = memo(() => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
));

const PageLoadingFallback = memo(() => (
  <div className="flex items-center justify-center h-48">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
));

const App = memo(() => {
  const { pathname } = useLocation();
  const redux = useSelector((selector: RootState) => selector.openmodal);
  const dispatch = useDispatch();

  // Memoize pathname checks for performance
  const shouldShowNavigation = useMemo(
    () =>
      pathname !== "/" &&
      pathname !== "/form-access" &&
      !pathname.startsWith("/form-access/"),
    [pathname]
  );

  const shouldShowFooter = useMemo(
    () =>
      pathname !== "/" &&
      pathname !== "/form-access" &&
      !pathname.startsWith("/form-access/") &&
      pathname !== "/privacy-policy",
    [pathname]
  );

  useEffect(() => {
    // Check user session
    dispatch(AsyncGetUser() as never);
  }, [dispatch]);

  return (
    <Suspense fallback={<LoadingSpinner />}>
      {/* Modal Setting */}
      {redux.setting && (
        <Suspense fallback={null}>
          <SettingModal
            open={redux.setting}
            onClose={() =>
              dispatch(
                OpenModal.actions.setopenmodal({
                  state: "setting",
                  value: false,
                })
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
              })
            )
          }
        />
      )}

      <main className="w-full min-h-screen h-full bg-white dark:bg-black flex flex-col items-center">
        {shouldShowNavigation && (
          <Suspense
            fallback={
              <div className="h-[70px] w-full bg-gray-100 animate-pulse" />
            }
          >
            <NavigationBar />
          </Suspense>
        )}

        <Suspense fallback={<PageLoadingFallback />}>
          <Routes>
            <Route element={<PublichRoute />}>
              <Route index element={<AuthenticationPage />} />
            </Route>

            {/* Public Form Access Routes */}
            <Route path="/form-access/:formId" element={<PublicFormAccess />} />

            {/* Privacy Policy - Public Route */}
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />

            <Route element={<PrivateRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/form/:id" element={<FormPage />} />
              <Route path="/my-responses" element={<UserResponsesPage />} />
              <Route path="/filled-form/:formId" element={<FilledFormPage />} />
              <Route
                path="/filled-form/:formId/:responseId"
                element={<FilledFormPage />}
              />
            </Route>

            {/* Not Found  */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>

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
