const { SlashCommandBuilder } = require('discord.js');
const { errorEmbed, successEmbed } = require('../utils/embeds');
const { canUseAdminCommands } = require('../utils/permissions');
const twitchStore = require('../utils/twitchStore');
const { getUser } = require('../utils/twitchApi');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addstreamer')
    .setDescription('Fügt einen Twitch-Streamer zur Live-Überwachung hinzu.')
    .addStringOption(option =>
      option.setName('username').setDescription('Der Twitch-Benutzername').setRequired(true)
    ),

  async execute(interaction) {
    if (!canUseAdminCommands(interaction.member)) {
      await interaction.reply({
        embeds: [errorEmbed('Du hast keine Berechtigung, diesen Befehl zu benutzen.', interaction.client)],
        ephemeral: true
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    const username = interaction.options.getString('username').toLowerCase();

    const userInfo = await getUser(username);
    if (!userInfo) {
      await interaction.editReply({
        embeds: [errorEmbed(`Twitch-Benutzer **${username}** wurde nicht gefunden.`, interaction.client)]
      });
      return;
    }

    const added = twitchStore.addStreamer(username);
    if (!added) {
      await interaction.editReply({
        embeds: [errorEmbed(`**${username}** ist bereits in der Liste.`, interaction.client)]
      });
      return;
    }

    await interaction.editReply({
      embeds: [successEmbed(`**${username}** wurde zur Live-Überwachung hinzugefügt.`, interaction.client)]
    });
  }
};
