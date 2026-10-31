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

// results: [{ item, menge, total }]
async function postBosslagerLog(client, { action, executor, results }) {
  const logChannelId = action === 'rein' ? config.bosslagereinLogChannelId : config.bosslagerausLogChannelId;
  if (!logChannelId || logChannelId.startsWith('CHANNEL_ID')) return;
  if (results.length === 0) return;

  const channel = await client.channels.fetch(logChannelId).catch(() => null);
  if (!channel || !channel.isTextBased()) return;

  const embed = baseEmbed(client)
    .setColor(action === 'rein' ? '#57F287' : '#ED4245')
    .setTitle(action === 'rein' ? '📥 Boss-Lager: Ware rein' : '📤 Boss-Lager: Ware raus')
    .setDescription(results.map(r => `**${r.item}** — ${r.menge}x — Neuer Bestand: ${r.total}x`).join('\n').slice(0, 4000))
    .addFields({ name: 'Ausgeführt von', value: `${executor}`, inline: false });

  await channel.send({ embeds: [embed] });
}

module.exports = { postBosslagerList, postBosslagerLog };
