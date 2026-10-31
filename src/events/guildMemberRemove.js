const { AuditLogEvent } = require('discord.js');
const config = require('../config.json');
const { baseEmbed } = require('../utils/embeds');
const { sendLog, sendKickLog } = require('../utils/logger');
const { buildLeaveEmbed } = require('../utils/memberEmbeds');

// Prüft per Audit-Log, ob das Mitglied gekickt wurde (statt selbst zu
// gehen). Discord unterscheidet das im guildMemberRemove-Event nicht,
// daher der Umweg über die zuletzt eingetragenen MemberKick-Einträge.
async function findKickAuditEntry(guild, userId) {
  try {
    const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.MemberKick, limit: 5 });
    const entry = logs.entries.find(e => e.target?.id === userId && Date.now() - e.createdTimestamp < 10000);
    return entry || null;
  } catch {
    return null;
  }
}

module.exports = {
  name: 'guildMemberRemove',
  async execute(member) {
    const { client, guild, user } = member;

    // Verlassen-Nachricht
    if (config.leaveChannelId && !config.leaveChannelId.startsWith('CHANNEL_ID')) {
      try {
        const channel = await guild.channels.fetch(config.leaveChannelId);
        if (channel && channel.isTextBased()) {
          await channel.send({ embeds: [buildLeaveEmbed(client, member)] });
        }
      } catch (err) {
        console.error('Fehler beim Senden der Verlassen-Nachricht:', err.message);
      }
    }

    // Logging
    const roles = member.roles?.cache
      ? member.roles.cache.filter(r => r.id !== guild.id).map(r => r.toString()).join(', ') || 'Keine'
      : 'Unbekannt';

    const kickEntry = await findKickAuditEntry(guild, user.id);

    if (kickEntry) {
      const kickEmbed = baseEmbed(client)
        .setColor('#ED4245')
        .setTitle('👢 Mitglied gekickt')
        .setThumbnail(member.displayAvatarURL({ size: 128 }))
        .addFields(
          { name: 'Nutzer', value: `${user.tag}`, inline: false },
          { name: 'Von', value: kickEntry.executor ? `${kickEntry.executor.tag}` : 'Unbekannt', inline: false },
          { name: 'Grund', value: kickEntry.reason || 'Kein Grund angegeben', inline: false },
          { name: 'Rollen', value: roles.slice(0, 1024), inline: false },
          { name: 'ID', value: `${user.id}`, inline: false }
        );
      await sendKickLog(client, kickEmbed);
      return;
    }

    const logEmbed = baseEmbed(client)
      .setColor('#ED4245')
      .setTitle('📤 Mitglied hat den Server verlassen')
      .setThumbnail(member.displayAvatarURL({ size: 128 }))
      .addFields(
        { name: 'Nutzer', value: `${user.tag}`, inline: false },
        { name: 'Rollen', value: roles.slice(0, 1024), inline: false },
        { name: 'Mitgliederanzahl', value: `${guild.memberCount}`, inline: false },
        { name: 'ID', value: `${user.id}`, inline: false }
      );
    await sendLog(client, logEmbed);
  }
};
