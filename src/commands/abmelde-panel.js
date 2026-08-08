const { SlashCommandBuilder } = require('discord.js');
const { errorEmbed, successEmbed } = require('../utils/embeds');
const { canUseAdminCommands } = require('../utils/permissions');
const { updateAbsencePanel } = require('../utils/absencePanel');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('abmelde-panel')
    .setDescription('Postet/aktualisiert das Abmelde-Panel mit der Liste aller Abgemeldeten.'),

  async execute(interaction) {
    if (!canUseAdminCommands(interaction.member)) {
      await interaction.reply({
        embeds: [errorEmbed('Du hast keine Berechtigung, diesen Befehl zu benutzen.', interaction.client)],
        ephemeral: true
      });
      return;
    }

    const channel = await updateAbsencePanel(interaction.client);
    if (!channel) {
      await interaction.reply({
        embeds: [errorEmbed('Es ist kein Abmelde-Channel (`absenceChannelId`) in der config.json eingetragen oder er wurde nicht gefunden.', interaction.client)],
        ephemeral: true
      });
      return;
    }

    await interaction.reply({
      embeds: [successEmbed(`Das Abmelde-Panel wurde in ${channel} gepostet/aktualisiert.`, interaction.client)],
      ephemeral: true
    });
  }
};
