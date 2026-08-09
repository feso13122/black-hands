const { SlashCommandBuilder } = require('discord.js');
const config = require('../config.json');
const { baseEmbed, errorEmbed, successEmbed } = require('../utils/embeds');
const { canUseLager } = require('../utils/permissions');
const inventoryStore = require('../utils/inventoryStore');
const { postInventoryList, postLagerLog } = require('../utils/lagerPanel');

const MAX_ITEMS = 20;

// Discord erlaubt max. 25 Optionen pro (Sub-)Command - getrennte item/menge-
// Felder für 20 Items wären 40 Optionen und damit nicht möglich. Deshalb ein
// Feld pro Item im Format "Name Menge" (z. B. "Pistole 5").
function addItemOptions(sub) {
  for (let i = 1; i <= MAX_ITEMS; i++) {
    sub.addStringOption(o =>
      o
        .setName(`item${i}`)
        .setDescription('Format: Name Menge, z. B. "Pistole 5"')
        .setRequired(i === 1)
    );
  }
  return sub;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lager')
    .setDescription('Lagerbestand verwalten')
    .addSubcommand(sub => addItemOptions(sub.setName('rein').setDescription('Legt bis zu 20 Items ins Lager (item1 Pflicht, item2-20 optional)')))
    .addSubcommand(sub => addItemOptions(sub.setName('raus').setDescription('Nimmt bis zu 20 Items aus dem Lager (item1 Pflicht, item2-20 optional)')))
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

    const lines = [];
    for (let i = 1; i <= MAX_ITEMS; i++) {
      const value = interaction.options.getString(`item${i}`);
      if (value) lines.push(value.trim());
    }

    const results = [];
    const errors = [];

    for (const line of lines) {
      const match = line.match(/^(.+?)\s+(\d+)$/);
      if (!match) {
        errors.push(`❌ "${line}" — Format ungültig (erwartet: Name Menge)`);
        continue;
      }

      const item = match[1].trim();
      const menge = parseInt(match[2], 10);

      if (menge < 1) {
        errors.push(`❌ "${line}" — Menge muss mindestens 1 sein`);
        continue;
      }

      if (sub === 'rein') {
        const total = inventoryStore.addStock(item, menge);
        results.push({ item, menge, total });
      } else {
        const total = inventoryStore.removeStock(item, menge);
        if (total === null) {
          errors.push(`❌ **${item}** — nicht im Lager oder Bestand reicht nicht aus`);
        } else {
          results.push({ item, menge, total });
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
