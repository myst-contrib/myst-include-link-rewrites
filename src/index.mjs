// MyST plugin that fixes relative links and images in `{include}`d files.
//
// MyST resolves relative paths against the page doing the including, not the
// included file, so `[guide](docs/guide.md)` in a root README breaks when it's
// included from `docs/index.md`. We re-resolve each path against the included
// file. See docs/where-links-go.md for the rules.
import fs from 'node:fs';
import path from 'node:path';

const toUrlPath = (p) => encodeURI(p.split(path.sep).join('/'));

// Skip `#anchors`, `/rooted` paths, and anything with a scheme (https:, mailto:, ...)
const isRelative = (url) => url && !/^([a-z][a-z0-9+.-]*:|#|\/)/i.test(url);

// HACK: plugins can't read project config yet, so we pull `github:` out of myst.yml.
// This misses a value set in an `extends:` file.
// https://github.com/jupyter-book/mystmd/issues/2613
function readGithubUrl(projectDir) {
  try {
    const yml = fs.readFileSync(path.join(projectDir, 'myst.yml'), 'utf8');
    const url = yml.match(/^\s*github:\s*['"]?([^\s'"#]+)/m)?.[1];
    if (!url) return;
    // `project.github` may be `org/repo` shorthand
    return (url.startsWith('http') ? url : `https://github.com/${url}`).replace(/(\.git)?\/?$/, '');
  } catch {}
}

function findRepoRoot(dir) {
  while (!fs.existsSync(path.join(dir, '.git'))) {
    const parent = path.dirname(dir);
    if (parent === dir) return;
    dir = parent;
  }
  return dir;
}

function rewriteUrl(node, sourceDir, ctx) {
  if (!['link', 'image'].includes(node.type) || !isRelative(node.url)) return;
  const [, filePath, suffix] = node.url.match(/^([^#?]*)(.*)$/);
  let decoded = filePath;
  try {
    decoded = decodeURI(filePath);
  } catch {} // so we don't break on, e.g., a stray `%` in `100%.md`
  const target = path.resolve(sourceDir, decoded);
  const isDir = fs.statSync(target, { throwIfNoEntry: false })?.isDirectory();
  const fromProject = path.relative(ctx.projectDir, target);
  const inProject = fromProject !== '..' && !fromProject.startsWith(`..${path.sep}`);

  // MyST can serve images and project files itself, so point at them from the page.
  // Everything else only exists in the repository, so link to GitHub.
  if (node.type === 'image' || (inProject && !isDir)) {
    node.url = toUrlPath(path.relative(ctx.pageDir, target)) + suffix;
  } else if (ctx.githubUrl && ctx.repoRoot) {
    const repoPath = toUrlPath(path.relative(ctx.repoRoot, target));
    node.url = `${ctx.githubUrl}/${isDir ? 'tree' : 'blob'}/HEAD/${repoPath}${suffix}`;
  } else {
    ctx.missingGithub = true;
  }
}

// `dir` is the folder of the file that `node`'s contents came from.
function walk(node, dir, ctx) {
  for (const child of node.children ?? []) {
    if (child.type === 'include') {
      const base = child.file.startsWith('/') ? ctx.projectDir : dir;
      walk(child, path.dirname(path.join(base, child.file)), ctx);
      continue;
    }
    // Paths written in the page's own folder (the page itself, or an include
    // next to it) already resolve correctly, so leave them alone.
    if (dir !== ctx.pageDir) rewriteUrl(child, dir, ctx);
    walk(child, dir, ctx);
  }
}

const includeLinksTransform = {
  name: 'include-link-rewrites',
  doc: 'Re-resolves relative links and images in {include}d files against the included file.',
  stage: 'document',
  plugin: () => (tree, file) => {
    const projectDir = process.cwd();
    const pageDir = path.dirname(path.resolve(file.path));
    const ctx = {
      projectDir,
      pageDir,
      githubUrl: readGithubUrl(projectDir),
      repoRoot: findRepoRoot(projectDir),
    };
    walk(tree, pageDir, ctx);
    if (ctx.missingGithub) {
      file.message(
        'An included file links to files outside your MyST project. Set `project.github` in myst.yml and build from a git checkout to link them to GitHub.',
      );
    }
  },
};

export default {
  name: 'Include link rewrites',
  transforms: [includeLinksTransform],
};
