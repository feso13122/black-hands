const { SlashCommandBuilder } = require('discord.js');
const { baseEmbed, errorEmbed } = require('../utils/embeds');
const { canUseAdminCommands } = require('../utils/permissions');
const twitchStore = require('../utils/twitchStore');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('streamers')
    .setDescription('Zeigt alle überwachten Twitch-Streamer an.'),

  async execute(interaction) {
    if (!canUseAdminCommands(interaction.member)) {
      await interaction.reply({
        embeds: [errorEmbed('Du hast keine Berechtigung, diesen Befehl zu benutzen.', interaction.client)],
        ephemeral: true
      });
      return;
    }

    const streamers = twitchStore.getAll();
    const embed = baseEmbed(interaction.client)
      .setColor('#9146FF')
      .setTitle('📋 Überwachte Twitch-Streamer')
      .setDescription(
        streamers.length === 0
          ? 'Die Streamerliste ist leer.'
          : streamers.map((s, i) => `${i + 1}. ${s}`).join('\n')
      );

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
