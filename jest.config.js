/** @type {import('ts-jest').JestConfigWithTsJest} **/
export default {
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "./tsconfig.jest.json",
        diagnostics: {
          warnOnly: true,
          ignoreCodes: [1343, 2339],
        },
      },
    ],
  },
  setupFilesAfterEnv: ["<rootDir>/src/_test_/setupTests.tsx"],
  roots: ["<rootDir>/src"],
  testMatch: [
    "**/__tests__/**/*.[jt]s?(x)",
    "**/_test_/**/*.[jt]s?(x)",
    "**/?(*.)+(spec|test).[jt]s?(x)",
  ],
  testPathIgnorePatterns: [
    "/node_modules/",
    "<rootDir>/src/_test_/setupTests.tsx",
    "<rootDir>/src/_test_/jestSetup.js",
    "<rootDir>/src/_test_/__mocks__/",
  ],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  moduleNameMapper: {
    "\\.(css|less|sass|scss)$": "<rootDir>/src/_test_/__mocks__/styleMock.js",
    "^.+\\.svg$": "jest-transformer-svg",
    // Stub modules that use import.meta.env (not compatible with Jest CJS runtime)
    "^.*APIHook/ApiHook.*$": "<rootDir>/src/_test_/__mocks__/ApiHook.ts",
    "^.*AlertModal.*$": "<rootDir>/src/_test_/__mocks__/AlertModal.ts",
    "^.*/component/Response/utils/validationUtils.*$": "<rootDir>/src/_test_/__mocks__/validationUtils.ts",
  },
  // Polyfills import.meta.env at runtime for jsdom
  setupFiles: ["<rootDir>/src/_test_/jestSetup.js"],
};
