const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'allianceData.json');

function load() {
  try {
    return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  } catch {
    return { alliances: [] };
  }
}

function save(data) {
  fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

function getAll() {
  return load().alliances;
}

function addAlliance(faction, createdBy) {
  const data = load();
  data.alliances = data.alliances.filter(a => a.faction.toLowerCase() !== faction.toLowerCase());
  data.alliances.push({ faction, createdBy, createdAt: Date.now() });
  save(data);
}

function removeAlliance(faction) {
  const data = load();
  const idx = data.alliances.findIndex(a => a.faction.toLowerCase() === faction.toLowerCase());
  if (idx === -1) return null;
  const [removed] = data.alliances.splice(idx, 1);
  save(data);
  return removed;
}

module.exports = { getAll, addAlliance, removeAlliance };
