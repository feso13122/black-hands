const config = require('../config.json');
const { baseEmbed } = require('../utils/embeds');
const { sendLog } = require('../utils/logger');
const { buildWelcomeEmbed } = require('../utils/memberEmbeds');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    const { client, guild, user } = member;

    // Willkommensnachricht
    if (config.welcomeChannelId && !config.welcomeChannelId.startsWith('CHANNEL_ID')) {
      try {
        const channel = await guild.channels.fetch(config.welcomeChannelId);
        if (channel && channel.isTextBased()) {
          await channel.send({ embeds: [buildWelcomeEmbed(client, member)] });
        }
      } catch (err) {
        console.error('Fehler beim Senden der Willkommensnachricht:', err.message);
      }
    }

    // Autorole
    if (config.autoRoleId && !config.autoRoleId.startsWith('ROLLEN_ID')) {
      try {
        await member.roles.add(config.autoRoleId);
      } catch (err) {
        console.error('Fehler beim Vergeben der Autorole:', err.message);
      }
    }

    // Logging
    const logEmbed = baseEmbed(client)
      .setColor('#57F287')
      .setTitle('📥 Mitglied beigetreten')
      .setThumbnail(member.displayAvatarURL({ size: 128 }))
      .addFields(
        { name: 'Nutzer', value: `${user} (${user.tag})`, inline: false },
        { name: 'Account erstellt', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: false },
        { name: 'Mitgliederanzahl', value: `${guild.memberCount}`, inline: false },
        { name: 'ID', value: `${user.id}`, inline: false }
      );
    await sendLog(client, logEmbed);
  }
};
