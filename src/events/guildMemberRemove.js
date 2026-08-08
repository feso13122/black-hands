const config = require('../config.json');
const { baseEmbed } = require('../utils/embeds');
const { sendLog } = require('../utils/logger');
const { buildLeaveEmbed } = require('../utils/memberEmbeds');

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
