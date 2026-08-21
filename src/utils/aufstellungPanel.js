const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { baseEmbed } = require('./embeds');

function buildAufstellungEmbed(client, unix, poll, grund = '') {
  const embed = baseEmbed(client)
    .setColor('#5865F2')
    .setTitle('📢 Aufstellung')
    .setDescription(`Aufstellung ist am <t:${unix}:F> (<t:${unix}:R>).`);

  if (grund) {
    embed.addFields({
      name: '📝 Grund',
      value: grund,
      inline: false
    });
  }

  embed.addFields(
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

  embed.setFooter({ text: 'MFG der Autor' });
  return embed;
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
