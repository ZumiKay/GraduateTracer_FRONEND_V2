import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { Provider } from "react-redux";
import { store } from "./redux/store.tsx";
import { BrowserRouter } from "react-router";
import { NextUIProvider } from "@nextui-org/react";
import { ToastContainer } from "react-toastify";
import "babel-polyfill";
import "es6-shim";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <NextUIProvider>
        <BrowserRouter>
          <ToastContainer closeButton closeOnClick />
          <App />
        </BrowserRouter>
      </NextUIProvider>
    </Provider>
  </StrictMode>
);
