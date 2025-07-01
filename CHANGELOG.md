# Changelog

##
## [0.15.5] - 2025-06-04

### Added

- `classFqn` helper to compute fully-qualified names
- import-filter to drop any illegal import strings
- `typeRef` helper to pick simple name or FQN and avoid duplicates
- `lastSegment` helper to filter out a context’s own class from imports

### Changed

- Updated `ResolvedContext.hbs` so that all generated-type references go through `typeRef` (simple names only when safe)
- Updated constructor loops in `ResolvedContext.hbs` to call proxy methods with `classFqn` (true FQNs)

### Fixed

- “already defined in this compilation unit” compile errors—SDK now builds without name collisions

##
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