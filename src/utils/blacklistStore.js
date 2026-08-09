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

// Nutzer-Einträge werden über die User-ID identifiziert, reine
// Fraktions-Einträge (ohne Nutzer) über den normalisierten Fraktionsnamen.
function buildKey(userId, faction) {
  return userId || `faction:${(faction || '').toLowerCase()}`;
}

function getAll() {
  const data = load();
  return data.entries.map(e => ({ ...e, key: e.key || buildKey(e.userId, e.faction) }));
}

function addEntry(entry) {
  const data = load();
  const key = buildKey(entry.userId, entry.faction);
  data.entries = data.entries.filter(e => buildKey(e.userId, e.faction) !== key);
  data.entries.push({ ...entry, key });
  save(data);
}

function removeEntry(key) {
  const data = load();
  const idx = data.entries.findIndex(e => (e.key || buildKey(e.userId, e.faction)) === key);
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
