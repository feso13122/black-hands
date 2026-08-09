const { ensureStatsChannels } = require('./serverStats');

// Discord limitiert Channel-Umbenennungen auf ca. 2 pro 10 Minuten -
// deshalb hier bewusst kein kürzeres Intervall.
const UPDATE_INTERVAL_MS = 10 * 60 * 1000;

function startServerStatsScheduler(client) {
  setInterval(() => {
    for (const guild of client.guilds.cache.values()) {
      ensureStatsChannels(guild).catch(err => {
        console.error('Fehler beim Server-Stats-Update:', err.message);
      });
    }
  }, UPDATE_INTERVAL_MS);
}

module.exports = { startServerStatsScheduler };
