const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, '..', 'data', 'lagerInfoData.json');

function loadData() {
  if (!fs.existsSync(dataFile)) {
    return { infoMessageId: null };
  }
  try {
    return JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
  } catch {
    return { infoMessageId: null };
  }
}

function saveData(data) {
  const dir = path.dirname(dataFile);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

module.exports = {
  getInfoMessageId() {
    const data = loadData();
    return data.infoMessageId || null;
  },

  setInfoMessageId(messageId) {
    const data = loadData();
    data.infoMessageId = messageId;
    saveData(data);
  }
};
