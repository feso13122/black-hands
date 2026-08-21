const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

function buildAufstellungMessage(unix, poll, grund = '') {
  const description = grund || 'Wer nicht reagiert und nicht erscheint fliegt morgen, und dann schauen wir wie es weitergeht.';

  let msg = `**Aufstellung am <t:${unix}:F> um <t:${unix}:t> Uhr am Anwesen.**\n\n${description}\n\n|| <@&1535782072491180153> ||\n\n`;

  msg += `✅ Da (${poll.da.length}): ${poll.da.length > 0 ? poll.da.map(id => `<@${id}>`).join(', ') : '—'}\n`;
  msg += `❌ Nicht da (${poll.nichtDa.length}): ${poll.nichtDa.length > 0 ? poll.nichtDa.map(id => `<@${id}>`).join(', ') : '—'}\n\nMFG der Autor`;

  return msg;
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
