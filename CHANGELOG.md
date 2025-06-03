# Changelog

## [0.15.4] - 2024-11-15

### Added

- Passing unaltered sourceCode to PolyAPI for display within Canopy application.

- Fixed duplicate-field collisions by preprocessing JSON schemas to inject suffixed properties (e.g. order_id_1) into both properties and required before code generation, and enhanced NameHelper to preserve suffixes and special‐character mappings, eliminating “path not present” and “same field twice” errors.

### Changed

- PolyApiService.java: Replaced full-body buffering and Commons-IO parsing with a single BufferedInputStream using mark/reset for unified JSON/text/stream parsing and 1 KB error-preview logging.

- Added lombok dependency and plugin to parent-pom

### Fixed

- 

---