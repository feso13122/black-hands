const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config.json');
const { baseEmbed } = require('./embeds');
const absenceStore = require('./absenceStore');

function buildAbsenceRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('create_absence')
      .setLabel('Abmelden')
      .setEmoji('📅')
      .setStyle(ButtonStyle.Primary)
  );
}

function buildAbsenceEmbed(client) {
  const entries = absenceStore.getAll();

  return baseEmbed(client)
    .setColor('#FEE75C')
    .setTitle('📅 Abmeldungen')
    .setDescription(
      entries.length === 0
        ? 'Aktuell ist niemand abgemeldet.'
        : entries
            .map(a => {
              const unix = Math.floor(a.until / 1000);
              return `<@${a.userId}> — bis <t:${unix}:f> (<t:${unix}:R>)\nGrund: ${a.reason}`;
            })
            .join('\n\n')
    );
}

// Postet die Abmeldungs-Nachricht neu oder bearbeitet die bestehende.
async function updateAbsencePanel(client) {
  if (!config.absenceChannelId || config.absenceChannelId.startsWith('CHANNEL_ID')) {
    return null;
  }

  const channel = await client.channels.fetch(config.absenceChannelId).catch(() => null);
  if (!channel || !channel.isTextBased()) return null;

  const embed = buildAbsenceEmbed(client);
  const row = buildAbsenceRow();

  const existingMessageId = absenceStore.getListMessageId();
  if (existingMessageId) {
    const existingMessage = await channel.messages.fetch(existingMessageId).catch(() => null);
    if (existingMessage) {
      await existingMessage.edit({ embeds: [embed], components: [row] });
      return channel;
    }
  }

  const message = await channel.send({ embeds: [embed], components: [row] });
  absenceStore.setListMessageId(message.id);
  return channel;
}

module.exports = { updateAbsencePanel };
