# 🗺️ react-bkoi-gl Developer Guide

Welcome to the developer documentation for `react-bkoi-gl`! This guide will help you understand, develop, test, and contribute to the project with confidence. 🚀

---

## 📚 Table of Contents
1. [Project Structure](#-project-structure)
2. [Version & Migration History](#-version--migration-history)
3. [Components](#-components)
4. [Hooks](#-hooks)
5. [Dependencies](#-dependencies)
6. [NPM Scripts](#-npm-scripts)
7. [How CSS Customization Works](#-how-css-customization-works)
8. [Unit Testing](#-unit-testing)
9. [Local Testing](#-local-testing)
10. [Publishing to NPM](#-publishing-to-npm)
11. [Configuration Files](#-configuration-files)
12. [Resources](#-resources)

---

## 🗂️ Project Structure

```plaintext
react-bkoi-gl/
├── src/
│   ├── components/
│   ├── hooks/
│   ├── types/
│   └── utils/
├── __tests__/
│   ├── components/
│   ├── maplibre/
│   ├── mocks/
│   └── utils/
├── scripts/
├── dist/
├── docs/
├── package.json
├── README.md
└── ...
```

---

## 🏗️ Version & Migration History

Mapbox GL JS is a popular JavaScript library for building interactive, customizable maps using WebGL. Here's what you need to know about its open-source status and the transition to Maplibre GL JS:

- **Mapbox GL JS v1.13.0** was the last version released under the open-source [BSD 3-Clause license][mapbox-npm]. This means you could freely use, modify, and distribute the code.
- **After v2.0**, Mapbox GL JS switched to a proprietary license, and is no longer open-source. Using newer versions requires a Mapbox account and may incur costs. [Read more][github].
- **Mapbox Styles:** While Mapbox GL JS (including v1.13) is open-source, Mapbox's map styles and resources are not. Using Mapbox-hosted styles requires an account and API credits.
- **Why Maplibre?** If you need a free and open-source version of Mapbox GL JS, you should use Maplibre GL JS, which is based on v1.13 and is actively maintained by the community.

**In summary:**
- v1.x of this package used [mapbox-gl@1.13.1][mapbox-npm] (open source, but with limited features and licensing constraints).
- v2.x migrated to [maplibre-gl][maplibre] for full open-source support and feature parity, ensuring the project remains free and community-driven.

[mapbox-npm]: https://www.npmjs.com/package/mapbox-gl/v/1.13.0
[github]: https://github.com/mapbox/mapbox-gl-js/blob/main/CHANGELOG.md#%EF%B8%8F-breaking-changes
[maplibre]: https://maplibre.org/projects/maplibre-gl-js/

---

## 🧩 Components

| Component             | Description                                                                 |
|----------------------|-----------------------------------------------------------------------------|
| **Map**              | The main map container. Must wrap all other map elements.                    |
| **Marker**           | Places a marker at specified coordinates.                                    |
| **Popup**            | Shows a popup at a location, can contain custom content.                     |
| **Layer**            | Adds a custom layer (e.g., circle, line, fill) to the map.                   |
| **Source**           | Defines a data source (GeoJSON, vector, etc.) for layers.                    |
| **NavigationControl**| Zoom and rotation controls.                                                  |
| **FullscreenControl**| Button to toggle fullscreen mode.                                            |
| **GeolocateControl** | Button to center map on user's location.                                     |
| **ScaleControl**     | Displays a scale bar.                                                        |
| **TerrainControl**   | Adds terrain rendering controls.                                             |
| **AttributionControl**| Shows attribution text.                                                     |
| **LogoControl**      | Displays the Barikoi logo.                                                   |
| **UseControl**       | For custom controls.                                                         |

---

## 🪝 Hooks

| Hook         | Description                                                      |
|--------------|------------------------------------------------------------------|
| **useMap**   | Access the map instance and its state in React.                  |
| **useControl** | Attach custom controls to the map.                             |

---

## 📦 Dependencies

- **Runtime:**
  - `maplibre-gl` (v5.4.0): Map rendering engine
  - `@maplibre/maplibre-gl-style-spec`: Style specification utilities
- **Peer:**
  - `react` (>=16.3.0)
  - `react-dom` (>=16.3.0)
- **Dev:**
  - Testing: `jest`, `@testing-library/react`, `@testing-library/jest-dom`, `react-test-renderer`, `puppeteer`, `@types/jest`, `@types/react`, `@types/node`, `identity-obj-proxy`, `tape-promise`, `ts-jest`
  - TypeScript: `typescript`, `@types/*`
  - Linting: `eslint`, `@commitlint/cli`, `@commitlint/config-conventional`
  - Build: `ocular-dev-tools`, `babel-jest`

---

## 🛠️ NPM Scripts

| Script             | Description                                                                 |
|--------------------|-----------------------------------------------------------------------------|
| `typecheck`        | Runs TypeScript validation using `tsc -p tsconfig.build.json`                |
| `clean`            | Removes and recreates the `dist/` directory                                 |
| `build`            | Cleans, builds with Ocular, then runs `modify-css.js`                        |
| `lint`             | Runs ESLint on all source files                                              |
| `test`             | Runs typecheck, then all Jest tests                                          |
| `coverage`         | Runs Jest with coverage reporting                                            |
| `update-version`   | Updates `package.json` version and timestamp from `CHANGELOG.md`             |

**Details:**
- **`build`**: Uses `ocular-clean` and `ocular-build` (from `ocular-dev-tools`) for TypeScript and Babel compilation, then runs `scripts/modify-css.js` to handle CSS (see below).
- **`update-version`**: Reads the latest version from `CHANGELOG.md` and updates `package.json` accordingly.

---

## 🎨 How CSS Customization Works

The script `scripts/modify-css.js` customizes the default Maplibre GL CSS for Barikoi branding and usage:

1. **Copies** the original `maplibre-gl.css` from `node_modules` to `dist/styles/react-bkoi-gl.css`.
2. **Applies custom Barikoi styles** to controls, logo, and attribution, overriding or extending Maplibre's defaults.
3. **Generates a TypeScript definition** for the styles at `dist/styles/index.d.ts` for type safety.

This ensures that when users import `react-bkoi-gl/styles`, they get Barikoi-branded, accessible map controls and visuals.

---

## 🧪 Unit Testing

- **Frameworks:** Jest, React Testing Library, and `ts-jest` for TypeScript support.
- **Test Location:** All tests are in `__tests__/`, organized by component and utility.
- **Mocks:** Custom mocks for Maplibre GL and React DOM are provided in `__tests__/mocks/`.
- **Coverage:** Run `npm run coverage` to generate a detailed report (see `coverage/`).
- **CI Integration:** Tests and coverage are run in CI (see below).

---

## 🧰 Local Testing

**Do NOT use `npm link` for local testing.**
Instead, use the `.tgz` tarball method for reliable, isolated testing:

1. **Build the package:**
   ```bash
   npm run build
   ```
2. **Generate a tarball:**
   ```bash
   npm pack
   ```
   This creates a file like `react-bkoi-gl-2.0.0.tgz` in your project root.
3. **Test in another project:**
   ```bash
   npm install /absolute/path/to/react-bkoi-gl-2.0.0.tgz
   ```
   This simulates a real npm install, ensuring all dependencies and peer dependencies are resolved as they would be for end users.
4. **Update and retest:**
   After making changes, repeat the build and pack steps, then reinstall the new `.tgz` in your test project.

---

## 🚀 Publishing to NPM

1. **Ensure you are logged in:**
   ```bash
   npm login
   ```
   - **Note:** Publishing requires 2-factor authentication (2FA). You must have access to the npm authenticator app or device.
2. **Update version:**
   - Update `CHANGELOG.md` with the new version.
   - Run:
     ```bash
     npm run update-version
     ```
   - This syncs the version in `package.json`.
3. **Build the package:**
   ```bash
   npm run build
   ```
4. **Publish:**
   ```bash
   npm publish --access public
   ```
   - Ensure `dist/` and all necessary files are included (see `files` in `package.json`).

---

## ⚙️ Configuration Files

### `babel.config.cjs`
- Uses `ocular-dev-tools` to generate a Babel config for React and TypeScript.
- Ensures compatibility with modern JS and JSX syntax.

### `.ocularrc.js`
- Central config for Ocular dev tools (lint, TypeScript, aliases, test entry points).
- Sets up path aliases for source, tests, and styles.
- Configures browser and Node test environments.

### `jest.config.cjs`
- Jest configuration for running tests in a jsdom environment.
- Collects coverage from all source files except types and index files.
- Uses Babel for transforming JS/TS/JSX/TSX.
- Mocks CSS and Maplibre GL for tests.
- Test files are matched in `__tests__/**/*test*.{js,jsx,ts,tsx,cjs}`.

### `sonar-project.properties`
- SonarQube project settings for static analysis and code quality.
- Specifies source and test directories, coverage report paths, and exclusions.

### `.github/workflows/action.yaml`
- GitHub Actions workflow for CI/CD.
- Runs on pushes to the `dev` branch.
- Installs dependencies, runs tests and coverage, and triggers SonarQube analysis.
- Notifies a Discord webhook on success, failure, or cancellation.

---

## 📚 Resources
- [Barikoi API Documentation](https://docs.barikoi.com/docs/maps-api)
- [React Documentation](https://react.dev/)
- [Maplibre GL JS](https://maplibre.org/projects/maplibre-gl-js/)
- [Jest](https://jestjs.io/)
- [TypeScript](https://www.typescriptlang.org/)
- [ESLint](https://eslint.org/)

---