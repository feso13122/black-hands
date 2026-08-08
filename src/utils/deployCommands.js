const { REST, Routes } = require('discord.js');

async function deployCommands(client) {
  const commands = [...client.commands.values()].map(cmd => cmd.data.toJSON());
  const rest = new REST().setToken(process.env.BOT_TOKEN);

  await rest.put(
    Routes.applicationGuildCommands(client.user.id, process.env.BOT_GUILDID),
    { body: commands }
  );

  return commands;
}

module.exports = { deployCommands };
