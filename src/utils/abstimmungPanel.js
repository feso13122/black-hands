const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { baseEmbed } = require('./embeds');

function buildPollEmbed(client, poll, ended = false) {
  return baseEmbed(client)
    .setColor(ended ? '#95A5A6' : '#5865F2')
    .setTitle(ended ? '🗳️ Abstimmung beendet' : '🗳️ Abstimmung')
    .setDescription(poll.frage)
    .addFields(
      { name: '✅ Ja', value: `${poll.ja.length}`, inline: true },
      { name: '❌ Nein', value: `${poll.nein.length}`, inline: true }
    );
}

function buildPollRow(disabled = false) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('abstimmung_ja')
      .setLabel('Ja')
      .setEmoji('✅')
      .setStyle(ButtonStyle.Success)
      .setDisabled(disabled),
    new ButtonBuilder()
      .setCustomId('abstimmung_nein')
      .setLabel('Nein')
      .setEmoji('❌')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(disabled)
  );
}

module.exports = { buildPollEmbed, buildPollRow };
