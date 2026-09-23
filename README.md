# MyST Include Link Rewrites

A MyST plugin that fixes relative links and images in files you `{include}` into your docs, so the same file works both on GitHub and in your documentation.
The most common use is a README, but it works for any included file.

![A README included into a docs page](docs/images/include.svg)

## The problem this solves

Many repositories use the `{include}` directive to reuse their README as the home page of their docs.
Some also include `CONTRIBUTING.md` in a contributing page.
READMEs usually have relative links, like `[license](LICENSE)` or `[guide](docs/guide.md)`.
By default, MyST reads those paths _as if they were written in the docs page where `{include}` is used_, not the README, so they break.

This plugin fixes them:

- Links to pages in your docs stay inside your docs site.
- Links to other repository files, like [the plugin source](src/index.mjs) or the [LICENSE](LICENSE), point to GitHub.
- Images are copied into your site as usual.

See [Where links go](docs/where-links-go.md) for the full rules.

## Usage

Add the plugin to your `myst.yml`, and set `project.github` so links outside your docs can point to your repository:

```yaml
project:
  github: https://github.com/org/repo
  plugins:
    - https://github.com/myst-contrib/myst-include-link-rewrites/releases/latest/download/index.mjs
```

Then include your README from a docs page:

````markdown
```{include} ../README.md
```
````

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
