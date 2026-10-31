const config = require('../config.json');
const { baseEmbed } = require('./embeds');
const kasseStore = require('./kasseStore');

function formatMoney(amount) {
  return `${amount.toLocaleString('de-DE')}$`;
}

async function postKasseList(client) {
  if (!config.kasseListChannelId || config.kasseListChannelId.startsWith('CHANNEL_ID')) {
    return null;
  }

  const channel = await client.channels.fetch(config.kasseListChannelId).catch(() => null);
  if (!channel || !channel.isTextBased()) return null;

  const { gruen, schwarz } = kasseStore.getBalances();
  const embed = baseEmbed(client)
    .setColor('#FEE75C')
    .setTitle('💰 Fraktionskasse')
    .setDescription(
      `🟢 **Grünes Geld:** ${formatMoney(gruen)}\n` +
      `⚫ **Schwarzes Geld:** ${formatMoney(schwarz)}\n\n` +
      `**Gesamt:** ${formatMoney(gruen + schwarz)}`
    );

  const existingMessageId = kasseStore.getListMessageId();
  if (existingMessageId) {
    const existingMessage = await channel.messages.fetch(existingMessageId).catch(() => null);
    if (existingMessage) {
      await existingMessage.edit({ embeds: [embed] });
      return channel;
    }
  }

  const message = await channel.send({ embeds: [embed] });
  kasseStore.setListMessageId(message.id);
  return channel;
}

// results: [{ type, amount, total }]
async function postKasseLog(client, { action, executor, results, grund }) {
  const logChannelId = action === 'ein' ? config.kasseeinLogChannelId : config.kasseausLogChannelId;
  if (!logChannelId || logChannelId.startsWith('CHANNEL_ID')) return;
  if (results.length === 0) return;

  const channel = await client.channels.fetch(logChannelId).catch(() => null);
  if (!channel || !channel.isTextBased()) return;

  const typeLabel = { gruen: '🟢 Grünes Geld', schwarz: '⚫ Schwarzes Geld' };

  const embed = baseEmbed(client)
    .setColor(action === 'ein' ? '#57F287' : '#ED4245')
    .setTitle(action === 'ein' ? '📥 Kasse: Einzahlung' : '📤 Kasse: Auszahlung')
    .setDescription(
      results
        .map(r => `${typeLabel[r.type]} — ${formatMoney(r.amount)} — Neuer Kontostand: ${formatMoney(r.total)}`)
        .join('\n')
        .slice(0, 4000)
    )
    .addFields({ name: 'Ausgeführt von', value: `${executor}`, inline: false });

  if (grund) {
    embed.addFields({ name: 'Grund', value: grund, inline: false });
  }

  await channel.send({ embeds: [embed] });
}

module.exports = { postKasseList, postKasseLog, formatMoney };
