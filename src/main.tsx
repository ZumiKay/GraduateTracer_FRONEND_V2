import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { Provider } from "react-redux";
import { store } from "./redux/store.tsx";
import { BrowserRouter } from "react-router";
import { HeroUIProvider } from "@heroui/react";
import { ToastContainer } from "react-toastify";
import "babel-polyfill";
import "es6-shim";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <HeroUIProvider>
        <BrowserRouter>
          <ToastContainer closeButton closeOnClick />
          <App />
        </BrowserRouter>
      </HeroUIProvider>
    </Provider>
  </StrictMode>
);
