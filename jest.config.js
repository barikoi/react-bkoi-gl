export default {
  testEnvironment: "jsdom",
  collectCoverage: true,
  coverageDirectory: "coverage",
  collectCoverageFrom: ["src/**/*.{js,jsx,ts,tsx}", "!src/**/*.test.{js,jsx,ts,tsx}"],
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/__tests__/",
    "/dist/",
  ],
  coverageReporters: ["text", "lcov", "html"],
  transform: {
    "^.+\\.jsx?$": "babel-jest",
    "^.+\\.tsx?$": "ts-jest"
  },
  transformIgnorePatterns: [
    "/node_modules/(?!(@?tape-promise|testing-library/jest-dom))"
  ],
  moduleNameMapper: {
    "^react-bkoi-gl/test(.*)$": "<rootDir>/__tests__$1",
    "^react-bkoi-gl(.*)$": "<rootDir>/src$1",
    "\\.(css|less)$": "identity-obj-proxy",
    "^@vis.gl/react-maplibre$": "<rootDir>/__tests__/mocks/react-maplibre.js",
    "^@vis.gl/react-maplibre/(.*)$": "<rootDir>/__tests__/mocks/$1.js",
    "^maplibre-gl$": "<rootDir>/__tests__/mocks/maplibre-gl.js",
    "^bkoi-gl$": "<rootDir>/__tests__/mocks/maplibre-gl.js"
  },
  testMatch: [
    "<rootDir>/__tests__/**/*.{spec,test}.{js,jsx,ts,tsx}",
    "<rootDir>/__tests__/**/*test*.{js,jsx,ts,tsx}"
  ],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"], 
  setupFilesAfterEnv: ["<rootDir>/__tests__/setup.js"],
  testPathIgnorePatterns: [
    "/node_modules/"
  ],
  testTimeout: 30000,
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  globals: {
    "ts-jest": {
      useESM: true,
    }
  }
};
