const { deployCommands } = require('../utils/deployCommands');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`✅ Eingeloggt als ${client.user.tag}`);
    client.user.setActivity('über den Server', { type: 3 });

    try {
      const commands = await deployCommands(client);
      console.log(`✅ ${commands.length} Slash-Command(s) registriert:`);
      for (const command of commands) {
        console.log(`   • /${command.name} — ${command.description}`);
      }
    } catch (err) {
      console.error('❌ Fehler beim automatischen Registrieren der Slash-Commands:', err);
    }
  }
};
