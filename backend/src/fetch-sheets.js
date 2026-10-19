const https = require('https');
const fs = require('fs');
const path = require('path');

const sheets = [
  { name: 'Kits Data', gid: '1455767916' },
  { name: 'Other League', gid: '1504770904' },
  { name: 'Champions League 8', gid: '1875452161' },
  { name: 'Catchy Classic 25', gid: '1458832727' },
  { name: 'Catchy Classic 24', gid: '1051292405' },
  { name: 'Catchy Classic 23', gid: '1744244770' },
  { name: 'Catchy Classic 22', gid: '569367153' },
  { name: 'Catchy Classic 20', gid: '422628416' },
];

function fetchCsv(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchCsv(res.headers.location).then(resolve, reject);
      }
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function run() {
  const outDir = path.join(__dirname, 'sheets_data');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  for (const s of sheets) {
    try {
      console.log(`Downloading ${s.name} (gid: ${s.gid})...`);
      const url = `https://docs.google.com/spreadsheets/d/1Nehh8ti7_UkAoYyOZJayaA_ZrsQ0_Ab8kor1leJqrCA/export?format=csv&gid=${s.gid}`;
      const csv = await fetchCsv(url);
      fs.writeFileSync(path.join(outDir, `${s.name.replace(/\s+/g, '_')}.csv`), csv, 'utf8');
      console.log(`Saved ${s.name}`);
    } catch (e) {
      console.error(`Failed ${s.name}:`, e.message);
    }
  }
}

run();
