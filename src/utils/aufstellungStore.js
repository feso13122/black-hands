const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'aufstellungData.json');

function load() {
  try {
    return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  } catch {
    return { polls: {} };
  }
}

function save(data) {
  fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

function getPoll(messageId) {
  const data = load();
  return data.polls[messageId] || null;
}

function createPoll(messageId, unix, grund = '') {
  const data = load();
  data.polls[messageId] = { unix, grund, da: [], nichtDa: [] };
  save(data);
  return data.polls[messageId];
}

function setVote(messageId, userId, choice) {
  const data = load();
  const poll = data.polls[messageId];
  if (!poll) return null;

  poll.da = poll.da.filter(id => id !== userId);
  poll.nichtDa = poll.nichtDa.filter(id => id !== userId);
  poll[choice].push(userId);

  save(data);
  return poll;
}

module.exports = { getPoll, createPoll, setVote };
