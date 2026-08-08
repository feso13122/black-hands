const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'absenceData.json');

function load() {
  try {
    return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  } catch {
    return { absences: [] };
  }
}

function save(data) {
  fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

function getAll() {
  return load().absences.sort((a, b) => a.until - b.until);
}

function addAbsence(entry) {
  const data = load();
  data.absences = data.absences.filter(a => a.userId !== entry.userId);
  data.absences.push(entry);
  save(data);
}

function getByUser(userId) {
  return load().absences.find(a => a.userId === userId) || null;
}

function removeAbsence(userId) {
  const data = load();
  const idx = data.absences.findIndex(a => a.userId === userId);
  if (idx === -1) return null;
  const [removed] = data.absences.splice(idx, 1);
  save(data);
  return removed;
}

// Entfernt alle abgelaufenen Abmeldungen und gibt sie zurück.
function removeExpired() {
  const data = load();
  const now = Date.now();
  const expired = data.absences.filter(a => a.until <= now);
  if (expired.length > 0) {
    data.absences = data.absences.filter(a => a.until > now);
    save(data);
  }
  return expired;
}

function getListMessageId() {
  return load().listMessageId || null;
}

function setListMessageId(messageId) {
  const data = load();
  data.listMessageId = messageId;
  save(data);
}

module.exports = {
  getAll,
  getByUser,
  addAbsence,
  removeAbsence,
  removeExpired,
  getListMessageId,
  setListMessageId
};
