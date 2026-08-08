const { SlashCommandBuilder, ApplicationCommandOptionType } = require('discord.js');
const config = require('../config.json');
const { baseEmbed, errorEmbed, successEmbed } = require('../utils/embeds');
const { canUseAdminCommands } = require('../utils/permissions');

function buildCommandLines(client) {
  const lines = [];

  for (const command of client.commands.values()) {
    const json = command.data.toJSON();
    const subcommands = (json.options || []).filter(
      option => option.type === ApplicationCommandOptionType.Subcommand
    );

    if (subcommands.length > 0) {
      for (const sub of subcommands) {
        lines.push(`\`/${json.name} ${sub.name}\` — ${sub.description}`);
      }
    } else {
      lines.push(`\`/${json.name}\` — ${json.description}`);
    }
  }

  return lines.sort((a, b) => a.localeCompare(b));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('command-liste')
    .setDescription('Postet eine Übersicht aller verfügbaren Befehle.'),

  async execute(interaction) {
    if (!canUseAdminCommands(interaction.member)) {
      await interaction.reply({
        embeds: [errorEmbed('Du hast keine Berechtigung, diesen Befehl zu benutzen.', interaction.client)],
        ephemeral: true
      });
      return;
    }

    if (!config.commandListChannelId || config.commandListChannelId.startsWith('CHANNEL_ID')) {
      await interaction.reply({
        embeds: [errorEmbed('Es ist kein Command-Liste-Channel (`commandListChannelId`) in der config.json eingetragen.', interaction.client)],
        ephemeral: true
      });
      return;
    }

    const channel = await interaction.guild.channels.fetch(config.commandListChannelId).catch(() => null);
    if (!channel || !channel.isTextBased()) {
      await interaction.reply({
        embeds: [errorEmbed('Der konfigurierte Command-Liste-Channel wurde nicht gefunden.', interaction.client)],
        ephemeral: true
      });
      return;
    }

    const lines = buildCommandLines(interaction.client);
    const embed = baseEmbed(interaction.client)
      .setTitle('📖 Befehlsübersicht')
      .setDescription(lines.join('\n'));

    await channel.send({ embeds: [embed] });

    await interaction.reply({
      embeds: [successEmbed(`Die Befehlsübersicht wurde in ${channel} gepostet.`, interaction.client)],
      ephemeral: true
    });
  }
};
