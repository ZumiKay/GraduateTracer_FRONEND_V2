// Mock import.meta for Jest tests
Object.defineProperty(globalThis, "import", {
  value: {
    meta: {
      env: {
        DEV: false,
        VITE_RECAPTCHA_KEY: "mock-recaptcha-key",
        VITE_API_URL: "http://localhost:3000",
        VITE_APP_TITLE: "Test App",
        VITE_REACT_ENV: "test",
        VITE_APP_URL: "http://localhost:5173",
        VITE_ENV: "TEST",
      },
    },
  },
});
