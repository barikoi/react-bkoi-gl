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
- Node.js >= 18.13.0
- npm (latest version)
- Git

### Setup Steps
```bash
git clone https://github.com/barikoi/react-bkoi-gl.git
cd react-bkoi-gl
npm install
```

### Key Commands
| Command          | Description                                  |
|------------------|----------------------------------------------|
| `npm run build`  | Build production bundle                     |
| `npm test`       | Run all tests                               |
| `npm run lint`   | Check code style                            |
| `npm run coverage` | Generate test coverage reports             |

For detailed configuration, see [DEVELOPMENT.md](./DEVELOPMENT.md#-npm-scripts).

### Git Hooks
Hooks are automatically configured when you run `npm install`. If you need to modify them:
- See `.husky/` directory
- Hook configurations are in `.husky/pre-commit`, `.husky/commit-msg`, etc.

---

## 🔧 Testing Workflow

1. **Local Testing:**
   ```bash
   npm run build
   npm pack # creates .tgz file
   # In test project:
   npm install /path/to/react-bkoi-gl-*.tgz
   ```

2. **CI Pipeline:**
   - Automatic on push to `dev`
   - Runs tests, coverage, and SonarQube analysis
   - See [DEVELOPMENT.md](./DEVELOPMENT.md#-unit-testing) for details

---

## ✍️ Commit Guidelines

We enforce commit standards using:
- [Husky](https://typicode.github.io/husky/) Git hooks
- [commitlint](https://commitlint.js.org/) for Conventional Commits

Your commits will automatically be validated when you:
1. Try to commit (`git commit` - runs linting)
2. Write a commit message (validates format)
3. Push changes (`git push` - runs tests)

**Note:** If hooks fail, you'll need to fix the issues before proceeding.

### Examples:
- `fix(map): correct marker position calculation`
- `feat(controls): add new zoom control style`
- `test(layer): add test coverage for custom layers`

### Prohibited:
- Vague messages (`update`, `fix bug`)
- Non-imperative tense (`fixed`, `updates`)

---

## 📦 Release Process

1. Update `CHANGELOG.md` with new version
2. Run version update:
   ```bash
   npm run update-version
   ```
3. Build and publish:
   ```bash
   npm run build
   npm publish --access public
   ```

Full details in [DEVELOPMENT.md](./DEVELOPMENT.md#-publishing-to-npm).

---

## 📚 Resources
- [Component API](https://docs.barikoi.com/docs/maps-api)
- [Maplibre GL Docs](https://maplibre.org/projects/maplibre-gl-js/)
- [Testing Guide](./DEVELOPMENT.md#-unit-testing)
- [Project Structure](./DEVELOPMENT.md#-project-structure)