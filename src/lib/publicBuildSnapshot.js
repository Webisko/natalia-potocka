import fs from 'node:fs';
import path from 'node:path';

const snapshotPath = path.resolve(process.cwd(), 'data/public-build-snapshot.json');

let cachedSnapshot = undefined;

export function getPublicBuildSnapshot() {
  if (cachedSnapshot !== undefined) {
    return cachedSnapshot;
  }

  try {
    if (!fs.existsSync(snapshotPath)) {
      cachedSnapshot = null;
      return cachedSnapshot;
    }

    const raw = fs.readFileSync(snapshotPath, 'utf8');
    const parsed = JSON.parse(raw);
    cachedSnapshot = parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    cachedSnapshot = null;
  }

  return cachedSnapshot;
}