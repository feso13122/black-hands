const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'inventoryData.json');

function load() {
  try {
    return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  } catch {
    return { items: [] };
  }
}

function save(data) {
  fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

function getAll() {
  return load().items.sort((a, b) => a.name.localeCompare(b.name));
}

// Erhöht die Menge eines Items (legt es an, falls noch nicht vorhanden).
function addStock(name, amount) {
  const data = load();
  let item = data.items.find(i => i.name.toLowerCase() === name.toLowerCase());
  if (!item) {
    item = { name, quantity: 0 };
    data.items.push(item);
  }
  item.quantity += amount;
  save(data);
  return item.quantity;
}

// Verringert die Menge eines Items. Gibt null zurück, wenn das Item nicht
// existiert oder nicht genug Bestand vorhanden ist. Entfernt das Item
// komplett, sobald die Menge auf 0 fällt.
function removeStock(name, amount) {
  const data = load();
  const item = data.items.find(i => i.name.toLowerCase() === name.toLowerCase());
  if (!item || item.quantity < amount) return null;

  item.quantity -= amount;
  if (item.quantity === 0) {
    data.items = data.items.filter(i => i !== item);
  }
  save(data);
  return item.quantity;
}

function getListMessageId() {
  return load().listMessageId || null;
}

function setListMessageId(messageId) {
  const data = load();
  data.listMessageId = messageId;
  save(data);
}

module.exports = { getAll, addStock, removeStock, getListMessageId, setListMessageId };
