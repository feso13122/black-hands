const { EmbedBuilder } = require('discord.js');
const config = require('../config.json');

function baseEmbed() {
  return new EmbedBuilder()
    .setColor(config.embedColor || '#5865F2')
    .setTimestamp();
}

function errorEmbed(description) {
  return baseEmbed()
    .setColor('#ED4245')
    .setTitle('❌ Fehler')
    .setDescription(description);
}

function successEmbed(description) {
  return baseEmbed()
    .setColor('#57F287')
    .setTitle('✅ Erfolg')
    .setDescription(description);
}

module.exports = { baseEmbed, errorEmbed, successEmbed };
