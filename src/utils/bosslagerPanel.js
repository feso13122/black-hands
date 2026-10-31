const config = require('../config.json');
const { baseEmbed } = require('./embeds');
const bosslagerStore = require('./bosslagerStore');

async function postBosslagerList(client) {
  if (!config.bosslagerInfoListeChannelId || config.bosslagerInfoListeChannelId.startsWith('CHANNEL_ID')) {
    return null;
  }

  const channel = await client.channels.fetch(config.bosslagerInfoListeChannelId).catch(() => null);
  if (!channel || !channel.isTextBased()) return null;

  const items = bosslagerStore.getAll();
  const embed = baseEmbed(client)
    .setColor('#FEE75C')
    .setTitle('📦 Boss-Lagerliste')
    .setDescription(
      items.length === 0
        ? 'Das Boss-Lager ist aktuell leer.'
        : items.map(i => `**${i.name}** — ${i.quantity}x`).join('\n')
    );

  const existingMessageId = bosslagerStore.getListMessageId();
  if (existingMessageId) {
    const existingMessage = await channel.messages.fetch(existingMessageId).catch(() => null);
    if (existingMessage) {
      await existingMessage.edit({ embeds: [embed] });
      return channel;
    }
  }

  const message = await channel.send({ embeds: [embed] });
  bosslagerStore.setListMessageId(message.id);
  return channel;
}

module.exports = { postBosslagerList };
