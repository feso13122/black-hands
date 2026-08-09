const { ChannelType, PermissionFlagsBits } = require('discord.js');
const serverStatsStore = require('./serverStatsStore');

function buildStatsName(memberCount) {
  return `👥 Mitglieder: ${memberCount}`;
}

// Zählt nur echte Mitglieder, keine Bots. guild.members.fetch() holt dafür
// den kompletten, aktuellen Member-Cache (nötig, da nicht alle Member
// zwangsläufig schon gecacht sind).
async function countHumanMembers(guild) {
  const members = await guild.members.fetch();
  return members.filter(m => !m.user.bot).size;
}

async function createServerStatsChannel(guild) {
  const count = await countHumanMembers(guild);

  const channel = await guild.channels.create({
    name: buildStatsName(count),
    type: ChannelType.GuildVoice,
    permissionOverwrites: [
      {
        id: guild.roles.everyone.id,
        allow: [PermissionFlagsBits.ViewChannel],
        deny: [PermissionFlagsBits.Connect]
      }
    ]
  });

  serverStatsStore.setChannelId(channel.id);
  return channel;
}

async function updateServerStatsChannel(guild) {
  const channelId = serverStatsStore.getChannelId();
  if (!channelId) return null;

  const channel = await guild.channels.fetch(channelId).catch(() => null);
  if (!channel) return null;

  const count = await countHumanMembers(guild);
  const newName = buildStatsName(count);

  if (channel.name !== newName) {
    await channel.setName(newName).catch(err => {
      console.error('Fehler beim Aktualisieren des Server-Stats-Channels:', err.message);
    });
  }

  return channel;
}

module.exports = { createServerStatsChannel, updateServerStatsChannel, countHumanMembers };
