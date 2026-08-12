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
  testMatch: ["**/?(*.)+(spec|test).[tj]s?(x)"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  moduleNameMapper: {
    "\\.(css|less|sass|scss)$": "identity-obj-proxy",
    "^.+\\.svg$": "jest-transformer-svg",
    // Stub modules that use import.meta.env (not compatible with Jest CJS runtime)
    "^.*/hooks/APIHook/ApiHook.*$": "<rootDir>/src/_test_/__mocks__/ApiHook.ts",
    "^.*/component/Modal/AlertModal.*$": "<rootDir>/src/_test_/__mocks__/AlertModal.ts",
    "^.*/component/Response/utils/validationUtils.*$": "<rootDir>/src/_test_/__mocks__/validationUtils.ts",
  },
  // Polyfills import.meta.env at runtime for jsdom
  setupFiles: ["<rootDir>/src/_test_/jestSetup.js"],
};
