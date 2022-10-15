# Lintje changelog

## v0.11.2 - 2022-10-15

- Support GitHub Pull Request commit validation.

## v0.11.1 - 2022-10-06

- Update to Lintje 0.11.1.

## v0.11.0 - 2022-09-11

- Update to Lintje 0.11.0.
- Add verbose mode option. Set the verbose option to true to have Lintje print
  more context about checked commits and branches.

## v0.10.0 - 2022-08-26

- Update to Lintje 0.10.0.

## v0.9.0 - 2022-08-07

- Update to Lintje 0.9.0.

## v0.8.0 - 2022-08-01

- Update to Lintje 0.8.0.
- Enable color by default: the `color` option is set to `true` by default.

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
