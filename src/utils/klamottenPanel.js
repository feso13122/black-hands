const config = require('../config.json');
const { baseEmbed } = require('./embeds');
const klamottenStore = require('./klamottenStore');

const CATEGORY_LABELS = {
  torso: 'Torso',
  hose: 'Hose',
  shirt: 'Shirt',
  aufkleber: 'Aufkleber'
};

function buildKlamottenEmbed(client) {
  const values = klamottenStore.getAll();
  const embed = baseEmbed(client)
    .setColor('#5865F2')
    .setTitle('👕 So ist unsere Kleidung');

  for (const [key, label] of Object.entries(CATEGORY_LABELS)) {
    embed.addFields({ name: label, value: values[key] || 'Noch nicht gesetzt', inline: true });
  }

  return embed;
}

// Postet die Klamotten-Panel-Nachricht neu oder bearbeitet die bestehende.
async function updateKlamottenPanel(client) {
  if (!config.klamottenListChannelId || config.klamottenListChannelId.startsWith('CHANNEL_ID')) {
    return null;
  }

  const channel = await client.channels.fetch(config.klamottenListChannelId).catch(() => null);
  if (!channel || !channel.isTextBased()) return null;

  const embed = buildKlamottenEmbed(client);

  const existingMessageId = klamottenStore.getListMessageId();
  if (existingMessageId) {
    const existingMessage = await channel.messages.fetch(existingMessageId).catch(() => null);
    if (existingMessage) {
      await existingMessage.edit({ embeds: [embed] });
      return channel;
    }
  }

  const message = await channel.send({ embeds: [embed] });
  klamottenStore.setListMessageId(message.id);
  return channel;
}

module.exports = { updateKlamottenPanel, CATEGORY_LABELS };
