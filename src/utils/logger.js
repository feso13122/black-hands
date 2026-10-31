const config = require('../config.json');

async function sendToChannel(client, channelId, embed) {
  if (!channelId || channelId.startsWith('CHANNEL_ID')) return;

  try {
    const channel = await client.channels.fetch(channelId);
    if (channel && channel.isTextBased()) {
      await channel.send({ embeds: [embed] });
    }
  } catch (err) {
    console.error('Konnte Log-Nachricht nicht senden:', err.message);
  }
}

// Schickt ein Embed in den Log-Channel der übergebenen Kategorie
// (config.logChannels.<key>). Ist für diese Kategorie noch keine eigene
// Channel-ID eingetragen, fällt die Nachricht auf logChannels.logServer
// zurück (den allgemeinen Server-Log).
async function sendCategoryLog(client, key, embed) {
  const channels = config.logChannels || {};
  const channelId = channels[key] || channels.logServer;
  await sendToChannel(client, channelId, embed);
}

// Kurzform für den allgemeinen Server-Log (logServer selbst).
async function sendLog(client, embed) {
  await sendCategoryLog(client, 'logServer', embed);
}

module.exports = { sendLog, sendCategoryLog };
