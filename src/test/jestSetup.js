// Mock import.meta for Jest tests
Object.defineProperty(globalThis, "import", {
  value: {
    meta: {
      env: {
        DEV: false,
        VITE_RECAPTCHA_KEY: "mock-key",
      },
    },
  },
});
