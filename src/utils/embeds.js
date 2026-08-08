const { EmbedBuilder } = require('discord.js');
const config = require('../config.json');

function baseEmbed(client) {
  const embed = new EmbedBuilder()
    .setColor(config.embedColor || '#5865F2')
    .setTimestamp();

  if (client?.user) {
    embed.setFooter({
      text: 'Black Hands System',
      iconURL: client.user.displayAvatarURL()
    });
  }

  return embed;
}

function errorEmbed(description, client) {
  return baseEmbed(client)
    .setColor('#ED4245')
    .setTitle('❌ Fehler')
    .setDescription(description);
}

function successEmbed(description, client) {
  return baseEmbed(client)
    .setColor('#57F287')
    .setTitle('✅ Erfolg')
    .setDescription(description);
}

module.exports = { baseEmbed, errorEmbed, successEmbed };
