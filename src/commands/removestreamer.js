const { SlashCommandBuilder } = require('discord.js');
const { errorEmbed, successEmbed } = require('../utils/embeds');
const { canUseAdminCommands } = require('../utils/permissions');
const twitchStore = require('../utils/twitchStore');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removestreamer')
    .setDescription('Entfernt einen Twitch-Streamer von der Live-Überwachung.')
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

    const username = interaction.options.getString('username').toLowerCase();
    const removed = twitchStore.removeStreamer(username);

    if (!removed) {
      await interaction.reply({
        embeds: [errorEmbed(`**${username}** ist nicht in der Liste.`, interaction.client)],
        ephemeral: true
      });
      return;
    }

    await interaction.reply({
      embeds: [successEmbed(`**${username}** wurde von der Live-Überwachung entfernt.`, interaction.client)],
      ephemeral: true
    });
  }
};
