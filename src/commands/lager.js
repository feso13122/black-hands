const { SlashCommandBuilder } = require('discord.js');
const config = require('../config.json');
const { baseEmbed, errorEmbed, successEmbed } = require('../utils/embeds');
const { canUseLager } = require('../utils/permissions');
const inventoryStore = require('../utils/inventoryStore');
const { postInventoryList, postLagerLog } = require('../utils/lagerPanel');
const lagerInfoStore = require('../utils/lagerInfoStore');

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
        .setTitle('📦 Lager-System Erklärung')
        .setDescription('Hier erfährst du alles über die Lagerverwaltung.')
        .addFields(
          {
            name: '❓ Was ist das Lager?',
            value: 'Das Lager ist ein zentrales Inventar-System, in dem du Waren/Items speichern und verwalten kannst. Jeder kann Items hinzufügen oder entnehmen.',
            inline: false
          },
          {
            name: '📥 `/lager rein` — Items hinzufügen',
            value: 'Mit diesem Command legst du Items ins Lager.\n' +
                   '**Format:** item1 + menge1, item2 + menge2, ... (bis zu 20 Items)\n' +
                   '**Beispiel:** item1: "Holz", menge1: 5, item2: "Stein", menge2: 12',
            inline: false
          },
          {
            name: '📤 `/lager raus` — Items entnehmen',
            value: 'Mit diesem Command nimmst du Items aus dem Lager.\n' +
                   '**Format:** Wie bei `/lager rein`\n' +
                   '**Hinweis:** Wenn nicht genug vorhanden ist, wird eine Fehlermeldung angezeigt.',
            inline: false
          },
          {
            name: '📋 `/lager liste` — Lagerliste anzeigen',
            value: 'Aktualisiert die zentrale Nachricht mit dem aktuellen Bestand.',
            inline: false
          },
          {
            name: '📍 Verfügbare Kanäle',
            value: `**Lager-Befehle:** <#${config.lagerCommandChannelId}> (`/lager rein`, `/lager raus`)\n` +
                   `**Allgemeines:** <#${config.commandChannelId}> (`/lager liste`, `/lager info`)`,
            inline: false
          }
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
