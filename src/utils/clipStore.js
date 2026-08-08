const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'clipData.json');

function load() {
  try {
    return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  } catch {
    return { userChannels: {}, unlockedUsers: [] };
  }
}

function save(data) {
  fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

function getUserChannel(userId) {
  return load().userChannels[userId] || null;
}

function getAllUserChannels() {
  return load().userChannels;
}

function setUserChannel(userId, channelId) {
  const data = load();
  data.userChannels[userId] = channelId;
  save(data);
}

function removeUserChannel(userId) {
  const data = load();
  delete data.userChannels[userId];
  save(data);
}

function isUnlocked(userId) {
  return load().unlockedUsers.includes(userId);
}

function unlockUser(userId) {
  const data = load();
  if (!data.unlockedUsers.includes(userId)) data.unlockedUsers.push(userId);
  save(data);
}

function consumeUnlock(userId) {
  const data = load();
  data.unlockedUsers = data.unlockedUsers.filter(id => id !== userId);
  save(data);
}

module.exports = {
  getUserChannel,
  getAllUserChannels,
  setUserChannel,
  removeUserChannel,
  isUnlocked,
  unlockUser,
  consumeUnlock
};
