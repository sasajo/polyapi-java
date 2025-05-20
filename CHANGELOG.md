# Changelog

## [0.15.4] - 2024-11-15

### Added

- Passing unaltered sourceCode to PolyAPI for display within Canopy application.

### Changed

- PolyApiService.java: Replaced full-body buffering and Commons-IO parsing with a single BufferedInputStream using mark/reset for unified JSON/text/stream parsing and 1 KB error-preview logging.

- Added limbok dependency and plugin to parent-pom

### Fixed

- 

---