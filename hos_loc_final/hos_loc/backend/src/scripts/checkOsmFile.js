import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OSM_FILE_PATH = path.join(__dirname, '../../data/india-251105.osm.pbf');

console.log('\n🔍 Checking OSM Data File...\n');
console.log('Expected location:', OSM_FILE_PATH);
console.log('-------------------------------------------\n');

if (fs.existsSync(OSM_FILE_PATH)) {
  const stats = fs.statSync(OSM_FILE_PATH);
  const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  
  console.log('✅ OSM file found!');
  console.log(`📦 File size: ${fileSizeMB} MB`);
  console.log(`📅 Last modified: ${stats.mtime.toLocaleString()}`);
  console.log('\n✨ Ready to import! Run: npm run import-osm\n');
} else {
  console.log('❌ OSM file NOT found!');
  console.log('\n📥 Download Instructions:');
  console.log('1. Visit: https://download.geofabrik.de/asia/india.html');
  console.log('2. Download: india-latest.osm.pbf (~1.2 GB)');
  console.log('3. Place it in: backend/data/');
  console.log('\nAlternatively, download a specific state for faster testing:');
  console.log('- Karnataka: https://download.geofabrik.de/asia/india/karnataka-latest.osm.pbf');
  console.log('- Maharashtra: https://download.geofabrik.de/asia/india/maharashtra-latest.osm.pbf');
  console.log('\nRename the downloaded file to: india-latest.osm.pbf\n');
}
