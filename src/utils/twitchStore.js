const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'twitchStreamers.json');

function load() {
  try {
    return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  } catch {
    return [];
  }
}

function save(streamers) {
  fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify(streamers, null, 2));
}

function getAll() {
  return load();
}

function addStreamer(username) {
  const streamers = load();
  if (streamers.includes(username)) return false;
  streamers.push(username);
  save(streamers);
  return true;
}

function removeStreamer(username) {
  const streamers = load();
  if (!streamers.includes(username)) return false;
  save(streamers.filter(s => s !== username));
  return true;
}

module.exports = { getAll, addStreamer, removeStreamer };
