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

function App() {
  const { pathname } = useLocation();
  const redux = useSelector((selector: RootState) => selector.openmodal);
  const dispatch = useDispatch();

  useEffect(() => {
    if (typeof setImmediate === "undefined") {
      window.setImmediate = ((callback: never, { ...args }) =>
        setTimeout(callback, 0, ...(args as never))) as never;
    }
  }, []);

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
      <main className="w-full min-h-screen h-full bg-white dark:bg-black flex flex-col items-center">
        {pathname !== "/" && <NavigationBar />}
        <Routes>
          <Route index element={<AuthenticationPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/form/:id" element={<FormPage />} />
        </Routes>
      </main>
    </>
  );
}

export default App;
