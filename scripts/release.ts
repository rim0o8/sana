#!/usr/bin/env bun
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

function run(command: string): string {
  return execSync(command, { stdio: 'pipe' }).toString().trim();
}

type ReleaseType = 'major' | 'minor' | 'patch';

const SEMVER_REGEX = /^(\d+)\.(\d+)\.(\d+)$/;

function bumpVersion(currentVersion: string, releaseType: ReleaseType): string {
  const match = currentVersion.match(SEMVER_REGEX);
  if (!match) {
    throw new Error(`Invalid semver: ${currentVersion}`);
  }

  const major = Number(match[1]);
  const minor = Number(match[2]);
  const patch = Number(match[3]);

  switch (releaseType) {
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'major':
      return `${major + 1}.0.0`;
    default:
      throw new Error(`Unsupported release type: ${releaseType}`);
  }
}

function main() {
  const args = process.argv.slice(2);
  const releaseType = args[0] as ReleaseType | undefined;
  if (!releaseType || !['major', 'minor', 'patch'].includes(releaseType)) {
    console.error('Usage: bun run release <major|minor|patch>');
    process.exit(1);
  }

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const root = join(__dirname, '..');
  const pkgPath = join(root, 'package.json');
  const pkgJson = JSON.parse(readFileSync(pkgPath, 'utf8')) as { version: string } & Record<
    string,
    unknown
  >;

  // Ensure working tree is clean
  const status = run('git status --porcelain');
  if (status) {
    console.error('Working tree not clean. Commit or stash changes before releasing.');
    process.exit(1);
  }

  // Ensure we are on main/default branch or any branch allowed
  const branch = run('git rev-parse --abbrev-ref HEAD');
  console.log(`Current branch: ${branch}`);

  const currentVersion = pkgJson.version;
  const nextVersion = bumpVersion(currentVersion, releaseType);

  console.log(`Bumping version: ${currentVersion} -> ${nextVersion}`);
  pkgJson.version = nextVersion as unknown as string;
  writeFileSync(pkgPath, JSON.stringify(pkgJson, null, 2) + '\n');

  // Commit version bump
  run('git add package.json');
  run(`git commit -m "chore(release): ${nextVersion}"`);

  // Create and push tag
  const tag = `v${nextVersion}`;
  run(`git tag ${tag}`);

  // Push commit and tag
  const remote = run('git remote');
  const defaultRemote = remote.split('\n')[0] || 'origin';
  run(`git push ${defaultRemote} ${branch}`);
  run(`git push ${defaultRemote} ${tag}`);

  console.log(`Release ${tag} created and pushed.`);
}

main();
