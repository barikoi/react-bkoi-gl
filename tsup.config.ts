import { defineConfig } from "tsup";

// maplibre-gl is INTENTIONALLY bundled (not external):
// - its published main entry is a two-file ESM graph (maplibre-gl.mjs +
//   maplibre-gl-shared.mjs) that Next 13's SWC transform corrupts in both the
//   client and SSR bundles ("class extends lr" — the shared chunk's scope
//   renaming breaks). A self-contained single-file bundle never hits it.
// - bundling lets the tsup target lower maplibre's prebuilt es2022 syntax
//   (static blocks, #private fields) to es2020 for older consumer toolchains
//   (Next 13 minifier, CRA5 parser).
// Consumers still never import maplibre-gl directly — everything is
// re-exported from this package (unchanged public API).
export default defineConfig((options) => ({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: {
    // Inline the engine's types: maplibre-gl is a devDependency now (its JS is
    // bundled below), so the published .d.ts must never `import ... from
    // 'maplibre-gl'` — consumers don't have the package installed to resolve.
    resolve: ["maplibre-gl"],
  },
  clean: true,
  sourcemap: true,
  target: "es2020",
  external: ["react", "react-dom"],
  // tsup auto-externalizes `dependencies` — override so maplibre-gl is
  // actually bundled (see the rationale above).
  noExternal: ["maplibre-gl"],
}));
