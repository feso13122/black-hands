const { ChannelType, PermissionFlagsBits } = require('discord.js');
const config = require('../config.json');
const serverStatsStore = require('./serverStatsStore');

function buildMemberCountName(count) {
  return `👥 Mitglieder: ${count}`;
}

function buildRoleCountName(count) {
  return `Black Hand: ${count}`;
}

// Zählt nur echte Mitglieder, keine Bots. guild.members.fetch() holt dafür
// den kompletten, aktuellen Member-Cache (nötig, da nicht alle Member
// zwangsläufig schon gecacht sind).
async function countHumanMembers(guild) {
  const members = await guild.members.fetch();
  return members.filter(m => !m.user.bot).size;
}

async function countRoleMembers(guild, roleId) {
  const members = await guild.members.fetch();
  return members.filter(m => m.roles.cache.has(roleId)).size;
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
async function ensureMemberCountChannel(guild) {
  const count = await countHumanMembers(guild);
  const name = buildMemberCountName(count);

  const existingId = serverStatsStore.getMemberCountChannelId();
  const existing = existingId ? await guild.channels.fetch(existingId).catch(() => null) : null;

  if (existing) {
    if (existing.name !== name) {
      await existing.setName(name).catch(err => {
        console.error('Fehler beim Aktualisieren des Mitglieder-Stats-Channels:', err.message);
      });
    }
    return { channel: existing, created: false };
  }

  const channel = await createStatsChannel(guild, name);
  serverStatsStore.setMemberCountChannelId(channel.id);
  return { channel, created: true };
}

// Gibt null zurück, wenn keine serverStatsRoleId konfiguriert ist.
async function ensureRoleCountChannel(guild) {
  if (!config.serverStatsRoleId || config.serverStatsRoleId.startsWith('ROLLEN_ID')) {
    return null;
  }

  const count = await countRoleMembers(guild, config.serverStatsRoleId);
  const name = buildRoleCountName(count);

  const existingId = serverStatsStore.getRoleCountChannelId();
  const existing = existingId ? await guild.channels.fetch(existingId).catch(() => null) : null;

  if (existing) {
    if (existing.name !== name) {
      await existing.setName(name).catch(err => {
        console.error('Fehler beim Aktualisieren des Rollen-Stats-Channels:', err.message);
      });
    }
    return { channel: existing, created: false };
  }

  const channel = await createStatsChannel(guild, name);
  serverStatsStore.setRoleCountChannelId(channel.id);
  return { channel, created: true };
}

async function updateServerStatsChannels(guild) {
  await ensureMemberCountChannel(guild).catch(err => {
    console.error('Fehler beim Mitglieder-Stats-Update:', err.message);
  });
  await ensureRoleCountChannel(guild).catch(err => {
    console.error('Fehler beim Rollen-Stats-Update:', err.message);
  });
}

module.exports = {
  ensureMemberCountChannel,
  ensureRoleCountChannel,
  updateServerStatsChannels,
  countHumanMembers,
  countRoleMembers
};
