import { Route, Routes, useLocation } from "react-router";
import "./App.css";
import AuthenticationPage from "./pages/Authentication";
import Dashboard from "./pages/Dashboard";
import NavigationBar from "./component/nav/Navigationbar";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "./redux/store";
import SettingModal from "./component/Modal/Setting.modal";
import OpenModal from "./redux/openmodal";
import FormPage from "./pages/FormPage";
import UserResponsesPage from "./pages/UserResponsesPage";
import { useEffect } from "react";
import PublicFormAccess from "./component/Response/PublicFormAccess";
import CookieConsent from "./component/Cookie/CookieConsent";
import Footer from "./component/Cookie/Footer";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";

import { ConfirmModal } from "./component/Modal/AlertModal";
import { AsyncGetUser } from "./redux/user.store";
import PrivateRoute, { PublichRoute } from "./route/PrivateRoute";
import NotFound from "./pages/NotFound";

function App() {
  const { pathname } = useLocation();
  const redux = useSelector((selector: RootState) => selector.openmodal);

  const dispatch = useDispatch();

  useEffect(() => {
    //check user session
    dispatch(AsyncGetUser() as never);
  }, [dispatch]);

  return (
    <>
      {/* Modal Setting */}
      {redux.setting && (
        <SettingModal
          open={redux.setting}
          onClose={() =>
            dispatch(
              OpenModal.actions.setopenmodal({ state: "setting", value: false })
            )
          }
        />
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
        {pathname !== "/" &&
          pathname !== "/form-access" &&
          !pathname.startsWith("/form-access/") && <NavigationBar />}
        <Routes>
          <Route element={<PublichRoute />}>
            <Route index element={<AuthenticationPage />} />
          </Route>

          {/* Public Form Access Routes */}

          <Route
            path="/form-access/:formId/:token"
            element={<PublicFormAccess />}
          />

          {/* Privacy Policy - Public Route */}
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />

          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/form/:id" element={<FormPage />} />
            <Route path="/my-responses" element={<UserResponsesPage />} />
          </Route>

          {/* Not Found  */}
          <Route path="*" element={<NotFound />} />
        </Routes>

        {/* Add Footer for most pages */}
        {pathname !== "/" &&
          pathname !== "/form-access" &&
          !pathname.startsWith("/form-access/") &&
          pathname !== "/privacy-policy" && <Footer />}
      </main>

      {/* Cookie Consent Banner */}
      <CookieConsent />
    </>
  );
}

export default App;
