const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const config = require('../config.json');
const { errorEmbed, successEmbed } = require('../utils/embeds');
const { canUseLager } = require('../utils/permissions');
const { postInventoryList } = require('../utils/lagerPanel');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lager')
    .setDescription('Lagerbestand verwalten')
    .addSubcommand(sub =>
      sub
        .setName('rein')
        .setDescription('Legt bis zu 20 Items auf einmal ins Lager (öffnet ein Formular)')
    )
    .addSubcommand(sub =>
      sub
        .setName('raus')
        .setDescription('Nimmt bis zu 20 Items auf einmal aus dem Lager (öffnet ein Formular)')
    )
    .addSubcommand(sub =>
      sub
        .setName('liste')
        .setDescription('Aktualisiert die Lagerliste-Nachricht')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'liste') {
      // /lager liste läuft im allgemeinen Command-Channel wie alle anderen
      // normalen Commands, nicht im Lager-Channel.
      if (
        config.commandChannelId &&
        !config.commandChannelId.startsWith('CHANNEL_ID') &&
        interaction.channelId !== config.commandChannelId
      ) {
        await interaction.reply({
          embeds: [errorEmbed(`\`/lager liste\` kann nur in <#${config.commandChannelId}> benutzt werden.`, interaction.client)],
          ephemeral: true
        });
        return;
      }

      if (!canUseLager(interaction.member)) {
        await interaction.reply({
          embeds: [errorEmbed('Du hast keine Berechtigung, diesen Befehl zu benutzen.', interaction.client)],
          ephemeral: true
        });
        return;
      }

      const channel = await postInventoryList(interaction.client);
      if (!channel) {
        await interaction.reply({
          embeds: [errorEmbed('Der Lagerliste-Channel (`lagerListChannelId`) wurde nicht gefunden.', interaction.client)],
          ephemeral: true
        });
        return;
      }

      await interaction.reply({
        embeds: [successEmbed(`Die Lagerliste in ${channel} wurde aktualisiert.`, interaction.client)],
        ephemeral: true
      });
      return;
    }

    // /lager rein und /lager raus: eigene Channel-Sperre auf
    // lagerCommandChannelId, aber KEINE Rollen-/Admin-Beschränkung -
    // jeder Nutzer darf sie dort benutzen.
    if (
      config.lagerCommandChannelId &&
      !config.lagerCommandChannelId.startsWith('CHANNEL_ID') &&
      interaction.channelId !== config.lagerCommandChannelId
    ) {
      await interaction.reply({
        embeds: [errorEmbed(`\`/lager ${sub}\` kann nur in <#${config.lagerCommandChannelId}> benutzt werden.`, interaction.client)],
        ephemeral: true
      });
      return;
    }

    const modal = new ModalBuilder()
      .setCustomId(sub === 'rein' ? 'lager_rein_modal' : 'lager_raus_modal')
      .setTitle(sub === 'rein' ? 'Items ins Lager legen' : 'Items aus dem Lager nehmen');

    const itemsInput = new TextInputBuilder()
      .setCustomId('items')
      .setLabel('Ein Item pro Zeile: Name Menge (max. 20 Zeilen)')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Pistole 5\nSturmgewehr 2\nVerband 20')
      .setMaxLength(2000)
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(itemsInput));
    await interaction.showModal(modal);
  }
};
