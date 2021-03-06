# Lintje changelog

## v0.7.1-1 - 2022-07-02

- Fix the executable name for Microsoft Windows hosts. It did not call the
  `lintje.exe` executable on Microsoft Windows. It missed the `.exe` extension.

## v0.7.1 - updated 2022-06-26

### Changed

- Add titles to Lintje annotations. Makes it easier to tell which action the
  annotation is coming from.

### Fixed

- Remove colorized output from GitHub workflow summary annotations. Colorized
  messages do not render properly there.

## v0.7.1 - updated 2022-06-25

### Added

- Add caching for downloaded Lintje executable. This speeds up the action by
  not downloading Lintje every time the action is run.
- Colorize the Lintje output using the `color` GitHub Action input. This uses
  the Lintje `--color` and `--no-color` CLI flags.

## v0.7.1

Initial release of the Lintje GitHub Action using Lintje 0.7.1.
