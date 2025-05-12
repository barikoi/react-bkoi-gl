// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/configuration

/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "jsdom",
  collectCoverage: true,
  coverageDirectory: "coverage",
  collectCoverageFrom: [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/**/index.{js,ts}",
    "!src/types/**/*.{ts,tsx}",
    "!src/exports-maplibre-gl.ts",
  ],
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/__tests__/",
    "/dist/",
  ],
  coverageReporters: ["text", "lcov", "html"],
  transform: {
    "^.+\\.(js|jsx|ts|tsx|cjs)$": [
      "babel-jest",
      {
        presets: [
          ["@babel/preset-env", { targets: { node: "current" } }],
          "@babel/preset-typescript",
          ["@babel/preset-react", { runtime: "automatic" }]
        ],
        plugins: [
          ["@babel/plugin-transform-modules-commonjs", { allowTopLevelThis: true }]
        ]
      }
    ]
  },
  transformIgnorePatterns: [
    "/node_modules/(?!(@?tape-promise|@testing-library/jest-dom))"
  ],
  moduleNameMapper: {
    "^react-bkoi-gl/test(.*)$": "<rootDir>/__tests__$1",
    "^react-bkoi-gl(.*)$": "<rootDir>/src$1",
    "\\.(css|less)$": "identity-obj-proxy",
    "^(maplibre-gl|bkoi-gl)$": "<rootDir>/__tests__/mocks/maplibre-gl.js"
  },
  testMatch: [
    "<rootDir>/__tests__/**/*test*.{js,jsx,ts,tsx,cjs}"
  ],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node", "cjs"],
  setupFilesAfterEnv: ["<rootDir>/__tests__/setup.js"],
  testPathIgnorePatterns: [
    "/node_modules/"
  ],
  testTimeout: 10000,
  globals: {}
}; 