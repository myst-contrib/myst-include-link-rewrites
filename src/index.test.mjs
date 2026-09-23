// Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import plugin from './index.mjs';

// repo/            <- .git, README.md, LICENSE, src/
//   docs/          <- myst.yml, index.md (includes ../README.md), guide.md
const repo = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'include-links-')));
for (const f of ['.git/HEAD', 'LICENSE', 'src/a.py', 'docs/guide.md', 'docs/logo.png', 'docs/my notes.md']) {
  fs.mkdirSync(path.dirname(path.join(repo, f)), { recursive: true });
  fs.writeFileSync(path.join(repo, f), '');
}
const docs = path.join(repo, 'docs');
process.chdir(docs);

const link = (url) => ({ type: 'link', url, children: [] });
const run = (children, github) => {
  fs.writeFileSync('myst.yml', github ? `project:\n  github: ${github}\n` : 'project: {}\n');
  const tree = { type: 'root', children };
  const file = { path: path.join(docs, 'index.md'), messages: [], message(m) { this.messages.push(m); } };
  plugin.transforms[0].plugin()(tree, file);
  return { tree, file };
};

test('links in an included file are re-resolved', () => {
  const urls = [
    'docs/guide.md#usage', 'docs/my%20notes.md', 'LICENSE', 'src/', 'docs/logo.png',
    'https://x.org', '#top', '/rooted',
  ];
  const include = { type: 'include', file: '../README.md', children: urls.map(link) };
  include.children.push({ type: 'image', url: 'docs/logo.png' });
  const own = link('LICENSE'); // the page's own links are untouched
  run([include, own], 'org/repo');
  assert.deepEqual(include.children.map((n) => n.url), [
    'guide.md#usage',
    'my%20notes.md',
    'https://github.com/org/repo/blob/HEAD/LICENSE',
    'https://github.com/org/repo/tree/HEAD/src',
    'logo.png',
    'https://x.org', '#top', '/rooted',
    'logo.png',
  ]);
  assert.equal(own.url, 'LICENSE');
});

test('nested includes resolve against their own folder', () => {
  const inner = { type: 'include', file: 'docs/guide.md', children: [link('logo.png')] };
  run([{ type: 'include', file: '../README.md', children: [inner] }], 'org/repo');
  assert.equal(inner.children[0].url, 'logo.png');
});

test('without project.github, outside links are left alone with a warning', () => {
  const { tree, file } = run([{ type: 'include', file: '../README.md', children: [link('LICENSE')] }]);
  assert.equal(tree.children[0].children[0].url, 'LICENSE');
  assert.equal(file.messages.length, 1);
});
