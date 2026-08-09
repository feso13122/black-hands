const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { baseEmbed } = require('./embeds');

function buildAufstellungEmbed(client, unix, poll) {
  return baseEmbed(client)
    .setColor('#5865F2')
    .setTitle('📢 Aufstellung')
    .setDescription(`Aufstellung ist am <t:${unix}:F> (<t:${unix}:R>).`)
    .addFields(
      {
        name: `✅ Da (${poll.da.length})`,
        value: poll.da.length > 0 ? poll.da.map(id => `<@${id}>`).join(', ') : '—',
        inline: false
      },
      {
        name: `❌ Nicht da (${poll.nichtDa.length})`,
        value: poll.nichtDa.length > 0 ? poll.nichtDa.map(id => `<@${id}>`).join(', ') : '—',
        inline: false
      }
    );
}

function buildAufstellungRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('aufstellung_da')
      .setLabel('Da')
      .setEmoji('✅')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('aufstellung_nicht_da')
      .setLabel('Nicht da')
      .setEmoji('❌')
      .setStyle(ButtonStyle.Danger)
  );
}

module.exports = { buildAufstellungEmbed, buildAufstellungRow };
