const { SlashCommandBuilder } = require('discord.js');
const config = require('../config.json');
const { baseEmbed, errorEmbed, successEmbed } = require('../utils/embeds');
const { canUseLager } = require('../utils/permissions');
const inventoryStore = require('../utils/inventoryStore');
const { postInventoryList, postLagerLog } = require('../utils/lagerPanel');
const lagerInfoStore = require('../utils/lagerInfoStore');

function parseItemList(raw) {
  const entries = [];
  const errors = [];

  const parts = raw.split(',').map(p => p.trim()).filter(p => p.length > 0);

  for (const part of parts) {
    const idx = part.lastIndexOf(':');
    if (idx === -1) {
      errors.push(`❌ Ungültiges Format: \`${part}\` (erwartet: Item:Menge)`);
      continue;
    }

    const name = part.slice(0, idx).trim();
    const mengeStr = part.slice(idx + 1).trim();
    const menge = parseInt(mengeStr, 10);

    if (!name) {
      errors.push(`❌ Kein Item-Name angegeben in: \`${part}\``);
      continue;
    }

    if (!Number.isInteger(menge) || menge < 1 || String(menge) !== mengeStr) {
      errors.push(`❌ Ungültige Menge bei **${name}**: \`${mengeStr}\` (muss eine ganze Zahl ≥ 1 sein)`);
      continue;
    }

    entries.push({ item: name, menge });
  }

  return { entries, errors };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lager')
    .setDescription('Lagerbestand verwalten')
    .addSubcommand(sub =>
      sub
        .setName('rein')
        .setDescription('Legt Items ins Lager')
        .addStringOption(o =>
          o
            .setName('items')
            .setDescription('Format: Item:Menge, Item:Menge, ... (z.B. Holz:5, Stein:12, Eisen:3)')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('raus')
        .setDescription('Nimmt Items aus dem Lager')
        .addStringOption(o =>
          o
            .setName('items')
            .setDescription('Format: Item:Menge, Item:Menge, ... (z.B. Holz:5, Stein:12)')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('liste')
        .setDescription('Aktualisiert die Lagerliste-Nachricht')
    )
    .addSubcommand(sub =>
      sub
        .setName('info')
        .setDescription('Zeigt Infos über das Lager-System')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'info') {
      // /lager info darf nur im commandChannelId ausgeführt werden
      if (
        config.commandChannelId &&
        !config.commandChannelId.startsWith('CHANNEL_ID') &&
        interaction.channelId !== config.commandChannelId
      ) {
        await interaction.reply({
          embeds: [errorEmbed(`\`/lager info\` kann nur in <#${config.commandChannelId}> benutzt werden.`, interaction.client)],
          ephemeral: true
        });
        return;
      }

      if (!config.lagerInfoChannelId || config.lagerInfoChannelId.startsWith('CHANNEL_ID')) {
        await interaction.reply({
          embeds: [errorEmbed('Der Lager-Info-Channel wurde nicht konfiguriert.', interaction.client)],
          ephemeral: true
        });
        return;
      }

      const infoChannel = await interaction.client.channels.fetch(config.lagerInfoChannelId).catch(() => null);
      if (!infoChannel || !infoChannel.isTextBased()) {
        await interaction.reply({
          embeds: [errorEmbed('Der Lager-Info-Channel konnte nicht erreicht werden.', interaction.client)],
          ephemeral: true
        });
        return;
      }

      const infoEmbed = baseEmbed(interaction.client)
        .setColor('#5865F2')
        .setTitle('📦 Lager-System')
        .setDescription(
          '**`/lager rein` Item:Menge, Item:Menge, ...**\n' +
          'Ihr könnt mehrere Items auf einmal eintragen.\n' +
          '**Beispiel:** Handys:20, Tabletts:19, Pistole:1\n\n' +
          '**`/lager raus` Item:Menge, Item:Menge, ...**\n' +
          'Ihr könnt mehrere Items auf einmal rausnehmen.\n' +
          '**Format:** Genauso wie bei `/lager rein`'
        );

      const existingMessageId = lagerInfoStore.getInfoMessageId();
      if (existingMessageId) {
        const existingMessage = await infoChannel.messages.fetch(existingMessageId).catch(() => null);
        if (existingMessage) {
          await existingMessage.edit({ embeds: [infoEmbed] });
          await interaction.reply({
            embeds: [successEmbed(`Lager-Info-Panel aktualisiert.`, interaction.client)],
            ephemeral: true
          });
          return;
        }
      }

      const message = await infoChannel.send({ embeds: [infoEmbed] });
      lagerInfoStore.setInfoMessageId(message.id);

      await interaction.reply({
        embeds: [successEmbed(`Lager-Info-Panel in <#${config.lagerInfoChannelId}> erstellt.`, interaction.client)],
        ephemeral: true
      });
      return;
    }

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

    const raw = interaction.options.getString('items');
    const { entries, errors } = parseItemList(raw);

    const results = [];

    for (const { item, menge } of entries) {
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
