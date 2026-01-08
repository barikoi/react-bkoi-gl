# Contributing to react-bkoi-gl

Thank you for your interest in contributing to **react-bkoi-gl**! This guide explains our development process and how to contribute effectively.

---

## 🚀 Quick Start

1. **Setup:** Follow the [Development Environment](#-development-environment) setup section below.
2. **Workflow:** 
   - All work happens on the `dev` branch
   - Write tests for new features/bugfixes
   - Build and test locally using the tarball method
   - Push directly to `dev` after verification
3. **Merges:** Maintainers periodically merge `dev` into `main`

---

## 🛠️ Development Environment

### Prerequisites
- Node.js >= 18.18.0
- npm (latest version)
- Git

### Setup Steps
```bash
git clone https://github.com/barikoi/react-bkoi-gl.git
cd react-bkoi-gl
npm install
```

### Available Scripts

| Script             | Description                                                                 |
|--------------------|-------------------------------------------------|
| `npm run typecheck`| Runs TypeScript validation                      |
| `npm run clean`    | Removes and recreates the `dist/` directory     |
| `npm run build`    | Build production bundle                         |
| `npm run lint`     | Check code style with ESLint                    |
| `npm test`         | Run type checking and all tests                 |
| `npm run coverage` | Generate test coverage reports                  |

For detailed technical documentation, see [DEVELOPMENT.md](./DEVELOPMENT.md).

### Project Structure

```plaintext
react-bkoi-gl/
├── src/               # Source code
│   ├── components/    # React components
│   ├── maplibre/      # MapLibre utilities
│   ├── types/         # TypeScript type definitions
│   └── utils/         # Helper utilities
├── __tests__/         # Test files
│   ├── components/    # Component tests
│   ├── maplibre/      # MapLibre tests
│   ├── mocks/         # Test mocks
│   └── utils/         # Utility tests
├── scripts/           # Build and utility scripts
├── dist/              # Build output (generated)
├── coverage/          # Test coverage reports (generated)
└── ...
```

### Git Hooks

Hooks are automatically configured when you run `npm install`. They enforce code quality and commit standards:

- **Pre-commit**: Runs linting and tests
- **Commit-msg**: Validates commit message format
- **Pre-push**: Runs full test suite

Hook files are located in `.husky/` directory.

---

## 🔧 Testing Workflow

### Unit Tests

- **Framework**: Jest with React Testing Library
- **Location**: All tests are in `__tests__/` directory
- **Coverage**: Run `npm run coverage` to generate reports
- **Mocks**: Custom mocks for MapLibre GL and React DOM in `__tests__/mocks/`

```bash
# Run all tests
npm test

# Run tests with coverage
npm run coverage

# Run type checking
npm run typecheck
```

### Local Package Testing

**⚠️ Do NOT use `npm link` for local testing.**

Use the `.tgz` tarball method for reliable testing:

1. **Build and pack:**
   ```bash
   npm run build
   npm pack  # creates react-bkoi-gl-*.tgz
   ```

2. **Test in another project:**
   ```bash
   npm install /absolute/path/to/react-bkoi-gl-*.tgz
   ```

3. **Update and retest:**
   After changes, rebuild, pack, and reinstall the new tarball.

This method simulates a real npm install and ensures all dependencies resolve correctly.

### CI Pipeline

- **Trigger**: Automatic on push to `dev` branch
- **Steps**: Tests, coverage, and SonarQube analysis
- **Notifications**: Discord webhook on success/failure
- **Config**: See `.github/workflows/action.yaml`

---

## ✍️ Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification and enforce it using:
- [Husky](https://typicode.github.io/husky/) Git hooks
- [commitlint](https://commitlint.js.org/) for validation

### Commit Message Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, no logic change)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Build process or auxiliary tool changes
- **perf**: Performance improvements
- **ci**: CI configuration changes

### Scopes (optional)

- `map`, `marker`, `popup`, `layer`, `source`
- `controls` (navigation, fullscreen, geolocate, etc.)
- `hooks` (useMap, useControl)
- `utils`, `types`, `tests`

### Examples

✅ **Good:**
```
feat(map): add support for custom map projections
fix(marker): correct position calculation for rotated maps
test(layer): add coverage for circle layer rendering
docs: update installation instructions
refactor(controls): simplify navigation control logic
```

❌ **Bad:**
```
update
fixed bug
updates marker
Fixed marker position  # Wrong tense
FEAT: new feature      # Wrong case
```

### Validation Process

Your commits are automatically validated:

1. **Pre-commit** (`git commit`): Runs linting
2. **Commit-msg**: Validates commit message format
3. **Pre-push** (`git push`): Runs full test suite

**Note:** If any hook fails, fix the issues before proceeding. You cannot bypass these checks.

---

## 📦 Release Process

### Pre-Release Checklist

1. **Verify all tests pass:**
   ```bash
   npm test
   npm run coverage
   ```

2. **Check package configuration:**
   ```bash
   npx publint
   ```

3. **Verify TypeScript types:**
   ```bash
   npx @arethetypeswrong/cli --pack .
   ```

4. **Build the package:**
   ```bash
   npm run build
   ```

5. **Test tarball locally:**
   ```bash
   npm pack
   # Test in another project as described in Testing Workflow
   ```

### Publishing Steps

1. **Login to npm** (requires 2FA):
   ```bash
   npm login
   ```

2. **Update version:**
   - Update `CHANGELOG.md` with new version and changes
   - Bump version using npm:
     ```bash
     npm version patch  # for bug fixes (2.0.1 → 2.0.2)
     npm version minor  # for new features (2.0.1 → 2.1.0)
     npm version major  # for breaking changes (2.0.1 → 3.0.0)
     ```

3. **Run pre-release checks** (see above)

4. **Build:**
   ```bash
   npm run build
   ```

5. **Publish to npm:**
   ```bash
   npm publish --access public
   ```

6. **Verify publication:**
   - Check [npm package page](https://www.npmjs.com/package/react-bkoi-gl)
   - Test installation: `npm install react-bkoi-gl@latest`

7. **Create GitHub release:**
   - Tag the release
   - Copy CHANGELOG.md entry to release notes

For detailed technical information, see [DEVELOPMENT.md](./DEVELOPMENT.md#-publishing-to-npm).

---

## 📚 Resources

### Documentation
- [Barikoi API Documentation](https://docs.barikoi.com/docs/maps-api)
- [Component API Reference](https://docs.barikoi.com/npm/npm-intro)
- [MapLibre GL JS Docs](https://maplibre.org/maplibre-gl-js-docs/)
- [Development Guide](./DEVELOPMENT.md)

### Tools & Libraries
- [React Documentation](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Jest Testing Framework](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Conventional Commits](https://www.conventionalcommits.org/)

### Support
- [GitHub Issues](https://github.com/barikoi/react-bkoi-gl/issues)
- [Barikoi Support](mailto:support@barikoi.com)

---

**Thank you for contributing to react-bkoi-gl! 🎉**