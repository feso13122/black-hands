const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'sanctionsData.json');

function load() {
  try {
    return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  } catch {
    return { sanctions: [] };
  }
}

function save(data) {
  fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

function getAll() {
  return load().sanctions;
}

function addSanction(entry) {
  const data = load();
  data.sanctions = data.sanctions.filter(s => s.userId !== entry.userId);
  data.sanctions.push(entry);
  save(data);
}

function removeSanction(userId) {
  const data = load();
  const idx = data.sanctions.findIndex(s => s.userId === userId);
  if (idx === -1) return null;
  const [removed] = data.sanctions.splice(idx, 1);
  save(data);
  return removed;
}

module.exports = { getAll, addSanction, removeSanction };
