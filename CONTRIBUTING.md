# Contributing

The whole plugin is one file, [`src/index.mjs`](src/index.mjs), with tests in [`src/index.test.mjs`](src/index.test.mjs).
The demo site in [`docs/`](docs/) includes this file and the README.
Build it to see the plugin working on real links.

## Local development

Common tasks are npm scripts (see [`package.json`](package.json)):

```bash
npm install          # install mystmd for building the docs
npm test             # run unit tests
npm run docs:live    # serve the demo at http://localhost:3000
npm run docs         # build the demo site
```

MyST doesn't hot-reload plugins, so restart `docs:live` after changing `src/index.mjs`.

## Releasing

1. Bump the version with `npm version <patch|minor|major>` and push the commit and tag.
2. Publish a GitHub release for that tag.

The [release workflow](.github/workflows/release.yml) then attaches `src/index.mjs` to the release, where users load it from, and publishes to npm.
Publishing uses npm's [trusted publishing](https://docs.npmjs.com/trusted-publishers), so link the package to this workflow in its npm settings first.
