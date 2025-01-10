/** @type {import('ts-jest').JestConfigWithTsJest} **/
export default {
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.tsx?$": "ts-jest", // Process TypeScript and JSX
  },
  setupFilesAfterEnv: ["<rootDir>/src/test/setupTests.tsx"],
  testMatch: ["**/?(*.)+(spec|test).[tj]s?(x)"], // Match test files
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"], // Supported file extensions
  moduleNameMapper: {
    "\\.(css|less|sass|scss)$": "identity-obj-proxy",
    "^.+\\.svg$": "jest-transformer-svg",
  },
};
