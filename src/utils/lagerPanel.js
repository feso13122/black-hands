const config = require('../config.json');
const { baseEmbed } = require('./embeds');
const inventoryStore = require('./inventoryStore');

async function postInventoryList(client) {
  if (!config.lagerListChannelId || config.lagerListChannelId.startsWith('CHANNEL_ID')) {
    return null;
  }

  const channel = await client.channels.fetch(config.lagerListChannelId).catch(() => null);
  if (!channel || !channel.isTextBased()) return null;

  const items = inventoryStore.getAll();
  const embed = baseEmbed(client)
    .setColor('#FEE75C')
    .setTitle('📦 Lagerliste')
    .setDescription(
      items.length === 0
        ? 'Das Lager ist aktuell leer.'
        : items.map(i => `**${i.name}** — ${i.quantity}x`).join('\n')
    );

  const existingMessageId = inventoryStore.getListMessageId();
  if (existingMessageId) {
    const existingMessage = await channel.messages.fetch(existingMessageId).catch(() => null);
    if (existingMessage) {
      await existingMessage.edit({ embeds: [embed] });
      return channel;
    }
  }

  const message = await channel.send({ embeds: [embed] });
  inventoryStore.setListMessageId(message.id);
  return channel;
}

// results: [{ item, menge, total }]
async function postLagerLog(client, { action, executor, results }) {
  if (!config.lagerLogChannelId || config.lagerLogChannelId.startsWith('CHANNEL_ID')) return;
  if (results.length === 0) return;

  const channel = await client.channels.fetch(config.lagerLogChannelId).catch(() => null);
  if (!channel || !channel.isTextBased()) return;

  const embed = baseEmbed(client)
    .setColor(action === 'rein' ? '#57F287' : '#ED4245')
    .setTitle(action === 'rein' ? '📥 Lager: Ware rein' : '📤 Lager: Ware raus')
    .setDescription(results.map(r => `**${r.item}** — ${r.menge}x — Neuer Bestand: ${r.total}x`).join('\n').slice(0, 4000))
    .addFields({ name: 'Ausgeführt von', value: `${executor}`, inline: false });

  await channel.send({ embeds: [embed] });
}

module.exports = { postInventoryList, postLagerLog };
