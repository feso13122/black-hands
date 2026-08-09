const { SlashCommandBuilder } = require('discord.js');
const config = require('../config.json');
const { baseEmbed, errorEmbed, successEmbed } = require('../utils/embeds');
const { canUseLager } = require('../utils/permissions');
const inventoryStore = require('../utils/inventoryStore');
const { postInventoryList, postLagerLog } = require('../utils/lagerPanel');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lager')
    .setDescription('Lagerbestand verwalten')
    .addSubcommand(sub =>
      sub
        .setName('rein')
        .setDescription('Legt Items ins Lager')
        .addStringOption(o => o.setName('item').setDescription('Name des Items').setRequired(true))
        .addIntegerOption(o => o.setName('menge').setDescription('Menge').setRequired(true).setMinValue(1))
    )
    .addSubcommand(sub =>
      sub
        .setName('raus')
        .setDescription('Nimmt Items aus dem Lager')
        .addStringOption(o =>
          o.setName('item').setDescription('Name des Items').setRequired(true).setAutocomplete(true)
        )
        .addIntegerOption(o => o.setName('menge').setDescription('Menge').setRequired(true).setMinValue(1))
    )
    .addSubcommand(sub =>
      sub
        .setName('liste')
        .setDescription('Aktualisiert die Lagerliste-Nachricht')
    ),

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused().toLowerCase();
    const choices = inventoryStore.getAll()
      .filter(i => i.name.toLowerCase().includes(focused))
      .slice(0, 25)
      .map(i => ({ name: `${i.name} (${i.quantity}x vorhanden)`, value: i.name }));

    await interaction.respond(choices);
  },

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

    const item = interaction.options.getString('item').trim();
    const menge = interaction.options.getInteger('menge');

    if (sub === 'rein') {
      const total = inventoryStore.addStock(item, menge);
      await postInventoryList(interaction.client);
      await postLagerLog(interaction.client, { action: 'rein', executor: interaction.user, results: [{ item, menge, total }] });

      await interaction.reply({
        embeds: [successEmbed(`**${menge}x ${item}** wurde ins Lager gelegt. Neuer Bestand: **${total}x**.`, interaction.client)],
        ephemeral: true
      });
      return;
    }

    if (sub === 'raus') {
      const total = inventoryStore.removeStock(item, menge);

      if (total === null) {
        await interaction.reply({
          embeds: [errorEmbed(`**${item}** ist nicht im Lager oder der Bestand reicht nicht aus.`, interaction.client)],
          ephemeral: true
        });
        return;
      }

      await postInventoryList(interaction.client);
      await postLagerLog(interaction.client, { action: 'raus', executor: interaction.user, results: [{ item, menge, total }] });

      await interaction.reply({
        embeds: [successEmbed(`**${menge}x ${item}** wurde aus dem Lager genommen. Neuer Bestand: **${total}x**.`, interaction.client)],
        ephemeral: true
      });
    }
  }
};
