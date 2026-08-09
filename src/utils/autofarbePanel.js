const config = require('../config.json');
const { baseEmbed } = require('./embeds');
const autofarbeStore = require('./autofarbeStore');

const CATEGORY_LABELS = {
  primaryColor: 'Primary Color',
  secondaryColor: 'Secondary Color',
  sticker: '1. Sticker'
};

function buildAutofarbeEmbed(client) {
  const values = autofarbeStore.getAll();
  const embed = baseEmbed(client)
    .setColor('#5865F2')
    .setTitle('🚗 So ist unsere Autofarbe');

  for (const [key, label] of Object.entries(CATEGORY_LABELS)) {
    embed.addFields({ name: label, value: values[key] || 'Noch nicht gesetzt', inline: true });
  }

  return embed;
}

// Postet die Autofarbe-Panel-Nachricht neu oder bearbeitet die bestehende.
async function updateAutofarbePanel(client) {
  if (!config.autofarbeListChannelId || config.autofarbeListChannelId.startsWith('CHANNEL_ID')) {
    return null;
  }

  const channel = await client.channels.fetch(config.autofarbeListChannelId).catch(() => null);
  if (!channel || !channel.isTextBased()) return null;

  const embed = buildAutofarbeEmbed(client);

  const existingMessageId = autofarbeStore.getListMessageId();
  if (existingMessageId) {
    const existingMessage = await channel.messages.fetch(existingMessageId).catch(() => null);
    if (existingMessage) {
      await existingMessage.edit({ embeds: [embed] });
      return channel;
    }
  }

  const message = await channel.send({ embeds: [embed] });
  autofarbeStore.setListMessageId(message.id);
  return channel;
}

module.exports = { updateAutofarbePanel, CATEGORY_LABELS };
