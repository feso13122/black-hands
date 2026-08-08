const { baseEmbed } = require('../utils/embeds');
const { sendLog } = require('../utils/logger');

module.exports = {
  name: 'messageDelete',
  async execute(message) {
    if (!message.guild) return;
    if (message.author?.bot) return;
    if (!message.content && message.attachments.size === 0) return;

    const embed = baseEmbed(message.client)
      .setColor('#ED4245')
      .setTitle('🗑️ Nachricht gelöscht')
      .addFields(
        { name: 'Autor', value: message.author ? `${message.author} (${message.author.tag})` : 'Unbekannt', inline: false },
        { name: 'Channel', value: `${message.channel}`, inline: false },
        { name: 'Inhalt', value: message.content ? message.content.slice(0, 1024) : '*Kein Textinhalt*', inline: false }
      );

    if (message.attachments.size > 0) {
      embed.addFields({
        name: 'Anhänge',
        value: message.attachments.map(a => a.url).join('\n').slice(0, 1024)
      });
    }

    await sendLog(message.client, embed);
  }
};
