const fs = require('fs');
const path = require('path');

const historyDir = 'C:\\Users\\filip\\AppData\\Roaming\\Code\\User\\History';
const searchToken = 'natalia-potocka/src/';
const restoreDir = 'C:\\Users\\filip\\Webisko\\_KLIENCI\\Natalia Potocka\\natalia-potocka\\src_recovered';

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
            let relativePath = decodeURIComponent(resource.substring(idx + searchToken.length - 4)); // keep 'src/'
            relativePath = relativePath.replace(/\//g, '\\');
            
            const entries = entriesData.entries || [];
            if (entries.length > 0) {
                let latestEntry = entries[entries.length - 1]; // newest one
                const sourceFile = path.join(folderPath, latestEntry.id);
                
                if (fs.existsSync(sourceFile)) {
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

console.log(`Recovered ${recoveredFiles.size} files to src_recovered.`);
