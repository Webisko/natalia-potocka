import fs from 'node:fs';
import path from 'node:path';

const snapshotPath = path.resolve(process.cwd(), 'data/public-build-snapshot.json');

let cachedSnapshot = undefined;

function readSnapshotFile(filePath) {
  const buffer = fs.readFileSync(filePath);

  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    return buffer.slice(2).toString('utf16le');
  }

  if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
    const swapped = Buffer.from(buffer.slice(2));
    for (let index = 0; index + 1 < swapped.length; index += 2) {
      const first = swapped[index];
      swapped[index] = swapped[index + 1];
      swapped[index + 1] = first;
    }
    return swapped.toString('utf16le');
  }

  return buffer.toString('utf8');
}

export function getPublicBuildSnapshot() {
  if (cachedSnapshot !== undefined) {
    return cachedSnapshot;
  }

  try {
    if (!fs.existsSync(snapshotPath)) {
      cachedSnapshot = null;
      return cachedSnapshot;
    }

    const raw = readSnapshotFile(snapshotPath);
    const parsed = JSON.parse(raw);
    cachedSnapshot = parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    cachedSnapshot = null;
  }

  return cachedSnapshot;
}