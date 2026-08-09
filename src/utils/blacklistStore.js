const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'blacklistData.json');

function load() {
  try {
    return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  } catch {
    return { entries: [] };
  }
}

function save(data) {
  fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

function getAll() {
  return load().entries;
}

function addEntry(entry) {
  const data = load();
  data.entries = data.entries.filter(e => e.userId !== entry.userId);
  data.entries.push(entry);
  save(data);
}

function removeEntry(userId) {
  const data = load();
  const idx = data.entries.findIndex(e => e.userId === userId);
  if (idx === -1) return null;
  const [removed] = data.entries.splice(idx, 1);
  save(data);
  return removed;
}

function getListMessageId() {
  return load().listMessageId || null;
}

function setListMessageId(messageId) {
  const data = load();
  data.listMessageId = messageId;
  save(data);
}

module.exports = { getAll, addEntry, removeEntry, getListMessageId, setListMessageId };
