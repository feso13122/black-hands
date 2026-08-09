const { ChannelType, PermissionFlagsBits } = require('discord.js');
const config = require('../config.json');
const serverStatsStore = require('./serverStatsStore');

function buildMemberCountName(count) {
  return `👥 Mitglieder: ${count}`;
}

function buildRoleCountName(count) {
  return `Black Hands: ${count}`;
}

async function createStatsChannel(guild, name) {
  return guild.channels.create({
    name,
    type: ChannelType.GuildVoice,
    permissionOverwrites: [
      {
        id: guild.roles.everyone.id,
        allow: [PermissionFlagsBits.ViewChannel],
        deny: [PermissionFlagsBits.Connect]
      }
    ]
  });
}

// Legt den Channel an, falls er noch nicht existiert, sonst wird nur sein
// Name aktualisiert. So kann dieselbe Funktion für /serverstats (Erstellen)
// und den Scheduler (Aktualisieren) verwendet werden.
async function ensureChannel(guild, getId, setId, name, errorLabel) {
  const existingId = getId();
  const existing = existingId ? await guild.channels.fetch(existingId).catch(() => null) : null;

  if (existing) {
    if (existing.name !== name) {
      await existing.setName(name).catch(err => {
        console.error(`Fehler beim Aktualisieren des ${errorLabel}:`, err.message);
      });
    }
    return { channel: existing, created: false };
  }

  const channel = await createStatsChannel(guild, name);
  setId(channel.id);
  return { channel, created: true };
}

// Holt den kompletten Member-Cache NUR EINMAL (Discord limitiert volle
// Member-Requests scharf - ein zweiter Request kurz danach führt zu
// GatewayRateLimitError) und aktualisiert/erstellt daraus beide Channels.
async function ensureStatsChannels(guild) {
  const members = await guild.members.fetch();
  const humanMembers = members.filter(m => !m.user.bot);

  const memberResult = await ensureChannel(
    guild,
    serverStatsStore.getMemberCountChannelId,
    serverStatsStore.setMemberCountChannelId,
    buildMemberCountName(humanMembers.size),
    'Mitglieder-Stats-Channels'
  );

  let roleResult = null;
  if (config.serverStatsRoleId && !config.serverStatsRoleId.startsWith('ROLLEN_ID')) {
    const roleCount = humanMembers.filter(m => m.roles.cache.has(config.serverStatsRoleId)).size;
    roleResult = await ensureChannel(
      guild,
      serverStatsStore.getRoleCountChannelId,
      serverStatsStore.setRoleCountChannelId,
      buildRoleCountName(roleCount),
      'Rollen-Stats-Channels'
    );
  }

  return { memberResult, roleResult };
}

module.exports = { ensureStatsChannels };
