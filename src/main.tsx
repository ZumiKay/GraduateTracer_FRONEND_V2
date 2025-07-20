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
import { QueryClientProvider } from "@tanstack/react-query";
import queryClient from "./hooks/ReactQueryClient.tsx";

// Import test utilities in development mode
if (import.meta.env.DEV) {
  import("./utils/testFormAccess.ts");
  import("./utils/testSecurity.ts");
  import("./utils/debugFormAccess.ts");
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <HeroUIProvider>
          <BrowserRouter>
            <ToastContainer closeButton closeOnClick />
            <App />
          </BrowserRouter>
        </HeroUIProvider>
      </Provider>
    </QueryClientProvider>
  </StrictMode>
);
