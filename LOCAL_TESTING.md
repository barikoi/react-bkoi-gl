# Local Testing Guide for react-bkoi-gl

This guide provides comprehensive information on how to test `react-bkoi-gl` locally before publishing or integrating with other projects.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Setup](#project-setup)
3. [Running Tests](#running-tests)
4. [Testing with npm link](#testing-with-npm-link)
5. [Creating a Test Application](#creating-a-test-application)
6. [Testing in Different Scenarios](#testing-in-different-scenarios)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Ensure you have the following installed:

- **Node.js**: >= 18.18.0 (required as per package.json engines)
- **npm**: Latest version (comes with Node.js)
- **Git**: For cloning the repository

Verify your versions:

```bash
node --version  # Should be >= 18.18.0
npm --version
```

---

## Project Setup

### 1. Clone the Repository

```bash
git clone https://github.com/barikoi/react-bkoi-gl.git
cd react-bkoi-gl
```

### 2. Install Dependencies

```bash
npm install
```

This installs all runtime and development dependencies including:
- `maplibre-gl` - Map rendering engine
- `@testing-library/react` - Testing utilities
- `jest` - Test framework
- `typescript` - Type checking
- `eslint` - Linting

---

## Running Tests

### Run All Tests

```bash
npm test
```

This command:
1. Runs TypeScript type checking (`npm run typecheck`)
2. Executes all Jest tests

### Run Tests with Coverage

```bash
npm run coverage
```

This generates a detailed coverage report in the `coverage/` directory:
- `coverage/index.html` - Open in browser for detailed report
- `coverage/lcov-report/` - HTML report
- `coverage/lcov.info` - Machine-readable format

### Run Type Check Only

```bash
npm run typecheck
```

Validates TypeScript types without running tests.

### Run Linting

```bash
npm run lint
```

Checks code quality using ESLint.

---

## Testing with npm link

The `npm link` method allows you to test the library in a local React application by creating a symlink.

### Step 1: Build the Package

First, build the package in the `react-bkoi-gl` directory:

```bash
cd /path/to/react-bkoi-gl
npm run build
```

This creates the `dist/` directory with compiled files.

### Step 2: Create a Global Link

```bash
npm link
```

This creates a global symlink to your package. You should see output like:

```
audited 678 packages in 2s
/Users/your-username/.nvm/versions/v18.x.x/lib/node_modules/react-bkoi-gl -> /path/to/react-bkoi-gl
```

### Step 3: Create a Test React App

In a separate directory, create a new React app:

```bash
# Using Vite (recommended)
npm create vite@latest test-bkoi-app -- --template react-ts
cd test-bkoi-app
npm install

# OR using Create React App
npx create-react-app test-bkoi-app --template typescript
cd test-bkoi-app
```

### Step 4: Link the Package

In your test app directory:

```bash
npm link react-bkoi-gl
```

This links your local `react-bkoi-gl` to the test app.

### Step 5: Install Peer Dependencies

The package requires React and React DOM as peer dependencies:

```bash
npm install react react-dom
```

### Step 6: Use in Your Test App

Update `src/App.tsx` (or `src/main.tsx` for Vite):

```tsx
import { useRef } from 'react';
import {
  Map,
  Marker,
  Popup,
  NavigationControl,
  FullscreenControl,
  GeolocateControl,
  ScaleControl,
} from 'react-bkoi-gl';

// Import Styles
import 'react-bkoi-gl/styles';

function App() {
  const BARIKOI_API_KEY = 'YOUR_BARIKOI_API_KEY_HERE';
  const mapStyle = `https://map.barikoi.com/styles/osm-liberty/style.json?key=${BARIKOI_API_KEY}`;
  const mapRef = useRef(null);
  const initialViewState = {
    longitude: 90.36402,
    latitude: 23.823731,
    minZoom: 4,
    maxZoom: 22,
    zoom: 13,
    bearing: 0,
    pitch: 0,
  };

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Map
        ref={mapRef}
        mapStyle={mapStyle}
        style={{ width: '100%', height: '100%' }}
        initialViewState={initialViewState}
      >
        <Marker longitude={90.36402} latitude={23.823731} color="red" />
        <Popup longitude={90.36402} latitude={23.823731}>
          <div>Hello, Barikoi!</div>
        </Popup>
        <NavigationControl position="top-right" />
        <FullscreenControl position="top-right" />
        <GeolocateControl position="top-right" />
        <ScaleControl position="bottom-right" />
      </Map>
    </div>
  );
}

export default App;
```

**Alternative: Using MapStyle SDK**

```tsx
import { useRef } from 'react';
import {
  Map,
  MapStyle,
  Marker,
  Popup,
  NavigationControl,
  FullscreenControl,
  GeolocateControl,
  ScaleControl,
} from 'react-bkoi-gl';

// Import Styles
import 'react-bkoi-gl/styles';

function App() {
  const BARIKOI_API_KEY = 'YOUR_BARIKOI_API_KEY_HERE';
  const mapRef = useRef(null);
  const initialViewState = {
    longitude: 90.36402,
    latitude: 23.823731,
    minZoom: 4,
    maxZoom: 22,
    zoom: 13,
    bearing: 0,
    pitch: 0,
  };

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Map
        ref={mapRef}
        mapStyle={`${MapStyle.OSM.LIBERTY}?key=${BARIKOI_API_KEY}`}
        style={{ width: '100%', height: '100%' }}
        initialViewState={initialViewState}
      >
        <Marker longitude={90.36402} latitude={23.823731} color="red" />
        <Popup longitude={90.36402} latitude={23.823731}>
          <div>Hello, Barikoi!</div>
        </Popup>
        <NavigationControl position="top-right" />
        <FullscreenControl position="top-right" />
        <GeolocateControl position="top-right" />
        <ScaleControl position="bottom-right" />
      </Map>
    </div>
  );
}

export default App;
```

### Step 7: Run the Test App

```bash
npm run dev
```

The app should now use your local development version of `react-bkoi-gl`.

### Unlink When Done

To stop using the linked version:

```bash
# In the test app
npm unlink react-bkoi-gl
npm install react-bkoi-gl

# In the package directory
npm unlink
```

---

## Creating a Test Application

### Using Vite (Recommended)

Create a new Vite app in the `examples/` directory of your project:

```bash
mkdir -p examples/test-app
cd examples/test-app
npm create vite@latest . -- --template react-ts
npm install
```

Update `vite.config.ts` to resolve the package:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'react-bkoi-gl': '/path/to/react-bkoi-gl/src',
    },
  },
});
```

### Using Next.js

```bash
npx create-next-app@latest test-app --typescript
cd test-app
npm install
```

For Next.js, you may need to add transpilation configuration in `next.config.js`:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['react-bkoi-gl'],
};

module.exports = nextConfig;
```

---

## Testing in Different Scenarios

### Testing Changes Quickly

For rapid iteration during development:

1. **Watch Mode with Build:**

```bash
# In a terminal in react-bkoi-gl directory
npm run build -- --watch
```

2. **Or use tsup watch mode** (if configured):

```bash
npx tsup --watch
```

### Testing with Storybook

To test components in isolation, you can set up Storybook:

```bash
npx storybook@latest init
```

Create a story file `.storybook/stories/Map.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Map, MapStyle, Marker, NavigationControl } from 'react-bkoi-gl';
import 'react-bkoi-gl/styles';

