# Lintje GitHub Action

Validate Git commits on every push with GitHub Actions. Learn more about Lintje
on the [Lintje.dev website][website].

<div align="center">
  <b><a href="https://lintje.dev">Lintje.dev website</a> | <a href="https://github.com/marketplace/actions/lintje">Lintje on GitHub marketplace</a></b>
</div>

---

## Table of Contents

- [Overview](#overview)
- [Usage](#usage)
    - [Checkout fetch-depth](#checkout-fetch-depth)
    - [Tag version number](#tag-version-number)
- [Configuration](#configuration)
    - [Example configuration](#example-configuration)
- [Development](#development)
- [Code of Conduct](#code-of-conduct)

## Overview

Lintje is a Git linter for people to help write individuals and team write
better commits. Visit the [Lintje.dev website][website] to learn more about how
to use Lintje and the [rules it uses to validate commits and
branches](https://lintje.dev/docs/rules/).

Using this GitHub Action Lintje will automatically validate the pushed Git
commit on the repository, and multiple commits if more than one was pushed.

For Pull Requests it will not validate all commits in the Pull Request.
Previously pushed commits may have already failed previous builds, which will
also fail the build when the branch is merged.

## Usage

Create a new [GitHub Actions
workflow](https://docs.github.com/en/actions/quickstart) or add it to an
existing workflow that already does testing and linting steps.

Add steps that uses the `actions/checkout@v2` and
`lintje/action@v0.9` actions like shown below.

```yaml
name: "Your workflow name"
on: [push]

jobs:
  lintje: # Add a new job for Lintje
    name: "Lintje (Git linter)"
    runs-on: ubuntu-latest # Supported on ubuntu, macOS and Microsoft Windows
    steps:
      - uses: actions/checkout@v2
        with:
          fetch-depth: 0 # Fetch depth is required
      - uses: lintje/action@v0.9
```

### Checkout fetch-depth

Configure the `actions/checkout@v2` action to use `fetch-depth: 0` to fetch the
entire Git history of the repository. By default the checkout action only
fetches the last commit, which makes it impossible for Lintje to test multiple
commits if more than one commit was pushed. The `fetch-depth: 0` value means
the entire Git history gets fetched.

You can also choose to set it to another value that's high enough to fetch all
you'll ever push, like `fetch-depth: 100`, if you never push more than 100
commits at a time.

### Tag version number

The tag for the Lintje action `v#.#.#` corresponds to the Lintje release with
the same version number. Upgrade Lintje in your build by updating the version
number.

## Configuration

Like Lintje itself, the Lintje GitHub Action has minimal configuration.
The following configuration options are available.

- `branch_validation` (Default value: `true`):
    - Configure Lintje's Git branch validation.
      Setting this to `false` is the equivalent of calling `lintje --no-branch`.
      Read more about the [`--no-branch` CLI
      flag](https://lintje.dev/docs/usage/#branch-validation).
- `hints` (Default value: `true`):
    - Configure Lintje's hints output. Hints will not fail the validation.
      Settings this to `false` is the equivalent of calling `lintje --no-hints`.
      Read more about the [`--no-hints` CLI
      flag](https://lintje.dev/docs/usage/#hints).
- `color` (Default value: `true`):
    - Configure Lintje's colorized output.
      Setting this to `false` is the equivalent of calling `lintje --no-color`.
      Read more about the [`--no-color` CLI
      flag](https://lintje.dev/docs/usage/#colorized-output).

Read more about [how to configure
Lintje](https://lintje.dev/docs/configuration/).

### Example configuration

```yaml
- uses: lintje/action@v0.9
  inputs:
    branch_validation: false # Turn off branch validation. On by default
    hints: false # Turn off hints. On by default
```

## Development

To update the Lintje GitHub Action to the latest Lintje release, follow these
steps:

- Update the `src/version.js` file to the new version number.
- Update this `README.md` file to use the new version number.
- Update the `checksums_256.txt` file with the file included in the new release.
- Update the GitHub Action to match any changed behavior or add new config
  options.
- Tag the new release in Git using the same version number: `git tag v#.#.#`
- Tag the new release in Git using the minor version number: `git tag v#.#`
- Push the updated GitHub Action branches with the multiple tags.
- Create a new release on GitHub and publish the new release to the
  GitHub marketplace.

## Code of Conduct

This project has a [Code of Conduct](CODE_OF_CONDUCT.md) and contributors are
expected to adhere to it.

[website]: https://lintje.dev
[installation]: https://lintje.dev/docs/installation/
