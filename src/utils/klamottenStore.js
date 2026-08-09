const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'klamottenData.json');
const CATEGORIES = ['torso', 'hose', 'shirt', 'aufkleber'];

function load() {
  try {
    return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  } catch {
    return { torso: null, hose: null, shirt: null, aufkleber: null, listMessageId: null };
  }
}

function save(data) {
  fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

function getAll() {
  const data = load();
  return {
    torso: data.torso,
    hose: data.hose,
    shirt: data.shirt,
    aufkleber: data.aufkleber
  };
}

function set(category, value) {
  if (!CATEGORIES.includes(category)) return;
  const data = load();
  data[category] = value;
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

module.exports = { CATEGORIES, getAll, set, getListMessageId, setListMessageId };
