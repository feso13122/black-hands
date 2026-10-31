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

// Allgemeine Logs (alles, was keine eigene Kategorie unten hat).
async function sendLog(client, embed) {
  await sendToChannel(client, config.logChannelId, embed);
}

// Kicks - fällt auf logChannelId zurück, falls kickLogChannelId nicht
// konfiguriert ist.
async function sendKickLog(client, embed) {
  await sendToChannel(client, config.kickLogChannelId || config.logChannelId, embed);
}

// Bans/Unbans - fällt auf logChannelId zurück, falls banLogChannelId nicht
// konfiguriert ist.
async function sendBanLog(client, embed) {
  await sendToChannel(client, config.banLogChannelId || config.logChannelId, embed);
}

// Nachrichten gelöscht/bearbeitet - fällt auf logChannelId zurück, falls
// nachrichtenLogChannelId nicht konfiguriert ist.
async function sendMessageLog(client, embed) {
  await sendToChannel(client, config.nachrichtenLogChannelId || config.logChannelId, embed);
}

// Voice-/Talk-Events - fällt auf logChannelId zurück, falls
// talkLogChannelId nicht konfiguriert ist.
async function sendVoiceLog(client, embed) {
  await sendToChannel(client, config.talkLogChannelId || config.logChannelId, embed);
}

module.exports = { sendLog, sendKickLog, sendBanLog, sendMessageLog, sendVoiceLog };
