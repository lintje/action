# Lintje changelog

## v0.7.1 - updated 2022-06-25

### Added

- Add caching for downloaded Lintje executable. This speeds up the action by
  not downloading Lintje every time the action is run.
- Colorize the Lintje output using the `color` GitHub Action input. This uses
  the Lintje `--color` and `--no-color` CLI flags.

## v0.7.1

Initial release of the Lintje GitHub Action using Lintje 0.7.1.
