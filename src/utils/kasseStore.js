const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'kasseData.json');

function load() {
  try {
    return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  } catch {
    return { gruen: 0, schwarz: 0 };
  }
}

function save(data) {
  fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

function isValidType(type) {
  return type === 'gruen' || type === 'schwarz';
}

function getBalances() {
  const data = load();
  return { gruen: data.gruen || 0, schwarz: data.schwarz || 0 };
}

// Erhöht den Kontostand eines Geld-Typs ('gruen' oder 'schwarz').
function addMoney(type, amount) {
  if (!isValidType(type)) return null;
  const data = load();
  data[type] = (data[type] || 0) + amount;
  save(data);
  return data[type];
}

// Verringert den Kontostand eines Geld-Typs. Gibt null zurück, wenn der
// Bestand nicht ausreicht.
function removeMoney(type, amount) {
  if (!isValidType(type)) return null;
  const data = load();
  const current = data[type] || 0;
  if (current < amount) return null;

  data[type] = current - amount;
  save(data);
  return data[type];
}

function getListMessageId() {
  return load().listMessageId || null;
}

function setListMessageId(messageId) {
  const data = load();
  data.listMessageId = messageId;
  save(data);
}

module.exports = { getBalances, addMoney, removeMoney, getListMessageId, setListMessageId, isValidType };
