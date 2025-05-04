export default {
  testEnvironment: "jsdom",
  collectCoverage: true,
  coverageDirectory: "coverage",
  collectCoverageFrom: ["src/**/*.{js,jsx,ts,tsx}"],
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/__tests__/"
  ],
  coverageReporters: ["text", "lcov"],
  transform: {
    "^.+\\.jsx?$": "babel-jest",
    "^.+\\.tsx?$": "ts-jest",
    "\\.(css|less)$": "identity-obj-proxy"
  },
  moduleNameMapper: {
    "^react-bkoi-gl/test(.*)$": "<rootDir>/test$1",
    "^react-bkoi-gl(.*)$": "<rootDir>/src$1",
  },
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"], 
  setupFilesAfterEnv: ["<rootDir>/test/setup.js"],
};
