import { resolve } from "path";

export default {
  lint: {
    paths: ["src", "__tests__", "examples"],
  },

  typescript: {
    project: "tsconfig.build.json",
  },

  aliases: {
    "react-map-gl/__tests__": resolve("./__tests__"),
    "react-map-gl": resolve("./src"),
  },
  nodeAliases: {
    "react-dom": resolve("./__tests__/src/utils/react-dom-mock.js"),
  },

  browserTest: {
    server: { wait: 5000 },
  },

  entry: {
    test: "__tests__/node.js",
    "test-browser": "__tests__/browser.js",
    size: ["__tests__/size/all.js", "__tests__/size/map.js"],
  },
};
