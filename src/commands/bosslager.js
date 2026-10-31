const { SlashCommandBuilder } = require('discord.js');
const config = require('../config.json');
const { baseEmbed, errorEmbed, successEmbed } = require('../utils/embeds');
const { canUseBosslager } = require('../utils/permissions');
const bosslagerStore = require('../utils/bosslagerStore');
const { postBosslagerList } = require('../utils/bosslagerPanel');

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
    .setName('bosslager')
    .setDescription('Boss-Lagerbestand verwalten')
    .addSubcommand(sub =>
      sub
        .setName('rein')
        .setDescription('Legt Items ins Boss-Lager')
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
        .setDescription('Nimmt Items aus dem Boss-Lager')
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
        .setDescription('Aktualisiert die Boss-Lagerliste-Nachricht')
    )
    .addSubcommand(sub =>
      sub
        .setName('info')
        .setDescription('Zeigt Infos über das Boss-Lager-System')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (!canUseBosslager(interaction.member)) {
      await interaction.reply({
        embeds: [errorEmbed('Du hast keine Berechtigung, diesen Befehl zu benutzen.', interaction.client)],
        ephemeral: true
      });
      return;
    }

    if (sub === 'info' || sub === 'liste') {
      // /bosslager info und /bosslager liste laufen im gleichen,
      // gemeinsamen Channel (bosslagerInfoListeChannelId).
      if (
        config.bosslagerInfoListeChannelId &&
        !config.bosslagerInfoListeChannelId.startsWith('CHANNEL_ID') &&
        interaction.channelId !== config.bosslagerInfoListeChannelId
      ) {
        await interaction.reply({
          embeds: [errorEmbed(`\`/bosslager ${sub}\` kann nur in <#${config.bosslagerInfoListeChannelId}> benutzt werden.`, interaction.client)],
          ephemeral: true
        });
        return;
      }
    }

    if (sub === 'info') {
      if (!config.bosslagerInfoListeChannelId || config.bosslagerInfoListeChannelId.startsWith('CHANNEL_ID')) {
        await interaction.reply({
          embeds: [errorEmbed('Der Boss-Lager-Info-Channel wurde nicht konfiguriert.', interaction.client)],
          ephemeral: true
        });
        return;
      }

      const infoChannel = await interaction.client.channels.fetch(config.bosslagerInfoListeChannelId).catch(() => null);
      if (!infoChannel || !infoChannel.isTextBased()) {
        await interaction.reply({
          embeds: [errorEmbed('Der Boss-Lager-Info-Channel konnte nicht erreicht werden.', interaction.client)],
          ephemeral: true
        });
        return;
      }

      const infoEmbed = baseEmbed(interaction.client)
        .setColor('#5865F2')
        .setTitle('📦 Boss-Lager-System')
        .setDescription(
          '**`/bosslager rein` Item:Menge, Item:Menge, ...**\n' +
          'Ihr könnt mehrere Items auf einmal eintragen.\n' +
          '**Beispiel:** Handys:20, Tabletts:19, Pistole:1\n\n' +
          '**`/bosslager raus` Item:Menge, Item:Menge, ...**\n' +
          'Ihr könnt mehrere Items auf einmal rausnehmen.\n' +
          '**Format:** Genauso wie bei `/bosslager rein`'
        );

      const existingMessageId = bosslagerStore.getInfoMessageId();
      if (existingMessageId) {
        const existingMessage = await infoChannel.messages.fetch(existingMessageId).catch(() => null);
        if (existingMessage) {
          await existingMessage.edit({ embeds: [infoEmbed] });
          await interaction.reply({
            embeds: [successEmbed('Boss-Lager-Info-Panel aktualisiert.', interaction.client)],
            ephemeral: true
          });
          return;
        }
      }

      const message = await infoChannel.send({ embeds: [infoEmbed] });
      bosslagerStore.setInfoMessageId(message.id);

      await interaction.reply({
        embeds: [successEmbed(`Boss-Lager-Info-Panel in <#${config.bosslagerInfoListeChannelId}> erstellt.`, interaction.client)],
        ephemeral: true
      });
      return;
    }

    if (sub === 'liste') {
      const channel = await postBosslagerList(interaction.client);
      if (!channel) {
        await interaction.reply({
          embeds: [errorEmbed('Der Boss-Lagerliste-Channel (`bosslagerInfoListeChannelId`) wurde nicht gefunden.', interaction.client)],
          ephemeral: true
        });
        return;
      }

      await interaction.reply({
        embeds: [successEmbed(`Die Boss-Lagerliste in ${channel} wurde aktualisiert.`, interaction.client)],
        ephemeral: true
      });
      return;
    }

    // /bosslager rein und /bosslager raus: eigene Channel-Sperre, jeweils auf
    // einen eigenen Channel (bosslagerEinCommandChannelId / bosslagerAusCommandChannelId).
    const requiredChannelId = sub === 'rein'
      ? config.bosslagerEinCommandChannelId
      : config.bosslagerAusCommandChannelId;

    if (
      requiredChannelId &&
      !requiredChannelId.startsWith('CHANNEL_ID') &&
      interaction.channelId !== requiredChannelId
    ) {
      await interaction.reply({
        embeds: [errorEmbed(`\`/bosslager ${sub}\` kann nur in <#${requiredChannelId}> benutzt werden.`, interaction.client)],
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
        const total = bosslagerStore.addStock(name, menge);
        results.push({ item: name, menge, total });
      } else {
        const total = bosslagerStore.removeStock(name, menge);
        if (total === null) {
          errors.push(`❌ **${name}** — nicht im Boss-Lager oder Bestand reicht nicht aus`);
        } else {
          results.push({ item: name, menge, total });
        }
      }
    }

    if (results.length > 0) {
      await postBosslagerList(interaction.client);
    }

    const summaryLines = [
      ...results.map(r => `✅ **${r.item}** — ${r.menge}x — Neuer Bestand: ${r.total}x`),
      ...errors
    ];

    const summaryEmbed = baseEmbed(interaction.client)
      .setColor(errors.length > 0 ? '#FEE75C' : '#57F287')
      .setTitle(sub === 'rein' ? '📥 Boss-Lager: Ware rein' : '📤 Boss-Lager: Ware raus')
      .setDescription(summaryLines.join('\n').slice(0, 4000));

    await interaction.reply({ embeds: [summaryEmbed], ephemeral: true });
  }
};
