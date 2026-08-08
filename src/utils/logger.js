const config = require('../config.json');

async function sendLog(client, embed) {
  if (!config.logChannelId || config.logChannelId.startsWith('CHANNEL_ID')) return;

  try {
    const channel = await client.channels.fetch(config.logChannelId);
    if (channel && channel.isTextBased()) {
      await channel.send({ embeds: [embed] });
    }
  } catch (err) {
    console.error('Konnte Log-Nachricht nicht senden:', err.message);
  }
}

module.exports = { sendLog };
