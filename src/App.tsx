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
import { useEffect } from "react";

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

  useEffect(() => {
    console.log({ redux });
  }, [redux]);

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
        {pathname !== "/" && <NavigationBar />}
        <Routes>
          <Route element={<PublichRoute />}>
            <Route index element={<AuthenticationPage />} />
          </Route>

          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/form/:id" element={<FormPage />} />
          </Route>

          {/* Not Found  */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </>
  );
}

export default App;
