import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const OPTIMIZED_DIR = path.join(process.cwd(), 'public', 'images', 'optimized');
const IMAGES_DIR = path.join(process.cwd(), 'public', 'images');
const WIDTHS = [480, 960, 1440];

async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
}

async function getFiles(dir, baseDir) {
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  let files = [];
  for (const dirent of dirents) {
    const res = path.resolve(dir, dirent.name);
    // Skip optimized folder to prevent recursion or processing optimized files
    if (res.startsWith(OPTIMIZED_DIR)) continue;
    if (dirent.isDirectory()) {
      files = files.concat(await getFiles(res, baseDir));
    } else {
      files.push({
        fullPath: res,
        relPath: path.relative(baseDir, res),
      });
    }
  }
  return files;
}

async function run() {
  await ensureDir(OPTIMIZED_DIR);
  const files = await getFiles(IMAGES_DIR, IMAGES_DIR);

  const imagesToOptimize = files.filter((f) => /\.(png|jpe?g)$/i.test(f.relPath));
  console.log(`Początek optymalizacji obrazów... (Znaleziono: ${imagesToOptimize.length} plików)`);

  for (const file of imagesToOptimize) {
    // RelPath np. `katalog/test.png` zamieniamy na `katalog--test`
    const parsedPath = path.parse(file.relPath);
    const slugKey = path.join(parsedPath.dir, parsedPath.name).replace(/\\/g, '/').replace(/\//g, '--');
    
    for (const width of WIDTHS) {
      const outputFilename = `${slugKey}-${width}.webp`;
      const outputPath = path.join(OPTIMIZED_DIR, outputFilename);

      try {
        const inputStat = await fs.stat(file.fullPath);
        
        let outputStat;
        try {
          outputStat = await fs.stat(outputPath);
        } catch { }

        // Modyfikacja pliku w buforze jeśli go nie ma, lub oryginał jest nowszy
        if (!outputStat || inputStat.mtimeMs > outputStat.mtimeMs) {
          await sharp(file.fullPath)
            .resize({ width, withoutEnlargement: true })
            .webp({ quality: 80, effort: 6 })
            .toFile(outputPath);
          console.log(`✓ Wygenerowano: ${outputFilename}`);
        }
      } catch (err) {
        console.error(`Błąd przy pliku ${file.relPath} (szr: ${width}):`, err);
      }
    }
  }
  console.log('Gotowe!');
}

run().catch(console.error);
