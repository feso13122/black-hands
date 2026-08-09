const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { errorEmbed } = require('../utils/embeds');
const { canUseAdminCommands } = require('../utils/permissions');
const { updateAutofarbePanel, CATEGORY_LABELS } = require('../utils/autofarbePanel');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('autofarbe')
    .setDescription('Aktualisiert unsere Autofarbe (Primary Color, Secondary Color, 1. Sticker).'),

  async execute(interaction) {
    if (!canUseAdminCommands(interaction.member)) {
      await interaction.reply({
        embeds: [errorEmbed('Du hast keine Berechtigung, diesen Befehl zu benutzen.', interaction.client)],
        ephemeral: true
      });
      return;
    }

    const channel = await updateAutofarbePanel(interaction.client);
    if (!channel) {
      await interaction.reply({
        embeds: [errorEmbed('Es ist kein Autofarbe-Channel (`autofarbeListChannelId`) in der config.json eingetragen.', interaction.client)],
        ephemeral: true
      });
      return;
    }

    const menu = new StringSelectMenuBuilder()
      .setCustomId('autofarbe_select')
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
