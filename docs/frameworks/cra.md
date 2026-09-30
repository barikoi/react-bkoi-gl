# Create React App (react-scripts 5)

**Scope:** CRA 5 consumers — Jest setup, CI builds, monorepo pitfalls. The
worker needs **zero bundler configuration** (webpack 5 emits it as a hashed
same-origin asset); internals live in
[docs/framework-setup.md](../framework-setup.md). Validated by the
`tests/framework/cra-app` cell in the
[framework matrix](../framework-setup.md#validated-matrix-as-of-this-writing)
(React 18, npm).

---

## Jest: mock the library

react-scripts 5's Jest cannot load the ES2022 map engine — jest can't resolve
an exports-only package (no `main`), **and** CRA's 2022 babel preset cannot
parse its syntax (static class blocks — `@babel/plugin-transform-class-static-block`
scoped transforms do not survive react-scripts' jest config merge). Mock the
library in unit tests (standard for WebGL components):

```js
jest.mock('maplibre-gl', () => ({
  Map: function Map() {},
  setWorkerUrl: jest.fn(),
  getWorkerUrl: jest.fn(() => ''),
  getVersion: jest.fn(() => '0.0.0'),
  GPUInitializationError: class GPUInitializationError extends Error {},
}), { virtual: true })
```

## Do not build with `CI=true`

maplibre-gl v6 resolves its worker with `new URL('./…', import.meta.url)`,
which webpack 5 reports as a "Critical dependency: the request of a dependency
is an expression" warning — and react-scripts treats every webpack warning as
an error when `process.env.CI` is set. Run plain `npx react-scripts build` in
CI (or unset `CI` for the build step only); `CI=true react-scripts test` is
unaffected.

## CRA inside a monorepo

react-scripts' build lint crashes on conflicting parent `@typescript-eslint`
installs (`Cannot read properties of undefined (reading 'allowShortCircuit')`)
— build with `DISABLE_ESLINT_PLUGIN=true`; nested-app artifact, not a library
issue.
