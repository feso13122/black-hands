const { baseEmbed } = require('./embeds');

function buildWelcomeEmbed(client, member) {
  const { user, guild } = member;
  return baseEmbed(client)
    .setColor('#57F287')
    .setTitle('🩸 Willkommen bei Black Hands!')
    .setDescription(`Willkommen ${user}, das ist dein **Blood In**.`)
    .setThumbnail(member.displayAvatarURL({ size: 256 }))
    .addFields(
      { name: 'Mitglied', value: `${user.tag}`, inline: true },
      { name: 'Mitgliederanzahl', value: `${guild.memberCount}`, inline: true }
    );
}

function buildLeaveEmbed(client, member) {
  const { user, guild } = member;
  return baseEmbed(client)
    .setColor('#ED4245')
    .setTitle('🩸 Blood Out')
    .setDescription(`${user} hat Black Hands verlassen, das ist dein **Blood Out**.`)
    .setThumbnail(member.displayAvatarURL({ size: 256 }))
    .addFields(
      { name: 'Mitglied', value: `${user.tag}`, inline: true },
      { name: 'Mitgliederanzahl', value: `${guild.memberCount}`, inline: true }
    );
}

module.exports = { buildWelcomeEmbed, buildLeaveEmbed };
