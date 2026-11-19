import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildBoard, type Protocol } from './lib/model.ts';
import { buildDossier } from './vendor/makefun-board.ts';

function argument(name: string): string | undefined {
  const at = process.argv.indexOf(name);
  return at >= 0 ? process.argv[at + 1] : undefined;
}
const givenInput = argument('--input') || '/input/snapshot.json';
const root = dirname(fileURLToPath(import.meta.url));
function requireSourceDirectory(name: string): string {
  const directory = join(root, name);
  try {
    if (!statSync(directory).isDirectory()) throw new Error(`Required source directory is not a directory: ${directory}`);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Required source directory')) throw error;
    throw new Error(`Required source directory is missing: ${directory}`);
  }
  return directory;
}
const dashboardDir = requireSourceDirectory('dashboard');
const screenshotDir = requireSourceDirectory('screenshots');
function resolveSnapshotInput(path: string): string {
  let candidate = path;
  try {
    if (statSync(candidate).isDirectory()) candidate = join(candidate, 'snapshot.json');
    if (!statSync(candidate).isFile()) throw new Error('not a regular file');
  } catch {
    throw new Error(`Snapshot input is missing or not a regular file: ${resolve(candidate)}`);
  }
  return candidate;
}
const inputPath = resolveSnapshotInput(givenInput);
const output = resolve(process.env.MAKEFUN_OUTPUT_DIR || '/output');
const snapshot = JSON.parse(readFileSync(inputPath, 'utf8')) as { as_of: string; protocols: Protocol[]; watchlist: string[] };
if (!Array.isArray(snapshot.protocols) || !Array.isArray(snapshot.watchlist) || !snapshot.as_of) throw new Error('Input is not a token-radar snapshot');

const board = buildBoard(snapshot.protocols, snapshot.watchlist, snapshot.as_of);
// Reject a model regression before it reaches the dossier: every watchlist slug
// must survive scoring, rows must be ranked in order, and rounded values stay monotone.
if (board.length < 100 || board.length > 4000) throw new Error(`Board row count ${board.length} is outside 100–4000.`);
const present = new Set(board.map(row => row.slug));
const missing = snapshot.watchlist.filter(slug => !present.has(slug));
if (missing.length) throw new Error(`Board misses watchlist slugs: ${missing.join(', ')}`);
const flaggedWatchlist = new Set(board.filter(row => row.on_watchlist).map(row => row.slug));
const unexpectedFlags = [...flaggedWatchlist].filter(slug => !snapshot.watchlist.includes(slug));
const unflagged = snapshot.watchlist.filter(slug => !flaggedWatchlist.has(slug));
if (unexpectedFlags.length || unflagged.length || flaggedWatchlist.size !== snapshot.watchlist.length) {
  throw new Error(`Watchlist flags disagree with the snapshot (unexpected: ${unexpectedFlags.join(', ') || 'none'}; unflagged: ${unflagged.join(', ') || 'none'}).`);
}
for (let i = 0; i < board.length; i++) {
  const row = board[i];
  if (row.rank !== i + 1 || !Number.isSafeInteger(row.implied_value_usd) || row.implied_value_usd < 1 || (i > 0 && row.implied_value_usd > board[i - 1].implied_value_usd)) {
    throw new Error(`Invalid rank or non-monotone implied value at board row ${i + 1} (${row.slug}).`);
  }
  if (row.farm_steps.length < 3 || row.farm_steps.length > 12 || row.farm_steps.some(step => step.length < 20 || step.length > 600)) {
    throw new Error(`Invalid farm plan shape at board row ${i + 1} (${row.slug}).`);
  }
}
mkdirSync(output, { recursive: true });
// Replace only paths owned by this program so reruns cannot retain stale output files.
for (const name of ['board.json', 'dossier.json', 'dashboard', 'screenshots']) rmSync(join(output, name), { recursive: true, force: true });
writeFileSync(join(output, 'board.json'), `${JSON.stringify(board, null, 2)}\n`);
cpSync(dashboardDir, join(output, 'dashboard'), { recursive: true });
// Keep the generated payload in a non-source extension so the dossier cap can show all hand-written UI source.
writeFileSync(join(output, 'dashboard', 'data.bin'), `${JSON.stringify({ as_of: snapshot.as_of, protocol_count: snapshot.protocols.length, watchlist_count: snapshot.watchlist.length, floor_usd: 50000000, board })}\n`);

const shots = readdirSync(screenshotDir).filter(name => statSync(join(screenshotDir, name)).isFile()).sort();
if (shots.length !== 3) throw new Error(`Expected exactly 3 coordinator screenshots in screenshots/; found ${shots.length}. Board and dashboard data were written.`);
const requiredShots = ['1-board.png', '2-detail.png', '3-filtered.png'];
if (requiredShots.some(name => !shots.includes(name))) throw new Error(`Screenshots must be named ${requiredShots.join(', ')}.`);
mkdirSync(join(output, 'screenshots'), { recursive: true });
for (const name of shots) {
  const source = join(screenshotDir, name);
  const bytes = readFileSync(source);
  if (bytes.length > 512 * 1024) throw new Error(`Screenshot ${name} exceeds 512 KiB.`);
  if (bytes.toString('hex', 0, 8) !== '89504e470d0a1a0a') throw new Error(`Screenshot ${name} is not a PNG.`);
  const width = bytes.readUInt32BE(16), height = bytes.readUInt32BE(20);
  if (Math.max(width, height) > 1440 || Math.min(width, height) < 800) throw new Error(`Screenshot ${name} dimensions ${width}×${height} are outside the allowed range.`);
  cpSync(source, join(output, 'screenshots', basename(name)));
}
writeFileSync(join(output, 'dossier.json'), buildDossier(output, {
  text_max_bytes: 65536,
  screenshots: { max: 3, max_bytes: 512 * 1024 },
  dashboard: { max_files: 400, max_bytes: 4 * 1024 * 1024 },
}));
console.log(`Wrote ${board.length} pre-token protocols to ${output}`);
