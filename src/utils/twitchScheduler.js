const config = require('../config.json');
const { baseEmbed } = require('./embeds');
const twitchStore = require('./twitchStore');
const { refreshAccessToken, getStream } = require('./twitchApi');

const TOKEN_REFRESH_INTERVAL_MS = 12 * 60 * 60 * 1000;
const liveStreamers = new Set();

async function sendLiveNotification(client, streamData) {
  if (!config.twitchNotificationChannelId || config.twitchNotificationChannelId.startsWith('CHANNEL_ID')) {
    return;
  }

  const channel = await client.channels.fetch(config.twitchNotificationChannelId).catch(() => null);
  if (!channel || !channel.isTextBased()) return;

  const embed = baseEmbed(client)
    .setColor('#9146FF')
    .setTitle(`🔴 ${streamData.user_name} ist jetzt live`)
    .setDescription(streamData.title || '')
    .addFields(
      { name: 'Playing', value: streamData.game_name || 'Nicht verfügbar', inline: true },
      { name: 'Viewer', value: `${streamData.viewer_count}`, inline: true },
      { name: 'Twitch', value: `[Stream ansehen](https://twitch.tv/${streamData.user_login})`, inline: false }
    )
    .setImage(streamData.thumbnail_url.replace('{width}', '1920').replace('{height}', '1080'));

  const roleMention = config.twitchPingRoleId && !config.twitchPingRoleId.startsWith('ROLLEN_ID')
    ? `<@&${config.twitchPingRoleId}>`
    : '';

  await channel.send({ content: roleMention, embeds: [embed] });
  console.log(`📢 Live-Benachrichtigung für ${streamData.user_name} gesendet`);
}

async function checkAllStreamers(client) {
  for (const username of twitchStore.getAll()) {
    const streamData = await getStream(username);

    if (streamData && !liveStreamers.has(username)) {
      liveStreamers.add(username);
      await sendLiveNotification(client, streamData);
    } else if (!streamData && liveStreamers.has(username)) {
      liveStreamers.delete(username);
      console.log(`📴 ${username} ist offline`);
    }
  }
}

function startTwitchScheduler(client) {
  if (!process.env.TWITCH_CLIENT_ID || !process.env.TWITCH_SECRET) {
    console.log('ℹ️ TWITCH_CLIENT_ID/TWITCH_SECRET nicht gesetzt — Twitch-Live-Benachrichtigungen sind deaktiviert.');
    return;
  }

  const checkIntervalMs = config.twitchCheckIntervalMs || 60000;

  refreshAccessToken();
  setInterval(refreshAccessToken, TOKEN_REFRESH_INTERVAL_MS);
  setInterval(() => checkAllStreamers(client), checkIntervalMs);

  console.log(`🔄 Twitch-Streamer werden alle ${checkIntervalMs / 1000} Sekunden geprüft.`);
}

module.exports = { startTwitchScheduler };
