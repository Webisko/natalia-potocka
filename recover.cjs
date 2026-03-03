const fs = require('fs');
const path = require('path');

const historyDir = 'C:\\Users\\filip\\AppData\\Roaming\\Code\\User\\History';
const searchToken = 'natalia%20potocka/natalia-potocka/';
const restoreDir = 'C:\\Users\\filip\\Webisko\\_KLIENCI\\Natalia Potocka\\natalia-potocka';

const recoveredFiles = new Set();
let count = 0;

fs.readdirSync(historyDir).forEach(folder => {
    const folderPath = path.join(historyDir, folder);
    if (!fs.statSync(folderPath).isDirectory()) return;

    const entriesFile = path.join(folderPath, 'entries.json');
    if (!fs.existsSync(entriesFile)) return;

    try {
        const entriesData = JSON.parse(fs.readFileSync(entriesFile, 'utf8'));
        const resource = entriesData.resource;
        
        if (resource && resource.toLowerCase().includes(searchToken)) {
            const idx = resource.toLowerCase().indexOf(searchToken);
            let relativePath = decodeURIComponent(resource.substring(idx + searchToken.length));
            relativePath = relativePath.replace(/\//g, '\\');
            
            const entries = entriesData.entries || [];
            if (entries.length > 0) {
                let latestEntry = entries[entries.length - 1];
                const sourceFile = path.join(folderPath, latestEntry.id);
                
                if (fs.existsSync(sourceFile)) {
                    // Only restore files that were deleted in our batch: src, cockpit, astro.config, etc.
                    // We don't want to overwrite the new React api/ app.js unless needed.
                    // To be safe, let's restore everything but skip app.js, api/, frontend/, package.json
                    if (relativePath.startsWith('app.js') || 
                        relativePath.startsWith('api\\') || 
                        relativePath.startsWith('frontend\\') || 
                        relativePath.startsWith('package') ||
                        relativePath.startsWith('.env') ||
                        relativePath.startsWith('data\\')) {
                        return;
                    }

                    const destPath = path.join(restoreDir, relativePath);
                    if (!fs.existsSync(destPath)) {
                        fs.mkdirSync(path.dirname(destPath), { recursive: true });
                        fs.copyFileSync(sourceFile, destPath);
                        recoveredFiles.add(relativePath);
                        count++;
                    }
                }
            }
        }
    } catch (e) {}
});

console.log(`Recovered ${recoveredFiles.size} files in total.`);
