const { SlashCommandBuilder } = require('discord.js');
const config = require('../config.json');
const { baseEmbed, errorEmbed, successEmbed } = require('../utils/embeds');
const { canUseLager } = require('../utils/permissions');
const inventoryStore = require('../utils/inventoryStore');
const { postInventoryList, postLagerLog } = require('../utils/lagerPanel');

const MAX_ITEMS = 20;

function addItemMengeOptions(sub) {
  sub.addStringOption(o => o.setName('item1').setDescription('Name des Items').setRequired(true));
  sub.addIntegerOption(o => o.setName('menge1').setDescription('Menge').setRequired(true).setMinValue(1));
  for (let i = 2; i <= MAX_ITEMS; i++) {
    sub.addStringOption(o => o.setName(`item${i}`).setDescription('Name des Items').setRequired(false));
    sub.addIntegerOption(o => o.setName(`menge${i}`).setDescription('Menge').setRequired(false).setMinValue(1));
  }
  return sub;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lager')
    .setDescription('Lagerbestand verwalten')
    .addSubcommand(sub => addItemMengeOptions(sub.setName('rein').setDescription('Legt bis zu 20 Items ins Lager')))
    .addSubcommand(sub => addItemMengeOptions(sub.setName('raus').setDescription('Nimmt bis zu 20 Items aus dem Lager')))
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

    const results = [];
    const errors = [];

    for (let i = 1; i <= MAX_ITEMS; i++) {
      const item = interaction.options.getString(`item${i}`);
      const menge = interaction.options.getInteger(`menge${i}`);

      if (!item && !menge) continue;

      if (!item || !menge) {
        errors.push(`❌ Feld ${i}: sowohl \`item${i}\` als auch \`menge${i}\` müssen gesetzt sein`);
        continue;
      }

      const name = item.trim();

      if (sub === 'rein') {
        const total = inventoryStore.addStock(name, menge);
        results.push({ item: name, menge, total });
      } else {
        const total = inventoryStore.removeStock(name, menge);
        if (total === null) {
          errors.push(`❌ **${name}** — nicht im Lager oder Bestand reicht nicht aus`);
        } else {
          results.push({ item: name, menge, total });
        }
      }
    }

    if (results.length > 0) {
      await postInventoryList(interaction.client);
      await postLagerLog(interaction.client, { action: sub, executor: interaction.user, results });
    }

    const summaryLines = [
      ...results.map(r => `✅ **${r.item}** — ${r.menge}x — Neuer Bestand: ${r.total}x`),
      ...errors
    ];

    const summaryEmbed = baseEmbed(interaction.client)
      .setColor(errors.length > 0 ? '#FEE75C' : '#57F287')
      .setTitle(sub === 'rein' ? '📥 Lager: Ware rein' : '📤 Lager: Ware raus')
      .setDescription(summaryLines.join('\n').slice(0, 4000));

    await interaction.reply({ embeds: [summaryEmbed], ephemeral: true });
  }
};
