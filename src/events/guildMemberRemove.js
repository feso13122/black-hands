const config = require('../config.json');
const { baseEmbed } = require('../utils/embeds');
const { sendLog } = require('../utils/logger');

module.exports = {
  name: 'guildMemberRemove',
  async execute(member) {
    const { client, guild, user } = member;

    // Verlassen-Nachricht
    if (config.leaveChannelId && !config.leaveChannelId.startsWith('CHANNEL_ID')) {
      try {
        const channel = await guild.channels.fetch(config.leaveChannelId);
        if (channel && channel.isTextBased()) {
          const embed = baseEmbed(client)
            .setColor('#ED4245')
            .setTitle('🩸 Blood Out')
            .setDescription(`${user} hat Black Hands verlassen, das ist dein **Blood Out**.`)
            .setThumbnail(user.displayAvatarURL({ size: 256 }))
            .addFields(
              { name: 'Mitglied', value: `${user.tag}`, inline: true },
              { name: 'Mitgliederanzahl', value: `${guild.memberCount}`, inline: true }
            );
          await channel.send({ embeds: [embed] });
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
      .setThumbnail(user.displayAvatarURL({ size: 128 }))
      .addFields(
        { name: 'Nutzer', value: `${user.tag}`, inline: false },
        { name: 'Rollen', value: roles.slice(0, 1024), inline: false },
        { name: 'Mitgliederanzahl', value: `${guild.memberCount}`, inline: false },
        { name: 'ID', value: `${user.id}`, inline: false }
      );
    await sendLog(client, logEmbed);
  }
};
