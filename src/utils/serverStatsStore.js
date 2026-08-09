const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'serverStatsData.json');

function load() {
  try {
    return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  } catch {
    return { memberCountChannelId: null, roleCountChannelId: null };
  }
}

function save(data) {
  fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

function getMemberCountChannelId() {
  return load().memberCountChannelId || null;
}

function setMemberCountChannelId(channelId) {
  const data = load();
  data.memberCountChannelId = channelId;
  save(data);
}

function getRoleCountChannelId() {
  return load().roleCountChannelId || null;
}

function setRoleCountChannelId(channelId) {
  const data = load();
  data.roleCountChannelId = channelId;
  save(data);
}

module.exports = {
  getMemberCountChannelId,
  setMemberCountChannelId,
  getRoleCountChannelId,
  setRoleCountChannelId
};
