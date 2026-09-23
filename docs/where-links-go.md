---
title: Where links go
---

Say your README is in the repository root, and `docs/index.md` includes it.
Here's where its links end up on your docs site:

| Link in the README | Goes to |
|---|---|
| `[guide](docs/guide.md)` | The guide page on your docs site |
| `![logo](docs/logo.png)` | The image, copied into your docs site |
| `[license](LICENSE)` | `LICENSE` on GitHub |
| `[source](src/)` | The `src/` folder on GitHub |

The rule: files inside your MyST project (the folder with `myst.yml`) stay on your docs site, and images always do.
Folders, and files outside the project, go to GitHub.

Full URLs, `#section` links, and paths starting with `/` are left as they are.
This works for any `{include}`, not just READMEs.

## Linking to GitHub

GitHub links use the repository in `project.github` in your `myst.yml`.
If you haven't set it, MyST shows a warning and those links stay broken.

Links point to the repository's default branch.
If you're working on a fork, keep `project.github` pointing at the main repository.
Your links then go to where the files will be once your pull request is merged.
A file that only exists on your branch will 404 on GitHub until then.

## Limitations

- You can't choose a branch other than the default. MyST plugins can't take options yet ([mystmd#2949](https://github.com/jupyter-book/mystmd/issues/2949)).
- `project.github` must be in `myst.yml` itself, not in a file it `extends:`. Plugins can't read project config yet ([mystmd#2613](https://github.com/jupyter-book/mystmd/issues/2613)).
- A README link to `CONTRIBUTING.md` goes to GitHub, even if a docs page includes that file.
- Only GitHub is supported, but we could extend support to other platforms if there is interest!
