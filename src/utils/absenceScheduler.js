const absenceStore = require('./absenceStore');
const { updateAbsencePanel } = require('./absencePanel');

const CHECK_INTERVAL_MS = 60 * 1000;

function startAbsenceScheduler(client) {
  setInterval(async () => {
    const expired = absenceStore.removeExpired();
    if (expired.length > 0) {
      await updateAbsencePanel(client).catch(err => {
        console.error('Fehler beim Aktualisieren des Abmelde-Panels:', err.message);
      });
    }
  }, CHECK_INTERVAL_MS);
}

module.exports = { startAbsenceScheduler };
