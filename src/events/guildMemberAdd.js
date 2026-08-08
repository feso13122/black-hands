const config = require('../config.json');
const { baseEmbed } = require('../utils/embeds');
const { sendLog } = require('../utils/logger');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    const { client, guild, user } = member;

    // Willkommensnachricht
    if (config.welcomeChannelId && !config.welcomeChannelId.startsWith('CHANNEL_ID')) {
      try {
        const channel = await guild.channels.fetch(config.welcomeChannelId);
        if (channel && channel.isTextBased()) {
          const embed = baseEmbed()
            .setColor('#57F287')
            .setTitle('🩸 Willkommen bei Black Hands!')
            .setDescription(`Willkommen ${user}, das ist dein **Blood In**.`)
            .setThumbnail(user.displayAvatarURL({ size: 256 }))
            .addFields(
              { name: 'Mitglied', value: `${user.tag}`, inline: true },
              { name: 'Mitgliederanzahl', value: `${guild.memberCount}`, inline: true }
            );
          await channel.send({ embeds: [embed] });
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
    const logEmbed = baseEmbed()
      .setColor('#57F287')
      .setTitle('📥 Mitglied beigetreten')
      .setThumbnail(user.displayAvatarURL({ size: 128 }))
      .addFields(
        { name: 'Nutzer', value: `${user} (${user.tag})`, inline: false },
        { name: 'Account erstellt', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: false },
        { name: 'Mitgliederanzahl', value: `${guild.memberCount}`, inline: false }
      )
      .setFooter({ text: `ID: ${user.id}` });
    await sendLog(client, logEmbed);
  }
};
