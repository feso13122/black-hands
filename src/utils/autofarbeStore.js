const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'autofarbeData.json');
const CATEGORIES = ['primaryColor', 'secondaryColor', 'sticker'];

function load() {
  try {
    return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  } catch {
    return { primaryColor: null, secondaryColor: null, sticker: null, listMessageId: null };
  }
}

function save(data) {
  fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

function getAll() {
  const data = load();
  return {
    primaryColor: data.primaryColor,
    secondaryColor: data.secondaryColor,
    sticker: data.sticker
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
