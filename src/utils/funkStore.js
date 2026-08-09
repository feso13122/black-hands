const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'funkData.json');

function load() {
  try {
    return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  } catch {
    return { funk: null, passwort: null, listMessageId: null };
  }
}

function save(data) {
  fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

function get() {
  const data = load();
  return { funk: data.funk, passwort: data.passwort };
}

function set(funk, passwort) {
  const data = load();
  data.funk = funk;
  data.passwort = passwort;
  save(data);
}

function getListMessageId() {
  return load().listMessageId || null;
}

function setListMessageId(messageId) {
  const data = load();
  data.listMessageId = messageId;
  save(data);
}

module.exports = { get, set, getListMessageId, setListMessageId };
