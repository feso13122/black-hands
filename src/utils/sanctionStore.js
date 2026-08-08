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

// Alle Sanktionen (offen und bezahlt) - komplette Historie, wird nie geloescht.
function getAll() {
  return load().sanctions;
}

// Nur die aktuell offenen (unbezahlten) Sanktionen fuer die Sanktionsliste.
function getOpen() {
  return load().sanctions.filter(s => s.status === 'open');
}

function addSanction(entry) {
  const data = load();
  // Eine evtl. bestehende OFFENE Sanktion desselben Nutzers wird ersetzt,
  // bereits bezahlte Sanktionen bleiben als Historie erhalten.
  data.sanctions = data.sanctions.filter(s => !(s.userId === entry.userId && s.status === 'open'));
  data.sanctions.push({ ...entry, status: 'open', paidBy: null, paidAt: null });
  save(data);
}

function markPaid(userId, paidBy) {
  const data = load();
  const sanction = data.sanctions.find(s => s.userId === userId && s.status === 'open');
  if (!sanction) return null;

  sanction.status = 'paid';
  sanction.paidBy = paidBy;
  sanction.paidAt = Date.now();
  save(data);
  return sanction;
}

function getListMessageId() {
  return load().listMessageId || null;
}

function setListMessageId(messageId) {
  const data = load();
  data.listMessageId = messageId;
  save(data);
}

module.exports = { getAll, getOpen, addSanction, markPaid, getListMessageId, setListMessageId };
