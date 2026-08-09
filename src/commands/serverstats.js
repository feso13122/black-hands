const { SlashCommandBuilder } = require('discord.js');
const { errorEmbed, successEmbed } = require('../utils/embeds');
const { canUseAdminCommands } = require('../utils/permissions');
const serverStatsStore = require('../utils/serverStatsStore');
const { createServerStatsChannel, updateServerStatsChannel } = require('../utils/serverStats');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverstats')
    .setDescription('Erstellt/aktualisiert den Channel mit der Mitgliederzahl (ohne Bots).'),

  async execute(interaction) {
    if (!canUseAdminCommands(interaction.member)) {
      await interaction.reply({
        embeds: [errorEmbed('Du hast keine Berechtigung, diesen Befehl zu benutzen.', interaction.client)],
        ephemeral: true
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    const existingChannelId = serverStatsStore.getChannelId();
    const existingChannel = existingChannelId
      ? await interaction.guild.channels.fetch(existingChannelId).catch(() => null)
      : null;

    if (existingChannel) {
      const updated = await updateServerStatsChannel(interaction.guild);
      await interaction.editReply({
        embeds: [successEmbed(`Der Server-Stats-Channel existiert bereits: ${updated}. Er wurde jetzt aktualisiert und läuft danach automatisch alle 10 Minuten weiter.`, interaction.client)]
      });
      return;
    }

    const channel = await createServerStatsChannel(interaction.guild);

    await interaction.editReply({
      embeds: [successEmbed(`Server-Stats-Channel wurde erstellt: ${channel}. Er zeigt die Mitgliederzahl (ohne Bots) und aktualisiert sich automatisch alle 10 Minuten.`, interaction.client)]
    });
  }
};
