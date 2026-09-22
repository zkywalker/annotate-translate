#!/usr/bin/env node

import { createHash, createPublicKey } from 'node:crypto';
import {
  access,
  cp,
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  utimes,
  writeFile
} from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const RUNTIME_ENTRIES = ['manifest.json', 'src', 'assets', '_locales'];
const FIXED_MTIME = new Date('2000-01-01T00:00:00.000Z');
const PREVIEW_PUBLIC_KEY = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAsAScile65Z5oy/jFTAKqxaigK9ax6K13ZWFaBb1jdpqmwZ/0v4jsDbij8Xd9iiWFFaLtuOgnUmQn4d+aBaeQyiw80XBlFarTLV6LiJlJbbcOttztwi4RzJBQZ1m03+sSw1jf+zTPXgjoIARie1FxnKjkUvVkhww6D563J+e1A6BPhHLAMQZhLFTtjpxT6Qq9VHftevjc2ZDn+VsI2c+YqYD9P/53CPY/kPmvzzSRff+PsUDRZFl0/tFhT3dNCevsvgrC1vs16dfRagwFF3qb32aUaYFGP+rf4eeBIvmxD1dEMVunnla/5z48wIpkl0LMWNXJKyOokiK1AjWwYiQFgQIDAQAB';
const EXPECTED_EXTENSION_IDS = Object.freeze({
  release: 'pbipknglenfdagpbfcmdjlibecjfjkhl',
  preview: 'pclalahcmhedjdigfpklahhmeaikpogd'
});

function parseArgs(argv) {
  const args = { channel: 'release', commit: 'local', verifyOnly: false };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--channel' || arg === '--commit') {
      const value = argv[++index];
      if (!value) throw new Error(`${arg} requires a value`);
      if (arg === '--channel') args.channel = value;
      else args.commit = value;
    } else if (arg === '--verify-only') args.verifyOnly = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  if (!['release', 'preview'].includes(args.channel)) {
    throw new Error('--channel must be either "release" or "preview"');
  }
  if (!/^[a-zA-Z0-9._-]+$/.test(args.commit)) {
    throw new Error('--commit may only contain letters, numbers, dots, underscores, and hyphens');
  }

  return args;
}

async function pathExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function collectManifestPaths(manifest) {
  const paths = new Set();
  const add = (value) => {
    if (typeof value === 'string') paths.add(value);
  };

  add(manifest.background?.service_worker);
  add(manifest.action?.default_popup);
  Object.values(manifest.action?.default_icon ?? {}).forEach(add);
  add(manifest.options_page);
  Object.values(manifest.icons ?? {}).forEach(add);
  for (const contentScript of manifest.content_scripts ?? []) {
    (contentScript.js ?? []).forEach(add);
    (contentScript.css ?? []).forEach(add);
  }
  for (const resourceGroup of manifest.web_accessible_resources ?? []) {
    (resourceGroup.resources ?? []).forEach(add);
  }

  return [...paths].sort();
}

function extensionIdFromKey(key) {
  if (typeof key !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(key)) {
    throw new Error('manifest.json key must be a Base64-encoded SPKI public key');
  }

  const publicKeyDer = Buffer.from(key, 'base64');
  if (publicKeyDer.toString('base64') !== key) {
    throw new Error('manifest.json key is not canonical Base64');
  }

  let publicKey;
  try {
    publicKey = createPublicKey({ key: publicKeyDer, format: 'der', type: 'spki' });
  } catch {
    throw new Error('manifest.json key is not a valid SPKI public key');
  }
  if (publicKey.asymmetricKeyType !== 'rsa') {
    throw new Error('manifest.json key must contain an RSA public key');
  }

  const idHex = createHash('sha256').update(publicKeyDer).digest('hex').slice(0, 32);
  return [...idHex]
    .map((character) => String.fromCharCode('a'.charCodeAt(0) + Number.parseInt(character, 16)))
    .join('');
}

function validateExtensionId(key, channel) {
  const extensionId = extensionIdFromKey(key);
  if (extensionId !== EXPECTED_EXTENSION_IDS[channel]) {
    throw new Error(
      `${channel} extension ID changed from ${EXPECTED_EXTENSION_IDS[channel]} to ${extensionId}`
    );
  }
  return extensionId;
}

