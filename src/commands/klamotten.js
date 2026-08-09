const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { errorEmbed } = require('../utils/embeds');
const { canUseAdminCommands } = require('../utils/permissions');
const { updateKlamottenPanel, CATEGORY_LABELS } = require('../utils/klamottenPanel');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('klamotten')
    .setDescription('Aktualisiert unsere Kleidung (Torso, Hose, Shirt, Aufkleber).'),

  async execute(interaction) {
    if (!canUseAdminCommands(interaction.member)) {
      await interaction.reply({
        embeds: [errorEmbed('Du hast keine Berechtigung, diesen Befehl zu benutzen.', interaction.client)],
        ephemeral: true
      });
      return;
    }

    const channel = await updateKlamottenPanel(interaction.client);
    if (!channel) {
      await interaction.reply({
        embeds: [errorEmbed('Es ist kein Klamotten-Channel (`klamottenListChannelId`) in der config.json eingetragen.', interaction.client)],
        ephemeral: true
      });
      return;
    }

    const menu = new StringSelectMenuBuilder()
      .setCustomId('klamotten_select')
      .setPlaceholder('Welche Kategorie aktualisieren?')
      .addOptions(
        Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ label, value }))
      );

    await interaction.reply({
      content: `Panel: ${channel}\nWähle eine Kategorie aus, um ihren Wert zu ändern:`,
      components: [new ActionRowBuilder().addComponents(menu)],
      ephemeral: true
    });
  }
};
