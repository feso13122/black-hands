const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { REST, Routes } = require('discord.js');

if (!process.env.BOT_TOKEN || !process.env.BOT_CLIENTID || !process.env.BOT_GUILDID) {
  console.error('❌ Bitte trage BOT_TOKEN, BOT_CLIENTID und BOT_GUILDID in die .env-Datei ein.');
  process.exit(1);
}

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'))) {
  const command = require(path.join(commandsPath, file));
  commands.push(command.data.toJSON());
}

const rest = new REST().setToken(process.env.BOT_TOKEN);

(async () => {
  try {
    console.log(`⏳ Registriere ${commands.length} Slash-Command(s)...`);

    await rest.put(
      Routes.applicationGuildCommands(process.env.BOT_CLIENTID, process.env.BOT_GUILDID),
      { body: commands }
    );

    console.log('✅ Slash-Commands erfolgreich registriert.');
  } catch (err) {
    console.error('❌ Fehler beim Registrieren der Commands:', err);
  }
})();