async function validateExtension(extensionRoot) {
  const manifestPath = path.join(extensionRoot, 'manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

  if (manifest.manifest_version !== 3) {
    throw new Error('Only Chrome Manifest V3 packages are supported');
  }
  if (!/^\d+\.\d+\.\d+(?:\.\d+)?$/.test(manifest.version)) {
    throw new Error(`Invalid Chrome extension version: ${manifest.version}`);
  }
  extensionIdFromKey(manifest.key);

  const missing = [];
  for (const relativePath of collectManifestPaths(manifest)) {
    if (relativePath.includes('*')) continue;
    if (!(await pathExists(path.join(extensionRoot, relativePath)))) missing.push(relativePath);
  }
  if (missing.length > 0) {
    throw new Error(`manifest.json references missing files:\n${missing.join('\n')}`);
  }

  const localeRoot = path.join(extensionRoot, '_locales');
  for (const locale of await readdir(localeRoot)) {
    const messagesPath = path.join(localeRoot, locale, 'messages.json');
    const messages = JSON.parse(await readFile(messagesPath, 'utf8'));
    for (const key of ['extName', 'extDescription']) {
      if (typeof messages[key]?.message !== 'string' || messages[key].message.length === 0) {
        throw new Error(`${path.relative(extensionRoot, messagesPath)} is missing ${key}.message`);
      }
    }
  }

  const sourceRoot = path.join(extensionRoot, 'src');
  const sourceFiles = (await listFiles(sourceRoot, 'src'))
    .filter((relativePath) => relativePath.endsWith('.js'));
  for (const relativePath of sourceFiles) {
    const result = spawnSync(process.execPath, ['--check', path.join(extensionRoot, relativePath)], {
      encoding: 'utf8'
    });
    if (result.status !== 0) {
      throw new Error(`JavaScript syntax check failed for ${relativePath}:\n${result.stderr}`);
    }
  }

  return manifest;
}

async function configurePreview(extensionRoot, manifest, commit) {
  const shortCommit = commit === 'local' ? 'local' : commit.slice(0, 7);
  manifest.key = PREVIEW_PUBLIC_KEY;
  manifest.version_name = `${manifest.version}-preview.${shortCommit}`;
  await writeFile(
    path.join(extensionRoot, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`
  );

  const localeRoot = path.join(extensionRoot, '_locales');
  for (const locale of await readdir(localeRoot)) {
    const messagesPath = path.join(localeRoot, locale, 'messages.json');
    const messages = JSON.parse(await readFile(messagesPath, 'utf8'));
    messages.extName.message = `${messages.extName.message} [Preview]`;
    await writeFile(messagesPath, `${JSON.stringify(messages, null, 2)}\n`);
  }

  const buildInfo = [
    '// Generated by scripts/build-extension.mjs.',
    'globalThis.ANNOTATE_TRANSLATE_BUILD = Object.freeze({',
    "  channel: 'preview',",
    `  commit: '${shortCommit}',`,
    '  debug: true',
    '});',
    ''
  ].join('\n');
  await writeFile(path.join(extensionRoot, 'src/utils/build-info.js'), buildInfo);
}

async function normalizeTimestamps(target) {
  const entries = await readdir(target, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = path.join(target, entry.name);
    if (entry.isDirectory()) await normalizeTimestamps(entryPath);
    await utimes(entryPath, FIXED_MTIME, FIXED_MTIME);
  }
  await utimes(target, FIXED_MTIME, FIXED_MTIME);
}

async function listFiles(target, prefix = '') {
  const files = [];
  const entries = await readdir(target, { withFileTypes: true });
  entries.sort((left, right) => {
    if (left.name < right.name) return -1;
    if (left.name > right.name) return 1;
    return 0;
  });

  for (const entry of entries) {
    const relativePath = path.posix.join(prefix, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(path.join(target, entry.name), relativePath));
    else files.push(relativePath);
  }
  return files;
}

function createZip(stageDir, archivePath, files) {
  const result = spawnSync('zip', ['-X', '-q', archivePath, ...files], {
    cwd: stageDir,
    encoding: 'utf8',
    env: { ...process.env, TZ: 'UTC' }
  });

  if (result.error?.code === 'ENOENT') {
    throw new Error('The "zip" command is required. Install zip and run the build again.');
  }
  if (result.status !== 0) {
    throw new Error(`zip failed: ${result.stderr || result.stdout}`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const sourceManifest = await validateExtension(ROOT);
  const releaseExtensionId = validateExtensionId(sourceManifest.key, 'release');
  if (args.verifyOnly) {
    console.log(`Validated manifest v${sourceManifest.version} (${releaseExtensionId}) and all runtime file references.`);
    return;
  }

  await mkdir(DIST, { recursive: true });
  const suffix = args.channel === 'preview'
    ? `-preview-${args.commit === 'local' ? 'local' : args.commit.slice(0, 7)}`
    : '';
  const packageName = `annotate-translate-${sourceManifest.version}${suffix}`;
  const stageName = args.channel === 'preview'
    ? 'annotate-translate-preview'
    : 'annotate-translate';
  const stageDir = path.join(DIST, stageName);
  const archivePath = path.join(DIST, `${packageName}.zip`);
  const checksumPath = `${archivePath}.sha256`;

  await rm(stageDir, { recursive: true, force: true });
  await rm(archivePath, { force: true });
  await rm(checksumPath, { force: true });
  await mkdir(stageDir, { recursive: true });

  for (const entry of RUNTIME_ENTRIES) {
    await cp(path.join(ROOT, entry), path.join(stageDir, entry), { recursive: true });
  }

  const stagedManifest = JSON.parse(await readFile(path.join(stageDir, 'manifest.json'), 'utf8'));
  if (args.channel === 'preview') {
    await configurePreview(stageDir, stagedManifest, args.commit);
  }

  const builtManifest = await validateExtension(stageDir);
  const builtExtensionId = validateExtensionId(builtManifest.key, args.channel);
  await normalizeTimestamps(stageDir);
  const files = await listFiles(stageDir);
  createZip(stageDir, archivePath, files);

  const archive = await readFile(archivePath);
  const checksum = createHash('sha256').update(archive).digest('hex');
  await writeFile(checksumPath, `${checksum}  ${path.basename(archivePath)}\n`);

  const archiveSize = (await stat(archivePath)).size;
  console.log(`Built ${path.relative(ROOT, archivePath)} (${archiveSize} bytes)`);
  console.log(`Load unpacked from ${path.relative(ROOT, stageDir)}`);
  console.log(`Extension ID ${builtExtensionId} (${args.channel})`);
  console.log(`SHA-256 ${checksum}`);
}

main().catch((error) => {
  console.error(`Build failed: ${error.message}`);
  process.exitCode = 1;
});
