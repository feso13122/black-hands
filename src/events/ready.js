const { ActivityType } = require('discord.js');
const { deployCommands } = require('../utils/deployCommands');
const { startAbsenceScheduler } = require('../utils/absenceScheduler');
const { startTwitchScheduler } = require('../utils/twitchScheduler');
const { startServerStatsScheduler } = require('../utils/serverStatsScheduler');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`✅ Eingeloggt als ${client.user.tag}`);

    client.user.setPresence({
      activities: [{
        name: 'Black Hands System By NXMZ Feso',
        type: ActivityType.Streaming,
        url: 'https://www.twitch.tv/the_offical_feso2'
      }],
      status: 'online',
    });

    try {
      const commands = await deployCommands(client);
      console.log(`✅ ${commands.length} Slash-Command(s) registriert:`);
      for (const command of commands) {
        console.log(`   • /${command.name} — ${command.description}`);
      }
    } catch (err) {
      console.error('❌ Fehler beim automatischen Registrieren der Slash-Commands:', err);
    }

    startAbsenceScheduler(client);
    startTwitchScheduler(client);
    startServerStatsScheduler(client);
  }
};
