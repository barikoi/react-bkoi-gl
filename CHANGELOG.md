# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 30-03-2026

### Added
- **MinimapControl** component for displaying a minimap preview
- **DrawControl** component for drawing and editing geometries on the map
- New events for draw control (`onDrawCreate`, `onDrawDelete`, `onDrawUpdate`, etc.)
- New events for minimap control (`onMinimapClick`, etc.)
- Husky integration for git hooks with lint-staged
- Test cases for DrawControl and MinimapControl components

### Changed
- Updated README with comprehensive documentation and examples
- Refined type definitions and improved type safety across components
- Updated dependencies to latest versions (maplibre-gl v5.15.0, etc.)
- Updated ESLint configuration
- Improved logo positioning

### Fixed
- TypeScript issues
- ESLint issues
- Issues identified in security audit report

## [2.0.1] - 07-01-2025

### Added
- Added developer guide documentation (`DEVELOPMENT.md`)

### Changed
- Update LogoControl and AttributionControl components for improved functionality and styling

## [2.0.0] - 12-05-2025

### Added
- Unit test integration with Jest
- SonarQube integration for code quality analysis
- CI/CD pipeline implementation

### Changed
- Migrated from `mapbox-gl` to `maplibre-gl` as the underlying mapping library

### Fixed
- Typescript and linting issue
- Peer dependency issue