const meta: Meta<typeof Map> = {
  title: 'Components/Map',
  component: Map,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Map>;

const apiKey = 'YOUR_KEY';

export const BasicMap: Story = {
  args: {
    mapStyle: `https://map.barikoi.com/styles/osm-liberty/style.json?key=${apiKey}`,
    initialViewState: {
      longitude: 90.36402,
      latitude: 23.823731,
      zoom: 13,
    },
    style: { width: '100%', height: '500px' },
  },
  render: (args) => (
    <Map {...args}>
      <Marker longitude={90.36402} latitude={23.823731} color="red" />
      <NavigationControl />
    </Map>
  ),
};

export const DarkMap: Story = {
  args: {
    mapStyle: `${MapStyle.DARK}?key=${apiKey}`,
    initialViewState: {
      longitude: 90.36402,
      latitude: 23.823731,
      zoom: 13,
    },
    style: { width: '100%', height: '500px' },
  },
  render: (args) => (
    <Map {...args}>
      <Marker longitude={90.36402} latitude={23.823731} color="red" />
      <NavigationControl />
    </Map>
  ),
};
```

### Testing with npm pack

To simulate the published package:

```bash
# In react-bkoi-gl directory
npm run build
npm pack
```

This creates a `.tgz` file (e.g., `react-bkoi-gl-2.0.1.tgz`).

Install it in your test app:

```bash
cd /path/to/test-app
npm install /path/to/react-bkoi-gl/react-bkoi-gl-2.0.1.tgz
```

This mimics installing from npm registry.

---

## Testing with Yarn (Alternative)

If you prefer Yarn over npm:

### Yarn Link

```bash
# In react-bkoi-gl directory
yarn build
yarn link

# In test app directory
yarn link react-bkoi-gl
```

### Yarn Workspaces (for monorepo)

If using a monorepo setup, update `package.json`:

```json
{
  "workspaces": [
    "packages/*"
  ],
  "private": true
}
```

Then reference the local package:

```json
{
  "dependencies": {
    "react-bkoi-gl": "*"
  }
}
```

---

## Troubleshooting

### Issue: "Module not found" error

**Solution:**
- Ensure you've run `npm run build` before linking
- Check that the `dist/` directory exists and contains compiled files

### Issue: TypeScript errors in test app

**Solution:**
- Ensure `tsconfig.json` in test app includes:
```json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "esModuleInterop": true
  }
}
```

### Issue: Styles not loading

**Solution:**
- Verify you're importing styles: `import 'react-bkoi-gl/styles';`
- Check that `dist/styles/react-bkoi-gl.css` exists after build

### Issue: Map not rendering

**Solution:**
- Verify your Barikoi API key is valid
- Check browser console for errors
- Ensure map container has defined height and width
- Verify mapStyle URL is correct

### Issue: npm link not working with pnpm

**Solution:**
- pnpm uses different linking mechanism. Use pnpm link:
```bash
pnpm link --global
cd ../test-app
pnpm link --global react-bkoi-gl
```

### Issue: Husky hooks causing problems

**Solution:**
- Temporarily disable hooks: `git config core.hooksPath /dev/null`
- Re-enable after testing: `git config core.hooksPath .husky`

---

## Available Test Commands Summary

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests with type checking |
| `npm run coverage` | Generate coverage report |
| `npm run typecheck` | TypeScript validation only |
| `npm run lint` | Run ESLint |
| `npm run build` | Build the package |
| `npm run clean` | Remove dist directory |

---

## Test File Structure

The project uses Jest for testing with the following structure:

```
__tests__/
├── components/          # Component tests
│   ├── map.test.js
│   ├── marker.test.js
│   ├── popup.test.js
│   └── ...
├── utils/              # Utility tests
│   ├── apply-react-style.test.js
│   ├── deep-equal.test.js
│   └── ...
├── mocks/              # Mock implementations
│   ├── maplibre-gl.js
│   └── react-dom-mock.js
└── setup.js           # Jest setup file
```

---

## Getting API Key

To test with actual Barikoi maps:

1. Register at [Barikoi Developer Dashboard](https://developer.barikoi.com/register)
2. Verify with phone number
3. Claim your API key
4. Replace `YOUR_BARIKOI_API_KEY_HERE` with your actual key

---

## Additional Resources

- [Barikoi API Documentation](https://docs.barikoi.com/docs/maps-api)
- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [npm link documentation](https://docs.npmjs.com/cli/v8/commands/npm-link)
- [Vite Guide](https://vitejs.dev/guide/)
